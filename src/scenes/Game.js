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
        // Las paredes tienen 32px de ancho, así que el área jugable es gameWidth - 64 (32px a cada lado)
        const gameWidth = this.cameras.main.width;
        const wallWidth = 32;
        const physicsWidth = gameWidth - (wallWidth * 2); // 32px margen a cada lado para las paredes
        this.physics.world.setBounds(wallWidth, -1000000, physicsWidth, 1000000 + 800);
        this.cameras.main.setBackgroundColor('#050505');

        // --- DEVICE DETECTION ---
        this.setupDeviceDetection();

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

        // --- PLAYER ---
        // Spawn player en el centro horizontal de la pantalla
        this.player = new Player(this, this.cameras.main.centerX, 400);

        // --- DEBUG SETUP ---
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
        this.inputManager.setupInputs();
        this.collisionManager.setupCollisions();
        this.audioManager.setupAudio();

        // --- CAMERA FOLLOW ---
        this.cameras.main.startFollow(this.player, true, 0, 0.1);
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

        // Player Update
        this.player.update(this.cursors, null, null, this.isMobile);

        // Manager Updates
        this.inputManager.update();
        this.levelManager.update();
        this.uiManager.update();
        this.lavaManager.update(this.player.y, this.currentHeight, false);
        this.audioManager.updateAudio(this.player.y, this.lava.y);

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
        if (h > this.currentHeight) this.currentHeight = h;
    }

    /**
     * Detects device type and adds CSS classes to the body.
     */
    setupDeviceDetection() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isTouchDevice = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

        this.isMobile = this.sys.game.device.os.android ||
            this.sys.game.device.os.iOS ||
            this.sys.game.device.os.iPad ||
            this.sys.game.device.os.iPhone ||
            this.sys.game.device.os.windowsPhone ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
            (isTouchDevice && /MacIntel/.test(navigator.platform)); // iPad Pro requesting desktop site

        this.isAndroid = this.sys.game.device.os.android || /Android/i.test(userAgent);
        this.isIOS = this.sys.game.device.os.iOS || /iPhone|iPad|iPod/i.test(userAgent) || (isTouchDevice && /MacIntel/.test(navigator.platform));
        this.isIPad = this.sys.game.device.os.iPad || /iPad/i.test(userAgent) || (isTouchDevice && /MacIntel/.test(navigator.platform) && !/iPhone/i.test(userAgent));
        this.isIPhone = this.sys.game.device.os.iPhone || /iPhone/i.test(userAgent);

        if (this.isMobile) {
            document.body.classList.add('mobile');
            if (this.isAndroid) document.body.classList.add('android');
            if (this.isIOS) document.body.classList.add('ios');
        }
    }

    /**
     * Creates physics groups for game objects.
     */
    createGroups() {
        this.platforms = this.physics.add.group({ allowGravity: false, immovable: true });

        // Coins and powerups need to be dynamic to use platformRider on moving platforms
        this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
        this.powerups = this.physics.add.group({ allowGravity: false, immovable: true });

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
     */
    createWalls() {
        const gameWidth = this.game.config.width;
        const wallWidth = 32;
        this.leftWall = this.add.tileSprite(0, 300, wallWidth, 1200, 'wall').setOrigin(0, 0.5).setDepth(60);
        this.rightWall = this.add.tileSprite(gameWidth, 300, wallWidth, 1200, 'wall').setOrigin(1, 0.5).setDepth(60);
        this.physics.add.existing(this.leftWall, true);
        this.physics.add.existing(this.rightWall, true);
    }

    /**
     * Updates wall positions to follow the camera.
     */
    updateWalls() {
        if (this.leftWall && this.leftWall.active && this.leftWall.body) {
            this.leftWall.y = this.cameras.main.scrollY + 300;
            this.leftWall.x = 0;
            this.leftWall.body.updateFromGameObject();
        }

        if (this.rightWall && this.rightWall.active && this.rightWall.body) {
            this.rightWall.y = this.cameras.main.scrollY + 300;
            const gameWidth = this.game.config.width;
            this.rightWall.x = gameWidth;
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
     */
    toggleSound() {
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
