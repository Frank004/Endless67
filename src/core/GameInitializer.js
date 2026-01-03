import { CollisionManager } from '../managers/collision/CollisionManager.js';
import { LevelManager } from '../managers/level/LevelManager.js';
import { SlotGenerator } from '../managers/level/SlotGenerator.js';
import { InputManager } from '../managers/input/InputManager.js';
import { UIManager } from '../managers/ui/UIManager.js';
import { AudioManager } from '../managers/audio/AudioManager.js';
import { ParticleManager } from '../managers/gameplay/ParticleManager.js';
import { RiserManager } from '../managers/gameplay/RiserManager.js';
import { DebugManager } from '../managers/debug/DebugManager.js';
import { WallDecorator } from '../managers/level/WallDecorator.js';
import PoolManager, { poolRegistry } from './PoolManager.js';
import { Platform, PLATFORM_WIDTH, PLATFORM_HEIGHT } from '../prefabs/Platform.js';
import { Coin } from '../prefabs/Coin.js';
import { Powerup } from '../prefabs/Powerup.js';
import { PatrolEnemy, ShooterEnemy, JumperShooterEnemy } from '../prefabs/Enemy.js';
import { Projectile } from '../prefabs/Projectile.js';
import { POOL, WALLS, PHYSICS } from '../config/GameConstants.js';
import EventBus, { Events } from './EventBus.js';
import { getDeviceInfo, applyDeviceClasses } from '../utils/DeviceDetection.js';
import { ASSETS } from '../config/AssetKeys.js';

export class GameInitializer {
    constructor(scene) {
        this.scene = scene;
    }

    init() {
        this.setupCamera();
        this.setupDeviceDetection();
        this.createGroups();
        this.createWalls();
        this.createManagers();
        this.setupEvents();
    }

    setupDeviceDetection() {
        const scene = this.scene;
        const deviceInfo = getDeviceInfo(scene.sys.game);

        scene.isMobile = deviceInfo.isMobile;
        scene.isAndroid = deviceInfo.isAndroid;
        scene.isIOS = deviceInfo.isIOS;
        scene.isIPad = deviceInfo.isIPad;
        scene.isIPhone = deviceInfo.isIPhone;

        applyDeviceClasses(deviceInfo);

        console.log(`Device Detection: Mobile=${scene.isMobile}, Android=${scene.isAndroid}, iOS=${scene.isIOS}`);

        const checkOrientation = () => {
            if (window.innerWidth > window.innerHeight) {
                document.body.classList.add('landscape');
                document.body.classList.remove('portrait');
            } else {
                document.body.classList.add('portrait');
                document.body.classList.remove('landscape');
            }
        };

        scene._orientationHandlers = scene._orientationHandlers || {};
        scene._orientationHandlers.checkOrientation = checkOrientation;
        scene._orientationHandlers.visibilityHandler = () => {
            if (!document.hidden && scene.audioManager?.scene?.sound?.context) {
                scene.audioManager.scene.sound.context.resume().catch(() => { });
            }
        };

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        document.addEventListener('visibilitychange', scene._orientationHandlers.visibilityHandler);
        checkOrientation();
    }

    setupCamera() {
        const camera = this.scene.cameras.main;
        camera.setBackgroundColor('#050505');
        camera.setRoundPixels(true);
        camera.setZoom(1);
        this.scene.physics.world.setBounds(0, 0, camera.width, PHYSICS.WORLD_BOUNDS.MAX_Y);
    }

    createManagers() {
        const scene = this.scene;
        scene.collisionManager = new CollisionManager(scene);
        scene.levelManager = new LevelManager(scene);
        scene.slotGenerator = new SlotGenerator(scene);
        scene.inputManager = new InputManager(scene);
        scene.uiManager = new UIManager(scene);

        scene.audioManager = new AudioManager();
        scene.audioManager.setScene(scene);
        scene.audioManager.setupAudio();

        scene.input.once('pointerdown', () => {
            scene.audioManager.startMusic();
        });

        scene.particleManager = new ParticleManager(scene);
        scene.particleManager.createParticles();
        scene.riserManager = new RiserManager(scene);
        scene.debugManager = new DebugManager(scene);
        scene.wallDecorator = new WallDecorator(scene);
    }

