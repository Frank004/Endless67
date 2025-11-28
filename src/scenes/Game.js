import { Player } from '../prefabs/Player.js';
import { PatrolEnemy, ShooterEnemy, JumperShooterEnemy } from '../prefabs/Enemy.js';
import { Projectile } from '../prefabs/Projectile.js';
import { CollisionManager } from '../managers/CollisionManager.js';
import { LevelManager } from '../managers/LevelManager.js';
import { InputManager } from '../managers/InputManager.js';
import { UIManager } from '../managers/UIManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { ParticleManager } from '../managers/ParticleManager.js';
import { LavaManager } from '../managers/LavaManager.js';
import { DebugManager } from '../managers/DebugManager.js';
import { updatePlatformRider } from '../utils/platformRider.js';
import EventBus, { Events } from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import PoolManager, { poolRegistry } from '../core/PoolManager.js';
import { Platform } from '../prefabs/Platform.js';
import { POOL, WALLS, PHYSICS } from '../config/GameConstants.js';
import { getDeviceInfo, applyDeviceClasses } from '../utils/DeviceDetection.js';

/**
 * @phasereditor
 * @scene Game
 * @width 400
 * @height 600
 * @backgroundColor 0x050505
 */
export class Game extends Phaser.Scene {
    constructor(key = 'Game') {
        super(key);
    }

    /**
     * Initialize the game scene.
     * Sets up managers, physics, input, and initial game state.
     */
    create() {
        // --- MANAGERS ---
        this.collisionManager = new CollisionManager(this);
        this.levelManager = new LevelManager(this);
        this.inputManager = new InputManager(this);
        this.uiManager = new UIManager(this);
        this.audioManager = new AudioManager(this);
        this.particleManager = new ParticleManager(this);
        this.lavaManager = new LavaManager(this);
        this.debugManager = new DebugManager(this);

        // --- PHYSICS & CAMERA SETUP ---
        this.input.addPointer(3);
        // Physics bounds: dinámico basado en el ancho del juego
        // Usar constantes centralizadas para parámetros de paredes
        // IMPORTANTE: Los bounds deben coincidir exactamente con las paredes para evitar penetración
        // Las paredes ocupan desde x=0 hasta x=wallWidth (izquierda) y desde x=gameWidth-wallWidth hasta x=gameWidth (derecha)
        // El área jugable va desde x=wallWidth hasta x=gameWidth-wallWidth
        const gameWidth = this.cameras.main.width;
        const wallWidth = WALLS.WIDTH;
        const physicsLeft = wallWidth; // Borde izquierdo del área jugable (donde termina la pared izquierda)
        const physicsRight = gameWidth - wallWidth; // Borde derecho del área jugable (donde empieza la pared derecha)
        const physicsWidth = physicsRight - physicsLeft; // Ancho del área jugable
        this.physics.world.setBounds(
            physicsLeft,
            PHYSICS.WORLD_BOUNDS.MIN_Y,
            physicsWidth,
            PHYSICS.WORLD_BOUNDS.MAX_Y
        );
        this.cameras.main.setBackgroundColor('#050505');

        // --- DEVICE DETECTION ---
        this.setupDeviceDetection(); // Usa DeviceDetection centralizado

        // --- GAME STATE VARIABLES ---
        this.gameStarted = false;
        this.isGameOver = false;
        this.isPausedEvent = false;
        this.isPaused = false;
        this.totalScore = 0;
        this.heightOffset = 0;
        this.currentHeight = 0;

        // Powerup State
        this.isInvincible = false;
        this.powerupTimer = null;
        this.lastPowerupSpawnHeight = -1000;
        this.lastPowerupTime = -15000;

        // --- GROUPS ---
        this.createGroups();

        // --- WALLS ---
        this.createWalls();

        // --- DEBUG SETUP (ANTES DE CREAR PLAYER) ---
        // Configurar toggle de Player PNG ANTES de crear el player
        // El toggle se lee desde DebugManager y se guarda en registry para acceso global
        this.registry.set('usePlayerPNG', this.debugManager.usePlayerPNG);

        // --- PLAYER ---
        // Spawn player en el centro horizontal de la pantalla
        // El Player leerá el toggle del registry para decidir qué textura usar
        this.player = new Player(this, this.cameras.main.centerX, 400);

        // --- APLICAR OTROS DEBUG SETTINGS ---
        this.debugManager.applyDebugSettings();

        // --- INITIAL LEVEL GENERATION ---
        // Spawn plataforma inicial en el centro horizontal
        this.levelManager.spawnPlatform(this.cameras.main.centerX, 450, 140, false);
        this.levelManager.lastPlatformY = 450;
        for (let i = 0; i < 6; i++) this.levelManager.generateNextRow();

        // --- LAVA & PARTICLES ---
        this.lavaManager.createLava();
        this.particleManager.createParticles();

        // --- SETUP MANAGERS ---
        this.uiManager.createUI();
        this.uiManager.setupEventListeners(); // Setup EventBus listeners
        this.inputManager.setupInputs();
        this.collisionManager.setupCollisions();
        this.audioManager.setupAudio();

        // --- SETUP EVENT LISTENERS ---
        this.setupGameEventListeners();

        // --- CAMERA FOLLOW ---
        this.cameras.main.startFollow(this.player, true, 0, 0.1);

        // --- CLEANUP ON SCENE SHUTDOWN ---
        this.events.once('shutdown', () => {
            this.audioManager.stopAudio();
            this.uiManager.destroy(); // Clean up event listeners
            this.cleanupGameEventListeners();
        });
    }

