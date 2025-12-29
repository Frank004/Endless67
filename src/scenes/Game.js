import { Player } from '../prefabs/Player.js';
import { PatrolEnemy, ShooterEnemy, JumperShooterEnemy } from '../prefabs/Enemy.js';
import { Projectile } from '../prefabs/Projectile.js';
import { Coin } from '../prefabs/Coin.js';
import { Powerup } from '../prefabs/Powerup.js';
import { CollisionManager } from '../managers/CollisionManager.js';
import { LevelManager } from '../managers/LevelManager.js';
import { SlotGenerator } from '../managers/SlotGenerator.js';
import { InputManager } from '../managers/InputManager.js';
import { UIManager } from '../managers/UIManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { ParticleManager } from '../managers/ParticleManager.js';
import { RiserManager } from '../managers/RiserManager.js';
import { DebugManager } from '../managers/DebugManager.js';
import { updatePlatformRider } from '../utils/platformRider.js';
import EventBus, { Events } from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import PoolManager, { poolRegistry } from '../core/PoolManager.js';
import { Platform } from '../prefabs/Platform.js';
import { POOL, WALLS, PHYSICS } from '../config/GameConstants.js';
import { getDeviceInfo, applyDeviceClasses } from '../utils/DeviceDetection.js';
import { PowerupOverlay } from '../prefabs/PowerupOverlay.js';

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
        this.levelManager = new LevelManager(this); // Solo para pools y cleanup
        this.slotGenerator = new SlotGenerator(this); // ✅ Nuevo generador de slots
        this.inputManager = new InputManager(this);
        this.uiManager = new UIManager(this);
        this.audioManager = new AudioManager();
        this.audioManager.setScene(this);  // ← Necesario para que el audio funcione
        this.particleManager = new ParticleManager(this);
        this.riserManager = new RiserManager(this);
        this.debugManager = new DebugManager(this);

        // --- PHYSICS & CAMERA SETUP ---
        this.input.addPointer(3);
        // Physics bounds
        // Physics logic uses custom wall colliders, so world bounds are not strictly needed for player.
        this.physics.world.setBounds(0, 0, this.cameras.main.width, PHYSICS.WORLD_BOUNDS.MAX_Y);

        this.cameras.main.setBackgroundColor('#050505');
        this.cameras.main.setRoundPixels(true);
        this.cameras.main.setZoom(1); // Zoom entero para pixel-perfect

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
        // Overlay visual para powerup 67
        this.powerupOverlay = new PowerupOverlay(this, this.player);
        // Guardar referencia en el player para que pueda actualizar su posición
        this.player.powerupOverlay = this.powerupOverlay;

        // --- APLICAR OTROS DEBUG SETTINGS ---
        this.debugManager.applyDebugSettings();

        // --- INITIAL LEVEL GENERATION ---
        // Generar plataforma inicial para que el jugador empiece
        const START_WIDTH = 128;
        const START_PLATFORM_Y = 450;
        // Plataforma inicial estática (jugador empieza aquí)
        this.startPlatform = this.levelManager.spawnPlatform(this.cameras.main.centerX, START_PLATFORM_Y, START_WIDTH, false);

        // ─────────────────────────────────────────────────────────────
        // CREAR ANIMACIONES (ANTES de generar slots para que los objetos tengan animación desde el inicio)
        // ─────────────────────────────────────────────────────────────
        this.createCoinAnimation();
        this.createBasketballAnimation();

        // ✅ Inicializar generador de slots (crea los primeros 3 batches arriba de la plataforma de inicio)
        // IMPORTANTE: Esto debe ir DESPUÉS de crear animaciones para que los objetos spawneados tengan animación
        this.slotGenerator.init(START_PLATFORM_Y);

        // Limpieza de plataformas iniciales para evitar duplicados con la plataforma móvil de prueba
        if (this.platformPool) {
            this.platformPool.getActive().forEach(p => {
                if (p === this.startPlatform || p === this.movingTestPlatform) return;
                if (p.y <= START_PLATFORM_Y - 1) {
                    if (this.platforms) this.platforms.remove(p);
                    this.platformPool.despawn(p);
                }
            });
        }

        // --- LAVA & PARTICLES ---
        this.riserManager.createRiser();
        // Toggle lava/riser: set to false to disable while depuramos plataformas
        this.riserManager.setEnabled(false);
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
            if (this.particleManager) this.particleManager.destroy();
            this.cleanupGameEventListeners();
        });
    }

    /**
     * Crear animación del coin usando el sprite sheet
     */
    createCoinAnimation() {
        console.log('🎬 Iniciando creación de animación del coin...');
        
        // Verificar que el sprite sheet esté cargado
        if (!this.textures.exists('coins')) {
            console.error('❌ ERROR: Sprite sheet "coins" no encontrado');
            console.log('   Texturas disponibles:', Object.keys(this.textures.list));
            return;
        }

        console.log('✅ Sprite sheet "coins" encontrado');

        // Obtener el atlas y listar frames disponibles
        try {
            const texture = this.textures.get('coins');
            const availableFrames = texture.getFrameNames();
            console.log(`   Frames disponibles en atlas (${availableFrames.length}):`, availableFrames);
            
            // Verificar que los frames esperados existan
            const expectedFrames = ['coin-01.png', 'coin-02.png', 'coin-03.png', 'coin-04.png', 'coin-05.png', 'coin-06.png', 'coin-07.png', 'coin-08.png'];
            const missingFrames = expectedFrames.filter(f => !availableFrames.includes(f));
            if (missingFrames.length > 0) {
                console.warn(`   ⚠️ Frames faltantes: ${missingFrames.join(', ')}`);
            }
        } catch (e) {
            console.error('   Error al obtener frames:', e);
        }

        // Generar nombres de frames para la animación
        // Formato: coin-01.png, coin-02.png, ..., coin-08.png
        let frameNames;
        try {
            frameNames = this.anims.generateFrameNames('coins', {
                start: 1,
                end: 8,
                zeroPad: 2,  // 01, 02, 03, etc.
                prefix: 'coin-',
                suffix: '.png'
            });
            console.log(`   Frames generados: ${frameNames.length}`);
        } catch (e) {
            console.error('❌ ERROR al generar frames:', e);
            return;
        }

        // Verificar que se generaron frames
        if (!frameNames || frameNames.length === 0) {
            console.error('❌ ERROR: No se pudieron generar frames para la animación del coin');
            return;
        }

        // Mostrar detalles de los frames generados
        console.log('   Detalles de frames generados:');
        frameNames.forEach((frame, index) => {
            console.log(`     Frame ${index + 1}: key=${frame.textureKey || 'N/A'}, frame=${frame.frame || frame.textureFrame || 'N/A'}`);
        });

        // Crear la animación según el tutorial
        try {
            this.anims.create({
                key: 'coin_spin',
                frames: frameNames,
                frameRate: 12, // 12 FPS para animación suave
                repeat: -1 // Loop infinito
            });
            console.log(`✅ Animación 'coin_spin' creada exitosamente`);
        } catch (e) {
            console.error('❌ ERROR al crear animación:', e);
            return;
        }
        
        // Verificar que la animación se creó correctamente
        if (this.anims.exists('coin_spin')) {
            const anim = this.anims.get('coin_spin');
            console.log(`✅ Animación verificada: ${anim.key}, ${anim.frames.length} frames, ${anim.frameRate} FPS`);
        } else {
            console.error('❌ ERROR: La animación no se creó correctamente');
        }
    }

    /**
     * Crear animación del basketball usando el sprite sheet
     */
    createBasketballAnimation() {
        console.log('🎬 Iniciando creación de animación del basketball...');
        
        // Verificar que el sprite sheet esté cargado
        if (!this.textures.exists('basketball')) {
            console.warn('⚠️ Sprite sheet "basketball" no encontrado, usando fallback');
            console.log('   Texturas disponibles:', Object.keys(this.textures.list));
            return; // No crear animación si no existe el sprite sheet
        }

        console.log('✅ Sprite sheet "basketball" encontrado');

        // Obtener el atlas y listar frames disponibles
        let texture;
        let availableFrames = [];
        try {
            texture = this.textures.get('basketball');
            availableFrames = texture.getFrameNames();
            console.log(`   Frames disponibles en atlas (${availableFrames.length}):`, availableFrames);
        } catch (e) {
            console.error('   Error al obtener texture:', e);
            return;
        }

        // Generar nombres de frames para la animación
        // Formato: basketball 1.png, basketball 2.png, basketball 3.png
        // Los nombres tienen espacios, así que necesitamos crear los frames manualmente
        let frameNames = [];
        try {
            // Los frames se llaman "basketball 1.png", "basketball 2.png", "basketball 3.png"
            const frameOrder = ['basketball 1.png', 'basketball 2.png', 'basketball 3.png'];
            
            for (const frameName of frameOrder) {
                if (texture && texture.has(frameName)) {
                    // Para multiatlas, usar el formato: { key: 'textureKey', frame: 'frameName' }
                    frameNames.push({ key: 'basketball', frame: frameName });
                } else {
                    console.warn(`   ⚠️ Frame faltante: ${frameName}`);
                }
            }
            
            if (frameNames.length === 0) {
                console.error('❌ ERROR: No se encontraron frames válidos para basketball');
                console.log('   Frames disponibles:', availableFrames);
                return;
            }
            
            console.log(`   Frames generados: ${frameNames.length}`, frameNames.map(f => f.frame));
        } catch (e) {
            console.error('❌ ERROR al generar frames:', e);
            console.error('   Stack:', e.stack);
            return;
        }

        // Crear la animación
        try {
            if (!this.anims) {
                console.error('❌ ERROR: this.anims no está disponible');
                return;
            }
            
            this.anims.create({
                key: 'basketball_spin',
                frames: frameNames,
                frameRate: 8, // 8 FPS para animación suave
                repeat: -1 // Loop infinito
            });
            console.log(`✅ Animación 'basketball_spin' creada exitosamente`);
        } catch (e) {
            console.error('❌ ERROR al crear animación:', e);
            console.error('   Detalles del error:', e.message);
            if (e.stack) {
                console.error('   Stack:', e.stack);
            }
            // No retornar aquí, solo loguear el error para que el juego continúe
            return;
        }
        
        // Verificar que la animación se creó correctamente
        if (this.anims.exists('basketball_spin')) {
            const anim = this.anims.get('basketball_spin');
            console.log(`✅ Animación verificada: ${anim.key}, ${anim.frames.length} frames, ${anim.frameRate} FPS`);
        } else {
            console.warn('⚠️ La animación no se creó correctamente, pero el juego continuará');
        }
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
        // Verificar que los objetos principales existan antes de actualizar
        // Esto previene errores cuando se sale al menú y la escena se está destruyendo
        if (!this.player || !this.player.active || !this.player.scene) {
            return;
        }

        // Game Over Logic
        if (this.isGameOver) {
            if (this.riserManager) {
                this.riserManager.update(this.player.y, this.currentHeight, true);
            }
            return;
        }

        // Pause Logic
        if (this.isPausedEvent || this.isPaused) return;
        if (!this.gameStarted) return;

        // Player Update - now only handles physics, input is via EventBus
        if (this.player && this.player.update) {
            this.player.update();
        }
        // Wall clamping now handled by physical wall colliders

        // Manager Updates - verificar que existan antes de llamarlos
        if (this.inputManager) {
            this.inputManager.update();
        }
        
        // ✅ Actualizar generador de slots (genera nuevos batches según necesidad)
        if (this.slotGenerator) {
            this.slotGenerator.update();
        }
        
        // UIManager.update() removed - now uses EventBus listeners
        if (this.riserManager) {
            this.riserManager.update(this.player.y, this.currentHeight, false);
        }
        if (this.audioManager) {
            this.audioManager.updateAudio(this.player.y, this.riserManager?.riser?.y ?? this.player.y);
        }
        if (this.debugManager) {
            this.debugManager.updateHitboxVisual(); // Actualizar hitbox visual si está activo
            this.debugManager.updateRuler(); // Ruler overlay para distancias
        }

        // Update platformRider for coins and powerups
        // Verificar que los grupos existan antes de iterar
        if (this.coins && this.coins.children) {
            this.coins.children.iterate(coin => {
                if (coin && coin.active && coin.body) {
                    updatePlatformRider(coin);
                }
            });
        }
        if (this.powerups && this.powerups.children) {
            this.powerups.children.iterate(powerup => {
                if (powerup && powerup.active && powerup.body) {
                    updatePlatformRider(powerup);
                }
            });
        }

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

        // Physics Groups for Collision Manager
        // PoolManager objects are added here for arcade physics calculations
        this.platforms = this.physics.add.group({ allowGravity: false, immovable: true });

        // Crear PoolManager para coins
        this.coinPool = new PoolManager(
            this,
            'coins',
            Coin,
            POOL.INITIAL_SIZE.COINS || 20,
            POOL.GROW_SIZE || 5
        );
        poolRegistry.register('coins', this.coinPool);

        // Crear PoolManager para powerups
        this.powerupPool = new PoolManager(
            this,
            'powerups',
            Powerup,
            10, // Tamaño inicial del pool
            POOL.GROW_SIZE || 3
        );
        poolRegistry.register('powerups', this.powerupPool);

        // Physics Groups for Collision Manager
        // PoolManager objects are added here for arcade physics calculations
        this.coins = this.physics.add.group({ allowGravity: false, immovable: true, runChildUpdate: true, classType: Coin });
        this.powerups = this.physics.add.group({ allowGravity: false, immovable: true, runChildUpdate: true, classType: Powerup });

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

        // Physics Groups for Collision Manager
        this.patrolEnemies = this.physics.add.group({ classType: PatrolEnemy, allowGravity: true, immovable: false, runChildUpdate: true });
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
            // Asegurar que el body sea inmóvil (StaticBody no expone setImmovable)
            this.leftWall.body.immovable = true;
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
            // Asegurar que el body sea inmóvil (StaticBody no expone setImmovable)
            this.rightWall.body.immovable = true;
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

        if (this.powerupOverlay) {
            this.powerupOverlay.stop();
        }
    }

    /**
     * Triggers the "67" celebration effect.
     */
    trigger67Celebration() {
        this.uiManager.trigger67Celebration();
    }
}