    createGroups() {
        const scene = this.scene;

        // --- POOLS ---
        scene.platformPool = new PoolManager(scene, 'platforms', Platform, POOL.INITIAL_SIZE.PLATFORMS || 20, POOL.GROW_SIZE || 5);
        poolRegistry.register('platforms', scene.platformPool);

        scene.coinPool = new PoolManager(scene, 'coins', Coin, POOL.INITIAL_SIZE.COINS || 20, POOL.GROW_SIZE || 5);
        poolRegistry.register('coins', scene.coinPool);

        scene.powerupPool = new PoolManager(scene, 'powerups', Powerup, 10, POOL.GROW_SIZE || 3);
        poolRegistry.register('powerups', scene.powerupPool);

        scene.patrolEnemyPool = new PoolManager(scene, 'patrolEnemies', PatrolEnemy, POOL.INITIAL_SIZE.ENEMIES || 10, POOL.GROW_SIZE || 5);
        poolRegistry.register('patrolEnemies', scene.patrolEnemyPool);

        scene.shooterEnemyPool = new PoolManager(scene, 'shooterEnemies', ShooterEnemy, POOL.INITIAL_SIZE.ENEMIES || 10, POOL.GROW_SIZE || 5);
        poolRegistry.register('shooterEnemies', scene.shooterEnemyPool);

        scene.jumperShooterEnemyPool = new PoolManager(scene, 'jumperShooterEnemies', JumperShooterEnemy, POOL.INITIAL_SIZE.ENEMIES || 10, POOL.GROW_SIZE || 5);
        poolRegistry.register('jumperShooterEnemies', scene.jumperShooterEnemyPool);

        scene.projectilePool = new PoolManager(scene, 'projectiles', Projectile, POOL.INITIAL_SIZE.PROJECTILES || 15, POOL.GROW_SIZE || 5);
        poolRegistry.register('projectiles', scene.projectilePool);

        // --- GROUPS ---
        scene.platforms = scene.physics.add.group({ allowGravity: false, immovable: true });
        scene.coins = scene.physics.add.group({ allowGravity: false, immovable: true, runChildUpdate: true, classType: Coin });
        scene.powerups = scene.physics.add.group({ allowGravity: false, immovable: true, runChildUpdate: true, classType: Powerup });

        scene.patrolEnemies = scene.physics.add.group({ classType: PatrolEnemy, allowGravity: true, immovable: false, runChildUpdate: true });
        scene.shooterEnemies = scene.physics.add.group({ classType: ShooterEnemy, allowGravity: false, immovable: true, runChildUpdate: true });
        scene.jumperShooterEnemies = scene.physics.add.group({ classType: JumperShooterEnemy, allowGravity: true, immovable: false, runChildUpdate: true });

        scene.projectiles = scene.physics.add.group({
            classType: Projectile,
            allowGravity: false,
            runChildUpdate: true,
            maxSize: 50
        });

        scene.mazeWalls = scene.physics.add.staticGroup();
    }

    createWalls() {
        const scene = this.scene;
        const gameWidth = scene.cameras.main.width;
        const wallWidth = WALLS.WIDTH;
        const wallHeight = WALLS.HEIGHT;
        const wallYOffset = WALLS.Y_OFFSET;
        const wallDepth = WALLS.DEPTH;

        if (!scene.textures.exists(ASSETS.WALL_PLACEHOLDER)) {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0xffffff, 0);
            g.fillRect(0, 0, 2, 2);
            g.generateTexture(ASSETS.WALL_PLACEHOLDER, 2, 2);
            g.destroy();
        }