    /**
     * Setup EventBus listeners for game state changes
     */
    setupGameEventListeners() {
        // Handle physics pause/resume when game state changes
        const pauseListener = () => {
            this.physics.pause();
            this.isPaused = true;
        };
        EventBus.on(Events.GAME_PAUSED, pauseListener);
        this._pauseListener = pauseListener;

        const resumeListener = () => {
            this.physics.resume();
            this.isPaused = false;
        };
        EventBus.on(Events.GAME_RESUMED, resumeListener);
        this._resumeListener = resumeListener;
    }

    /**
     * Clean up game event listeners
     */
    cleanupGameEventListeners() {
        if (this._pauseListener) {
            EventBus.off(Events.GAME_PAUSED, this._pauseListener);
        }
        if (this._resumeListener) {
            EventBus.off(Events.GAME_RESUMED, this._resumeListener);
        }
    }

    /**
     * Main game loop.
     * Delegates updates to managers and handles game state transitions.
     */
    update() {
        // Game Over Logic
        if (this.isGameOver) {
            this.lavaManager.update(this.player.y, this.currentHeight, true);
            return;
        }

        // Pause Logic
        if (this.isPausedEvent || this.isPaused) return;
        if (!this.gameStarted) return;

        // Player Update - now only handles physics, input is via EventBus
        this.player.update();

        // Manager Updates
        this.inputManager.update();
        this.levelManager.update();
        // UIManager.update() removed - now uses EventBus listeners
        this.lavaManager.update(this.player.y, this.currentHeight, false);
        this.audioManager.updateAudio(this.player.y, this.lava.y);
        this.debugManager.updateHitboxVisual(); // Actualizar hitbox visual si está activo

        // Update platformRider for coins and powerups
        this.coins.children.iterate(coin => {
            if (coin && coin.active) updatePlatformRider(coin);
        });
        this.powerups.children.iterate(powerup => {
            if (powerup && powerup.active) updatePlatformRider(powerup);
        });

        // Wall Movement (Keep walls fixed relative to camera)
        this.updateWalls();

        // Height Calculation
        // Usar altura de referencia dinámica (400 era la altura inicial de referencia)
        const referenceHeight = 400;
        let h = Math.floor((referenceHeight - this.player.y) / 10) + this.heightOffset;
        if (h > this.currentHeight) {
            this.currentHeight = h;
            // Update GameState and emit event
            GameState.updateHeight(this.currentHeight);
        }
    }

    /**
     * Detects device type and adds CSS classes to the body.
     * Usa el sistema centralizado de detección de dispositivos.
     */
    setupDeviceDetection() {
        const deviceInfo = getDeviceInfo(this.sys.game);

        // Asignar propiedades para compatibilidad
        this.isMobile = deviceInfo.isMobile;
        this.isAndroid = deviceInfo.isAndroid;
        this.isIOS = deviceInfo.isIOS;
        this.isIPad = deviceInfo.isIPad;
        this.isIPhone = deviceInfo.isIPhone;

        // Aplicar clases CSS
        applyDeviceClasses(deviceInfo);

        console.log(`Device Detection: Mobile=${this.isMobile}, Android=${this.isAndroid}, iOS=${this.isIOS}`);

        // Orientation Check
        const checkOrientation = () => {
            if (window.innerWidth > window.innerHeight) {
                document.body.classList.add('landscape');
                document.body.classList.remove('portrait');
            } else {
                document.body.classList.add('portrait');
                document.body.classList.remove('landscape');
            }
        };

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        checkOrientation(); // Initial check
    }

