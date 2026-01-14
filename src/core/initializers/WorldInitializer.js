import { WALLS, PHYSICS } from '../../config/GameConstants.js';
import { ASSETS } from '../../config/AssetKeys.js';
import { PoolInitializer } from './PoolInitializer.js';

export class WorldInitializer {
    static init(scene) {
        this.setupCamera(scene);
        this.createGroups(scene);
        this.createWalls(scene);
    }

    static setupCamera(scene) {
        const camera = scene.cameras.main;
        const screenWidth = scene.scale.width;
        const screenHeight = scene.scale.height;

        camera.setBackgroundColor('#050505');
        camera.setRoundPixels(true);
        camera.setZoom(1);

        // Standard Full Viewport
        camera.setViewport(0, 0, screenWidth, screenHeight);

        // Physics bounds
        scene.physics.world.setBounds(0, -PHYSICS.WORLD_BOUNDS.MAX_Y, screenWidth, PHYSICS.WORLD_BOUNDS.MAX_Y * 2);

        // Camera bounds restricted to content
        camera.setBounds(0, -PHYSICS.WORLD_BOUNDS.MAX_Y, screenWidth, PHYSICS.WORLD_BOUNDS.MAX_Y + screenHeight);
    }

    static createGroups(scene) {
        PoolInitializer.init(scene);
    }

    static createWalls(scene) {
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