        scene.leftWall = scene.add.tileSprite(0, wallYOffset, wallWidth, wallHeight, ASSETS.WALL_PLACEHOLDER)
            .setOrigin(0, 0.5)
            .setDepth(wallDepth)
            .setVisible(false)
            .setAlpha(0);

        scene.rightWall = scene.add.tileSprite(gameWidth, wallYOffset, wallWidth, wallHeight, ASSETS.WALL_PLACEHOLDER)
            .setOrigin(1, 0.5)
            .setDepth(wallDepth)
            .setVisible(false)
            .setAlpha(0);

        scene.physics.add.existing(scene.leftWall, true);
        scene.physics.add.existing(scene.rightWall, true);

        if (scene.leftWall.body) {
            scene.leftWall.body.setSize(wallWidth, wallHeight);
            scene.leftWall.body.setOffset(0, -wallHeight / 2);
            scene.leftWall.body.updateFromGameObject();
        }
        if (scene.rightWall.body) {
            scene.rightWall.body.setSize(wallWidth, wallHeight);
            scene.rightWall.body.setOffset(-wallWidth, -wallHeight / 2);
            scene.rightWall.body.updateFromGameObject();
        }
    }

    setupEvents() {
        this.setupGameEventListeners();
        this.setupShutdownCleanup();
    }

    setupGameEventListeners() {
        const scene = this.scene;
        // Handle physics pause/resume when game state changes
        const pauseListener = () => {
            scene.physics.pause();
            scene.isPaused = true;
        };
        EventBus.on(Events.GAME_PAUSED, pauseListener);
        scene._pauseListener = pauseListener;

        const resumeListener = () => {
            scene.physics.resume();
            scene.isPaused = false;
        };
        EventBus.on(Events.GAME_RESUMED, resumeListener);
        scene._resumeListener = resumeListener;
    }

    setupShutdownCleanup() {
        const scene = this.scene;
        scene.events.once('shutdown', () => {
            if (scene.audioManager) scene.audioManager.stopAudio();
            if (scene.uiManager) scene.uiManager.destroy();
            if (scene.particleManager) scene.particleManager.destroy();

            // Cleanup event listeners
            if (scene._pauseListener) EventBus.off(Events.GAME_PAUSED, scene._pauseListener);
            if (scene._resumeListener) EventBus.off(Events.GAME_RESUMED, scene._resumeListener);

            // Clean global listeners
            const handlers = scene._orientationHandlers;
            if (handlers) {
                if (handlers.checkOrientation) {
                    window.removeEventListener('resize', handlers.checkOrientation);
                    window.removeEventListener('orientationchange', handlers.checkOrientation);
                }
                if (handlers.visibilityHandler) {
                    document.removeEventListener('visibilitychange', handlers.visibilityHandler);
                }
            }
        });
    }

    static updateWalls(scene) {
        const wallYOffset = WALLS.Y_OFFSET;
        const gameWidth = scene.cameras.main.width;
        const wallWidth = WALLS.WIDTH;

        if (scene.leftWall && scene.leftWall.active && scene.leftWall.body) {
            scene.leftWall.y = scene.cameras.main.scrollY + wallYOffset;
            scene.leftWall.x = 0;
            scene.leftWall.setVisible(false).setAlpha(0);
            scene.leftWall.body.setOffset(0, -WALLS.HEIGHT / 2);
            scene.leftWall.body.updateFromGameObject();
        }

        if (scene.rightWall && scene.rightWall.active && scene.rightWall.body) {
            scene.rightWall.y = scene.cameras.main.scrollY + wallYOffset;
            scene.rightWall.x = gameWidth;
            scene.rightWall.setVisible(false).setAlpha(0);
            scene.rightWall.body.setOffset(-wallWidth, -WALLS.HEIGHT / 2);
            scene.rightWall.body.updateFromGameObject();
        }

        if (scene.wallDecorator) {
            scene.wallDecorator.update(scene.cameras.main.scrollY);
        }
    }
}