    /**
     * Creates physics groups for game objects.
     */
    createGroups() {
        // Crear PoolManager para plataformas
        this.platformPool = new PoolManager(
            this,
            'platforms',
            Platform,
            POOL.INITIAL_SIZE.PLATFORMS || 20,
            POOL.GROW_SIZE || 5
        );

        // Registrar en el registry global (para debugging)
        poolRegistry.register('platforms', this.platformPool);

        // Mantener grupo legacy para compatibilidad temporal (se eliminará después)
        this.platforms = this.physics.add.group({ allowGravity: false, immovable: true });

        // Coins and powerups need to be dynamic to use platformRider on moving platforms
        this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
        this.powerups = this.physics.add.group({ allowGravity: false, immovable: true });

        // Crear pools para enemigos
        this.patrolEnemyPool = new PoolManager(
            this,
            'patrolEnemies',
            PatrolEnemy,
            POOL.INITIAL_SIZE.ENEMIES || 10,
            POOL.GROW_SIZE || 5
        );
        poolRegistry.register('patrolEnemies', this.patrolEnemyPool);

        this.shooterEnemyPool = new PoolManager(
            this,
            'shooterEnemies',
            ShooterEnemy,
            POOL.INITIAL_SIZE.ENEMIES || 10,
            POOL.GROW_SIZE || 5
        );
        poolRegistry.register('shooterEnemies', this.shooterEnemyPool);

        this.jumperShooterEnemyPool = new PoolManager(
            this,
            'jumperShooterEnemies',
            JumperShooterEnemy,
            POOL.INITIAL_SIZE.ENEMIES || 10,
            POOL.GROW_SIZE || 5
        );
        poolRegistry.register('jumperShooterEnemies', this.jumperShooterEnemyPool);

        // Crear pool para proyectiles
        this.projectilePool = new PoolManager(
            this,
            'projectiles',
            Projectile,
            POOL.INITIAL_SIZE.PROJECTILES || 15,
            POOL.GROW_SIZE || 5
        );
        poolRegistry.register('projectiles', this.projectilePool);

        // Mantener grupos legacy para compatibilidad (colisiones, etc.)
        // Los objetos del pool se agregarán a estos grupos cuando se spawnean
        this.patrolEnemies = this.physics.add.group({ classType: PatrolEnemy, allowGravity: false, immovable: true, runChildUpdate: true });
        this.shooterEnemies = this.physics.add.group({ classType: ShooterEnemy, allowGravity: false, immovable: true, runChildUpdate: true });
        this.jumperShooterEnemies = this.physics.add.group({ classType: JumperShooterEnemy, allowGravity: true, immovable: false, runChildUpdate: true });
        this.projectiles = this.physics.add.group({
            classType: Projectile,
            allowGravity: false,
            runChildUpdate: true,
            maxSize: 50
        });
        this.mazeWalls = this.physics.add.staticGroup();
    }

