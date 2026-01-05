import { GAME_CONFIG } from '../../config/GameConstants.js';
import { BACKGROUND_PATTERNS, DECO_FRAMES } from '../../data/BackgroundPatterns.js';

/**
 * BackgroundManager
 * 
 * Manages the dynamic, multi-layered background system.
 * 
 * Layers:
 * 1. Base Layer (Depth -20): Darkened tile sprite for depth perception.
 * 2. Deco Layer (Depth -15): Parallax decorations using recycled segments.
 * 3. Future Layers: Cables, Signs (to be implemented).
 */
export class BackgroundManager {
    constructor(scene) {
        this.scene = scene;
        this.bgLayer = null; // TileSprite
        this.decoGroup = null; // Group for pooled decos

        // Parallax settings
        this.parallaxFactor = 0.5; // Moves at half the speed of the camera
        this.baseTint = 0x1a1a1a; // Almost black/grey

        // Pooling logic
        this.segments = []; // Active segments
        this.pool = []; // Inactive sprites
        this.segmentHeight = 640; // Approx 1 screen height
        this.bufferSegments = 2; // Keep 2 segments above/below view

        // Dimensions
        this.viewWidth = GAME_CONFIG.RESOLUTIONS.MOBILE.width; // Base design width
        this.viewHeight = GAME_CONFIG.RESOLUTIONS.MOBILE.height;

        this.initialized = false;
    }

    create() {
        if (!this.scene.textures.exists('walls')) return;

        const cam = this.scene.cameras.main;
        const width = cam.width;
        const height = cam.height;

        // 1. Create Base Layer (TileSprite)
        this.bgLayer = this.scene.add.tileSprite(0, 0, width, height, 'walls', 'wall-bg.png');
        this.bgLayer.setOrigin(0, 0);
        this.bgLayer.setScrollFactor(0); // Manually controlled for parallax
        this.bgLayer.setDepth(-20);
        this.bgLayer.setTint(this.baseTint);

        // 3. Deco Layer Group
        this.decoGroup = this.scene.add.group({
            classType: Phaser.GameObjects.Image,
            maxSize: 60, // Limit objects
            runChildUpdate: false
        });

        // 3b. Cables Layer Group (New)
        this.cableGroup = this.scene.add.group({
            classType: Phaser.GameObjects.Image,
            maxSize: 15,
            runChildUpdate: false
        });
        // this.nextCableY is no longer used, we use this.minCableY for upward spawning



        // 5. Side Shadows (Depth Dimension)
        this.createSideShadows(width, height);

        // 6. Init FG Cables
        this.initFgCables();



        this.initialized = true;

        // Init initial segments
        this.updateSegments(0);
    }



    createSideShadows(width, height) {
        const textureName = 'side_shadows';
        if (!this.scene.textures.exists(textureName)) {
            const canvas = this.scene.textures.createCanvas(textureName, width, height);
            const ctx = canvas.context;
            const shadowWidth = 60; // pixel width of shadow

            // Left Shadow
            const leftGrd = ctx.createLinearGradient(0, 0, shadowWidth, 0);
            leftGrd.addColorStop(0, 'rgba(0,0,0,0.9)');
            leftGrd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = leftGrd;
            ctx.fillRect(0, 0, shadowWidth, height);

            // Right Shadow
            const rightGrd = ctx.createLinearGradient(width - shadowWidth, 0, width, 0);
            rightGrd.addColorStop(0, 'rgba(0,0,0,0)');
            rightGrd.addColorStop(1, 'rgba(0,0,0,0.9)');
            ctx.fillStyle = rightGrd;
            ctx.fillRect(width - shadowWidth, 0, shadowWidth, height);

            canvas.refresh();
        }

        const shadows = this.scene.add.image(width / 2, height / 2, textureName);
        shadows.setScrollFactor(0);
        shadows.setDepth(-4); // On top of BG and Vignette even
    }



