import { ManagerInitializer } from './initializers/ManagerInitializer.js';
import { PoolInitializer } from './initializers/PoolInitializer.js';
import { POOL, WALLS, PHYSICS } from '../config/GameConstants.js';
import EventBus, { Events } from './EventBus.js';
import { DeviceConfig } from './config/DeviceConfig.js';
import { ASSETS } from '../config/AssetKeys.js';
import { LAYOUT_CONFIG } from '../config/LayoutConfig.js';


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
        DeviceConfig.setup(this.scene);
    }

    setupCamera() {
        const camera = this.scene.cameras.main;
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;

        camera.setBackgroundColor('#050505');
        camera.setRoundPixels(true);
        camera.setZoom(1);

        // Standard Full Viewport
        camera.setViewport(0, 0, screenWidth, screenHeight);

        // Physics bounds
        this.scene.physics.world.setBounds(0, -PHYSICS.WORLD_BOUNDS.MAX_Y, screenWidth, PHYSICS.WORLD_BOUNDS.MAX_Y * 2);

        // Camera bounds restricted to content
        camera.setBounds(0, -PHYSICS.WORLD_BOUNDS.MAX_Y, screenWidth, PHYSICS.WORLD_BOUNDS.MAX_Y + screenHeight);
    }

    createManagers() {
        ManagerInitializer.init(this.scene);
    }

    createGroups() {
        PoolInitializer.init(this.scene);
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

        const gameOverListener = () => {
            scene.physics.pause();
            scene.isGameOver = true;
            scene.isPaused = true;
        };
        EventBus.on(Events.GAME_OVER, gameOverListener);
        scene._gameOverListener = gameOverListener;

        const gameStartListener = () => {
            scene.physics.resume();
            scene.isGameOver = false;
            scene.isPaused = false;
            scene.gameStarted = true;
            // Ensure music starts if not already playing (e.g. keyboard start)
            if (scene.audioManager) {
                scene.audioManager.startMusic();
            }
        };
        EventBus.on(Events.GAME_STARTED, gameStartListener);
        scene._gameStartListener = gameStartListener;
    }

    setupShutdownCleanup() {
        const scene = this.scene;
        scene.events.once('shutdown', () => {
            if (scene.audioManager) scene.audioManager.stopAudio();
            if (scene.uiManager) scene.uiManager.destroy();
            if (scene.particleManager) scene.particleManager.destroy();
            if (scene.interactableManager) scene.interactableManager.destroy();
            if (scene.wallDecorator) scene.wallDecorator.destroy(); // Fix: Clean up wall decoration pools

            // Failsafe: Clear static pools from WallDecorFactory
            // Import WallDecorFactory dynamically if needed, or rely on manager cleanup
            try {
                // We assume wallDecorator.destroy() calls Factory.clearPools(), but safe to ensure references are killed
            } catch (e) { }

            // Cleanup event listeners
            if (scene._pauseListener) EventBus.off(Events.GAME_PAUSED, scene._pauseListener);
            if (scene._resumeListener) EventBus.off(Events.GAME_RESUMED, scene._resumeListener);
            if (scene._gameOverListener) EventBus.off(Events.GAME_OVER, scene._gameOverListener);
            if (scene._gameStartListener) EventBus.off(Events.GAME_STARTED, scene._gameStartListener);

            // Clean global listeners
            DeviceConfig.cleanup(scene);
        });
    }

    static updateWalls(scene) {
        // 🚀 OPTIMIZATION: Throttle wall updates more aggressively
        // Update every 2 frames on desktop, every 3 frames on mobile
        const isMobile = scene.isMobile || false;
        const isFirstUpdate = scene._wallUpdateFrame === undefined;
        const gameJustStarted = scene.gameStarted && (scene._wallJustStarted === undefined || scene._wallJustStarted);

        if (gameJustStarted) {
            scene._wallJustStarted = false; // Mark that we've handled the start
        }

        // Always update on first call or when game just started
        if (isFirstUpdate || gameJustStarted) {
            scene._wallUpdateFrame = (scene._wallUpdateFrame || 0) + 1;
        } else {
            scene._wallUpdateFrame = (scene._wallUpdateFrame || 0) + 1;
            // Skip frames: every 2nd frame on desktop, every 3rd frame on mobile
            const throttleRate = isMobile ? 3 : 2;
            if (scene._wallUpdateFrame % throttleRate !== 0) {
                return; // Skip this update
            }
        }

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
            // Asegurar que los segmentos se inicialicen si no existen
            scene.wallDecorator.ensurePatterns();
            scene.wallDecorator.update(scene.cameras.main.scrollY);
        }
    }
}