    /**
     * Creates the side walls.
     * IMPORTANTE: Los bodies de las paredes deben estar perfectamente alineados
     * con los bounds del mundo físico para evitar penetración del jugador.
     */
    createWalls() {
        const gameWidth = this.cameras.main.width;
        const wallWidth = WALLS.WIDTH;
        const wallHeight = WALLS.HEIGHT;
        const wallYOffset = WALLS.Y_OFFSET;
        const wallDepth = WALLS.DEPTH;

        // Crear paredes: leftWall en x=0, rightWall en x=gameWidth
        // Usar setOrigin(0, 0.5) para leftWall y setOrigin(1, 0.5) para rightWall
        // para que el sprite visual esté correctamente posicionado
        this.leftWall = this.add.tileSprite(0, wallYOffset, wallWidth, wallHeight, 'wall')
            .setOrigin(0, 0.5)
            .setDepth(wallDepth);
        this.rightWall = this.add.tileSprite(gameWidth, wallYOffset, wallWidth, wallHeight, 'wall')
            .setOrigin(1, 0.5)
            .setDepth(wallDepth);

        // Agregar física a las paredes (static = true para que sean inamovibles)
        this.physics.add.existing(this.leftWall, true);
        this.physics.add.existing(this.rightWall, true);

        // CRÍTICO: Configurar los bodies de las paredes para que coincidan exactamente
        // con su posición visual y los bounds del mundo físico
        // IMPORTANTE: Con setOrigin(0, 0.5) y setOrigin(1, 0.5), Phaser ajusta automáticamente
        // la posición del body, pero debemos asegurarnos de que el tamaño y offset sean correctos
        if (this.leftWall.body) {
            // Pared izquierda: body desde x=0 hasta x=wallWidth
            // Con setOrigin(0, 0.5), el gameObject está en x=0 y el sprite se extiende hasta x=wallWidth
            // El body debe cubrir exactamente desde x=0 hasta x=wallWidth
            this.leftWall.body.setSize(wallWidth, wallHeight);
            // Offset en Y para centrar verticalmente (el origin está en 0.5 verticalmente)
            this.leftWall.body.setOffset(0, -wallHeight / 2);
            // Asegurar que el body esté sincronizado con el gameObject
            this.leftWall.body.updateFromGameObject();
        }
        if (this.rightWall.body) {
            // Pared derecha: body desde x=gameWidth-wallWidth hasta x=gameWidth
            // Con setOrigin(1, 0.5), el gameObject está en x=gameWidth y el sprite se extiende desde x=gameWidth-wallWidth
            // El body debe cubrir exactamente desde x=gameWidth-wallWidth hasta x=gameWidth
            this.rightWall.body.setSize(wallWidth, wallHeight);
            // Offset en X: -wallWidth para que el body empiece en x=gameWidth-wallWidth
            // Offset en Y: -wallHeight/2 para centrar verticalmente
            this.rightWall.body.setOffset(-wallWidth, -wallHeight / 2);
            // Asegurar que el body esté sincronizado con el gameObject
            this.rightWall.body.updateFromGameObject();
        }
    }

    /**
     * Updates wall positions to follow the camera.
     * IMPORTANTE: Mantener los bodies de las paredes correctamente posicionados
     * para evitar que el jugador penetre las paredes.
     */
    updateWalls() {
        const wallYOffset = WALLS.Y_OFFSET;
        const gameWidth = this.cameras.main.width;
        const wallWidth = WALLS.WIDTH;

        if (this.leftWall && this.leftWall.active && this.leftWall.body) {
            this.leftWall.y = this.cameras.main.scrollY + wallYOffset;
            this.leftWall.x = 0;
            // Asegurar que el body mantenga su offset correcto
            this.leftWall.body.setOffset(0, -WALLS.HEIGHT / 2);
            this.leftWall.body.updateFromGameObject();
        }

        if (this.rightWall && this.rightWall.active && this.rightWall.body) {
            this.rightWall.y = this.cameras.main.scrollY + wallYOffset;
            this.rightWall.x = gameWidth;
            // Asegurar que el body mantenga su offset correcto
            this.rightWall.body.setOffset(-wallWidth, -WALLS.HEIGHT / 2);
            this.rightWall.body.updateFromGameObject();
        }
    }

    /**
     * Starts the game, enabling music and hiding the start UI.
     */
    startGame() {
        this.gameStarted = true;
        this.uiText.setVisible(false);
        this.audioManager.startMusic();
    }

    /**
     * Toggles sound on/off.
     * Now uses GameState to manage sound state.
     */
    toggleSound() {
        GameState.toggleSound();
        // AudioManager will listen to SOUND_TOGGLED event
        this.audioManager.toggleSound();
    }

    /**
     * Activates invincibility powerup.
     */
    activateInvincibility() {
        this.isInvincible = true;
        if (this.powerupTimer) this.powerupTimer.remove();
        this.powerupTimer = this.time.delayedCall(12000, () => {
            this.deactivatePowerup();
        });
    }

    /**
     * Deactivates invincibility powerup.
     */
    deactivatePowerup() {
        this.isInvincible = false;
        this.auraEmitter.stop();
        this.player.setTint(0xaaaaaa);
        this.time.delayedCall(200, () => this.player.clearTint());
    }

    /**
     * Triggers the "67" celebration effect.
     */
    trigger67Celebration() {
        this.uiManager.trigger67Celebration();
    }
}