    /**
     * Manages creation and recycling of decoration segments
     * based on the Parallax Scroll Y position.
     */
    updateSegments(bgScrollY) {
        const cam = this.scene.cameras.main;
        const topY = bgScrollY - (this.segmentHeight * 1); // 1 segment buffer above
        const bottomY = bgScrollY + cam.height + (this.segmentHeight * 1); // 1 segment buffer below

        // 1. Remove/Recycle segments out of range
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const seg = this.segments[i];
            if (seg.y + this.segmentHeight < topY || seg.y > bottomY) {
                this.recycleSegment(seg);
                this.segments.splice(i, 1);
            }
        }

        // 2. Add new segments if gaps exist
        // We need to cover from floor(topY) to ceil(bottomY)
        const startIdx = Math.floor(topY / this.segmentHeight);
        const endIdx = Math.ceil(bottomY / this.segmentHeight);

        for (let i = startIdx; i <= endIdx; i++) {
            const targetY = i * this.segmentHeight;
            const exists = this.segments.some(s => s.y === targetY);
            if (!exists) {
                this.createSegment(targetY);
            }
        }
    }

    createSegment(y) {
        // Pick a random pattern
        const pattern = Phaser.Utils.Array.GetRandom(BACKGROUND_PATTERNS);
        const items = [];
        const cam = this.scene.cameras.main;

        // Create sprites for this pattern
        pattern.items.forEach(itemCfg => {
            // Determine texture frame
            let frame = itemCfg.type;
            if (frame === 'random') {
                frame = Phaser.Utils.Array.GetRandom(DECO_FRAMES);
            }

            // Get sprite from pool
            let sprite = this.decoGroup.get();
            if (!sprite) return; // Pool full

            // Position relative to segment
            // X is relative to screen width (0-1)
            // Y is relative to segment height (0-1) + segment base Y
            const posX = itemCfg.x * cam.width;
            const posY = y + (itemCfg.y * this.segmentHeight);

            sprite.setTexture('walls', frame);
            sprite.setPosition(posX, posY);
            sprite.setDepth(-15);
            sprite.setTint(this.baseTint); // Match base layer tint
            sprite.setActive(true).setVisible(true);

            sprite.setScrollFactor(0);
            sprite.setData('logicalY', posY); // Store absolute BG space Y
            items.push(sprite);
        });

        this.segments.push({ y, items });
    }

    recycleSegment(seg) {
        seg.items.forEach(sprite => {
            this.decoGroup.killAndHide(sprite);
        });
        seg.items = [];
    }

    updateCables(scrollY) {
        // IGNORE parallax argument, use REAL scrollY for cables to lock them to world (or 1.0 parallax)
        const cam = this.scene.cameras.main;
        const realScrollY = cam.scrollY;

        const viewTop = realScrollY - 200; // Buffer above (higher negative)
        const viewBottom = realScrollY + cam.height + 200; // Buffer below

        // Initialize minCableY if first run (start at current camera BOTTOM to fill screen)
        if (this.minCableY === undefined) {
            this.minCableY = viewBottom;
        }

        // 1. Spawn new cables UPWARDS
        while (this.minCableY > viewTop) {
            // User request: Start from "30 meters" (approx -3000px height)
            if (this.minCableY < -3000) {
                this.spawnCable(this.minCableY);
            }
            // User request: "render menos veces" -> Increased gap significantly
            this.minCableY -= Phaser.Math.Between(800, 1200);
        }

        // 2. Update/Recycle existing cables
        this.cableGroup.children.iterate(cable => {
            if (!cable.active) return;

            const logicalY = cable.getData('logicalY');

            // Cleanup if went too far DOWN (Active cables are above, if logicY > viewBottom, it's way below)
            if (logicalY > viewBottom) {
                this.cableGroup.killAndHide(cable);
                return;
            }

            // Update screen position (Locked to World)
            // ScreenY = WorldY - CameraScrollY
            // Round to integer to prevent sub-pixel shimmering (anti-aliasing flicker on 1px lines)
            cable.y = Math.round(logicalY - realScrollY);
        });
    }

    spawnCable(y) {
        // Updated frame list based on new props.json (cable1-5 exist)
        const cableFrames = ['cable1.png', 'cable2.png', 'cable3.png', 'cable4.png', 'cable5.png'];
        const frame = Phaser.Utils.Array.GetRandom(cableFrames);
        // console.log('Spawned cable:', frame); // Debug
        const cam = this.scene.cameras.main;

        const cable = this.cableGroup.get();
        if (!cable) return;

        cable.setTexture('props', frame);

        // Scale 1 (Original Size) as requested
        cable.setScale(1);

        // Center exactly
        cable.setPosition(cam.width / 2, 0);

        cable.setDepth(-5); // Behind side shadows (-4), effectively "just behind" the walls' shadow casting

        cable.setScrollFactor(0);
        cable.setData('logicalY', y);

        cable.setActive(true).setVisible(true);

        // Random flip for variety
        cable.setFlipX(Math.random() > 0.5);
    }

    /* -------------------------------------------------------------
       FOREGROUND CABLES (Black Cables for Depth)
       Depth: 100 (Above Game/Player(20), Below Riser(150), UI(200+))
    ------------------------------------------------------------- */

    initFgCables() {
        this.fgCableGroup = this.scene.add.group({
            classType: Phaser.GameObjects.Image,
            maxSize: 20, // Increased size for higher frequency
            runChildUpdate: false
        });

        const cam = this.scene.cameras.main;
        const viewBottom = cam.scrollY + cam.height + 200;
        this.minFgCableY = viewBottom;
    }

    updateFgCables(scrollY) {
        if (!this.fgCableGroup) return;

        const cam = this.scene.cameras.main;
        const realScrollY = cam.scrollY;
        const viewTop = realScrollY - 200;
        const viewBottom = realScrollY + cam.height + 200;

        // 1. Spawn new FG cables UPWARDS
        // Reduced gap for more frequency
        while (this.minFgCableY > viewTop) {
            this.spawnFgCable(this.minFgCableY);
            this.minFgCableY -= Phaser.Math.Between(400, 800);
        }

        // 2. Update/Recycle
        this.fgCableGroup.children.iterate(cable => {
            if (!cable.active) return;
            const logicalY = cable.getData('logicalY');

            if (logicalY > viewBottom) {
                this.fgCableGroup.killAndHide(cable);
                return;
            }

            // Lock to world (1.0 scroll factor logic)
            cable.y = Math.round(logicalY - realScrollY);
        });
    }

    spawnFgCable(y) {
        // Corrected frame names from props.json
        const frames = ['cable-black01.png', 'cableblack02.png', 'cableblack03.png'];
        // Fallback or random pick
        const frame = Phaser.Utils.Array.GetRandom(frames);

        const cable = this.fgCableGroup.get();
        if (!cable) return;

        cable.setTexture('props', frame);
        cable.setScale(1); // Original scale
        cable.setPosition(this.scene.cameras.main.width / 2, 0); // Center X
        cable.setDepth(100); // Start foreground layer
        cable.setScrollFactor(0);
        cable.setData('logicalY', y);
        cable.clearTint(); // Ensure no tint on black cables
        cable.setActive(true).setVisible(true);
        cable.setFlipX(Math.random() > 0.5);
    }

    update(scrollY) {
        if (!this.initialized) return;

        // 1. Base Layer Parallax
        this.bgLayer.tilePositionY = scrollY * this.parallaxFactor;

        // 2. Segment Management (Logical Space)
        const bgScrollY = scrollY * this.parallaxFactor;

        // This manages the LIFECYCLE of segments (spawn/despawn)
        this.updateSegments(bgScrollY);

        // 3. Update Background Cables (Depth -5)
        this.updateCables(scrollY);

        // 4. Update Foreground Cables (Depth 100)
        this.updateFgCables(scrollY);

        // 5. Render Positioning (Screen Space)
        // Update Y positions of active sprites to create scrolling effect
        // They are scrollFactor(0), so (0,0) is top-left of screen.
        this.segments.forEach(seg => {
            seg.items.forEach(sprite => {
                const logicalY = sprite.getData('logicalY');
                // Calculate position relative to the "Background Camera"
                // BgCameraTop = bgScrollY
                // SpriteScreenY = logicalY - bgScrollY
                sprite.y = logicalY - bgScrollY;
            });
        });
    }
}
