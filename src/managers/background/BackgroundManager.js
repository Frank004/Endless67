import { GAME_CONFIG } from '../../config/GameConstants.js';
import { BACKGROUND_PATTERNS, DECO_FRAMES } from '../../data/BackgroundPatterns.js';
import { WALL_DECOR_CONFIG, getRandomFrameForType, getWallInsetX } from '../../config/WallDecorConfig.js';
import { WallDecorFactory } from '../visuals/decorations/WallDecorFactory.js';

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
        this.baseTint = 0x2b2b2b; // Slightly lighter dark overlay (was 0x1a1a1a)

        // Pooling logic
        this.segments = []; // Active segments
        this.pool = []; // Inactive sprites
        this.segmentHeight = 640; // Approx 1 screen height
        this.bufferSegments = 4; // Increased buffer to spawn well ahead of view

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

        // Ensure clean state
        this.reset();

        // 1. Create Base Layer (TileSprite)
        this.bgLayer = this.scene.add.tileSprite(0, 0, width, height, 'walls', 'wall-bg.png');
        this.bgLayer.setOrigin(0, 0);
        this.bgLayer.setScrollFactor(0); // Manually controlled for parallax
        this.bgLayer.setDepth(-100);
        this.bgLayer.setTint(this.baseTint);

        // 3. Deco Layer Group
        this.decoGroup = this.scene.add.group({
            classType: Phaser.GameObjects.Image,
            maxSize: 60, // Limit objects
            runChildUpdate: false
        });

        // 4. Background Cables Group
        this.cableGroup = this.scene.add.group({
            classType: Phaser.GameObjects.Image,
            maxSize: 50,
            runChildUpdate: false
        });

        // 5. Foreground Cables Group
        this.fgCableGroup = this.scene.add.group({
            classType: Phaser.GameObjects.Image,
            maxSize: 30,
            runChildUpdate: false
        });

        // 6. Silhouette Pipes (Deep Background) - Depth -19
        this.silhouettePipeGroup = this.scene.add.group({
            classType: Phaser.GameObjects.Container,
            maxSize: 40,
            runChildUpdate: false
        });

        // 7. Silhouette Signs (Mid Background) - Depth -18
        this.silhouetteSignGroup = this.scene.add.group({
            classType: Phaser.GameObjects.Image,
            maxSize: 30,
            runChildUpdate: false
        });

        // 5. Side Shadows (Depth Dimension)
        this.createSideShadows(width, height);
        // 6. Darker center overlay to separate gameplay from background.
        this.createCenterDarken(width, height);

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
        shadows.setDepth(-10); // On top of BG and Vignette even
    }

    createCenterDarken(width, height) {
        const textureName = 'bg_center_darken_v2';
        if (!this.scene.textures.exists(textureName)) {
            const canvas = this.scene.textures.createCanvas(textureName, width, height);
            const ctx = canvas.context;
            const radius = Math.max(width, height) * 0.9;

            const gradient = ctx.createRadialGradient(
                width / 2,
                height / 2,
                0,
                width / 2,
                height / 2,
                radius
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
            gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.55)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            canvas.refresh();
        }

        const centerDarken = this.scene.add.image(width / 2, height / 2, textureName);
        centerDarken.setScrollFactor(0);
        centerDarken.setDepth(-12);
        centerDarken.setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    /**
     * Manages creation and recycling of decoration segments
     * based on the Parallax Scroll Y position.
     */
    updateSegments(bgScrollY) {
        const cam = this.scene.cameras.main;
        const topY = bgScrollY - (this.segmentHeight * this.bufferSegments); // Buffer above
        const bottomY = bgScrollY + cam.height + (this.segmentHeight * this.bufferSegments); // Buffer below

        // 2. Add new segments if gaps exist
        // We need to cover from floor(topY) to ceil(bottomY)
        const startIdx = Math.floor(topY / this.segmentHeight);
        const endIdx = Math.ceil(bottomY / this.segmentHeight);

        // 1. Remove/Recycle segments out of range (Index based comparison avoids float jitter)
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const segIdx = Math.round(seg.y / this.segmentHeight);

            if (segIdx < startIdx || segIdx > endIdx) {
                this.recycleSegment(seg);
                this.segments.splice(i, 1);
            }
        }

        // 2. Fill gaps
        for (let i = startIdx; i <= endIdx; i++) {
            const targetY = i * this.segmentHeight;

            // Removed segment-level block to allow wall decorations.
            // Cable restriction is now inside createSegment.

            const exists = this.segments.some(s => Math.abs(s.y - targetY) < 1); // Float tolerance check
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
            sprite.setDepth(-98); // Mid Background (Just above Base Wall)
            sprite.setTint(this.baseTint); // Match base layer tint
            sprite.setActive(true).setVisible(true);

            sprite.setScrollFactor(0);
            sprite.setData('logicalY', posY); // Store absolute BG space Y
            sprite.setData('parallaxFactor', 1.0); // Standard items move with BG layer (relative 1.0)
            sprite.setData('useManualScroll', true); // Flag to use manual loop update
            items.push(sprite);
        });

        // --- CABLE SPAWNING ---

        // RESTRICTION: Only spawn cables if we are high enough (Y < -300)
        // This prevents cables from appearing in the starting 'safe zone'.
        if (y < -300) {

            // 1. Background Cables (High density)
            // Chance: 90% per segment
            if (Math.random() < 0.9) {
                const bgCable = this.createBgCable(y + (this.segmentHeight * 0.5)); // Middle of segment
                if (bgCable) items.push(bgCable);
            }

            // 2. Foreground Cables (~Every 4-5th segment / 2500-3000px)
            // Chance: 20% per segment
            if (Math.random() < 0.25) {
                const fgCable = this.createFgCable(y + (this.segmentHeight * 0.5));
                if (fgCable) items.push(fgCable);
            }

            // 3. Silhouette Elements (Deep Background) - DISABLED PER USER
            /*
            // Strategy: Use Pre-defined Patterns + World Coordinates (Cable Logic)
            // This prevents "bunching" at high altitudes by relying on Phaser's World Space.
            
            // Define Patterns (Weighted)
            // yRatio: 0 to 1 (Relative to Segment Height)
            // ... Patterns Definition ...
            
            // ... Spawning Logic ...
            */

        } // End Cable Restriction

        this.segments.push({ y, items });
    }

    createBgCable(y) {
        // Frames: cable1-5.png
        const cableFrames = ['cable1.png', 'cable2.png', 'cable3.png', 'cable4.png', 'cable5.png'];
        const frame = Phaser.Utils.Array.GetRandom(cableFrames);

        const sprite = this.cableGroup.get();
        if (!sprite) return null;

        // Setup Sprite
        sprite.setTexture('props', frame);
        sprite.setFlipX(Math.random() > 0.5);
        sprite.setScale(0.7); // 20% smaller than 0.9
        sprite.setTint(0x444444);
        sprite.setAlpha(0.7);
        // Restore Blur FX
        if (sprite.preFX) {
            sprite.preFX.clear();
            sprite.preFX.setPadding(32); // Ensure blur has space
            sprite.preFX.addBlur(0, 0, 0, 2);
        }

        const cam = this.scene.cameras.main;
        // Project logical BG Y (compressed 0.5) to Real World Y (1.0)
        // effectively y * (1/0.5) = y * 2
        sprite.setPosition(cam.width / 2, y * 2);
        sprite.setDepth(-16);
        sprite.setScrollFactor(0.95); // Subtle parallax (super smooth movement)
        sprite.setActive(true).setVisible(true);

        sprite.setData('logicalY', y);
        sprite.setData('useManualScroll', false);

        return sprite;
    }

    createFgCable(y) {
        const frames = ['cable-black01.png', 'cableblack02.png', 'cableblack03.png'];
        const frame = Phaser.Utils.Array.GetRandom(frames);

        const sprite = this.fgCableGroup.get();
        if (!sprite) return null;

        sprite.setTexture('props', frame);
        sprite.setFlipX(Math.random() > 0.5);
        sprite.setScale(0.85); // 25% smaller than 1.15
        sprite.clearTint();
        sprite.setAlpha(1.0);
        // Blur FX removed (Sprites are pre-blurred)
        if (sprite.preFX) {
            sprite.preFX.clear();
        }

        const cam = this.scene.cameras.main;
        const bgScrollY = cam.scrollY * this.parallaxFactor;
        const logicalY = y;
        const parallaxFactor = 1.2;

        sprite.setPosition(cam.width / 2, (logicalY - bgScrollY) * parallaxFactor);
        sprite.setDepth(150);
        // Use manual scroll to avoid drifting out of view on long climbs.
        sprite.setScrollFactor(0);
        sprite.setActive(true).setVisible(true);

        sprite.setData('logicalY', logicalY);
        sprite.setData('parallaxFactor', parallaxFactor);
        sprite.setData('useManualScroll', true);

        return sprite;
    }

    createSilhouettePipe(bgY, forcedSide) {
        const side = forcedSide || (Math.random() > 0.5 ? 'left' : 'right');
        const typeConfig = WALL_DECOR_CONFIG.types.PIPE;

        // Random Pattern from Config (Fix: Get directly from array)
        const pattern = Phaser.Utils.Array.GetRandom(typeConfig.patterns);

        const cam = this.scene.cameras.main;
        // CORRECTED X POSITION: Use Wall Inset Logic
        const x = getWallInsetX(side, cam.width);

        // Convert BG Y to World Y (Cable Logic)
        // bgY is compressed (0.5), so World Y is bgY * 2
        // Dynamic formula: bgY * (1 / parallaxFactor)
        const worldY = bgY * (1 / this.parallaxFactor);

        // Force tint black (0x000000)
        const wrapper = WallDecorFactory.getPipe(
            this.scene,
            typeConfig,
            x,
            worldY,
            side,
            pattern,
            0x000000 // Black
        );

        // Adjust for Background Layering
        const container = wrapper.visualObject;
        container.setDepth(-50); // Silhouette Pipe Layer (Deep)

        // CABLE STRATEGY: Use Native ScrollFactor
        container.setScrollFactor(this.parallaxFactor); // 0.5

        // Fix Tint: Container tint doesn't work, must tint children
        container.each(child => {
            if (child.setTintFill) child.setTintFill(0x000000);
        });

        // --- Phase B: Scale Adjustment ---
        // User Feedback: 0.2 was "super chiquitos". 
        // bumped to 0.6 to be visible but still background-y.
        const scale = 0.6;
        if (side === 'left') {
            container.setScale(-scale, scale); // Mirror X
        } else {
            container.setScale(scale, scale);
        }

        // Tag for update loop
        // Disable Manual Scroll
        container.setData('useManualScroll', false);

        // Return the wrapper (to handle proper cleanup via Factory)
        return wrapper;
    }

    createSilhouetteSign(bgY, typeKey = 'LIGHTBOX', forcedSide) {
        const side = forcedSide || (Math.random() > 0.5 ? 'left' : 'right');
        const typeConfig = WALL_DECOR_CONFIG.types[typeKey]; // Support BIG or REGULAR
        const frame = getRandomFrameForType(typeConfig, side);

        const cam = this.scene.cameras.main;
        // CORRECTED X POSITION: Use Wall Inset Logic
        const x = getWallInsetX(side, cam.width);

        // Convert BG Y to World Y
        const worldY = bgY * (1 / this.parallaxFactor);

        const wrapper = WallDecorFactory.getSign(
            this.scene,
            typeConfig,
            x,
            worldY,
            side,
            frame,
            0x000000 // Black
        );

        const sprite = wrapper.visualObject;
        sprite.setDepth(-40); // Silhouette Sign Layer (Mid-Deep)

        // CABLE STRATEGY: Use Native ScrollFactor
        sprite.setScrollFactor(this.parallaxFactor); // 0.5

        // Fix Tint: Use setTintFill for solid silhouette
        if (sprite.setTintFill) sprite.setTintFill(0x000000);

        // --- Phase B: Scale Adjustment ---
        // User Feedback: 1.2 looked "same size". 
        // bumped to 1.5 to make them visibly larger/closer.
        sprite.setScale(1.5);

        // Disable Manual Scroll
        sprite.setData('useManualScroll', false);

        return wrapper;
    }

    recycleSegment(seg) {
        seg.items.forEach(item => {
            // If item has a visualObject property, it's likely a Wrapper (from Factory)
            if (item.visualObject && (item.reset && item.deactivate)) {
                // It's a Factory Wrapper (PipeDecoration / SignDecoration)
                // Use the factory release mechanism if available, or just deactivate it
                // WallDecorFactory.release logic is implicit in pooling reset?
                // Factory doesn't have a public 'release' method shown in previous view, 
                // but we saw 'release' being used in WallDecorManager.
                // Let's assume WallDecorFactory.release exists or we push back to pools manually.

                // Checked WallDecorFactory previously: it didn't show 'release' explicitly in the snippet 
                // but WallDecorManager used it: "WallDecorFactory.release(decor)".
                // I will use that.

                WallDecorFactory.release(item);
            }
            // Standard Phaser Group Items
            else if (this.decoGroup.contains(item)) {
                this.decoGroup.killAndHide(item);
            } else if (this.cableGroup.contains(item)) {
                this.cableGroup.killAndHide(item);
            } else if (this.fgCableGroup.contains(item)) {
                this.fgCableGroup.killAndHide(item);
            }
            // Remove old check for separate groups as we now use Factory
            // else if (this.silhouettePipeGroup.contains(item)) ...
        });
        seg.items = [];
    }

    reset() {
        // Recycle all active segments to clear the screen
        this.segments.forEach(seg => this.recycleSegment(seg));
        this.segments = [];
    }

    /* -------------------------------------------------------------
       FOREGROUND CABLES (Black Cables for Depth)
       Depth: 100 (Above Game/Player(20), Below Riser(150), UI(200+))
    ------------------------------------------------------------- */

    update(scrollY) {
        if (!this.initialized) return;

        // 1. Base Layer Parallax
        this.bgLayer.tilePositionY = scrollY * this.parallaxFactor;

        // 2. Segment Management (Logical Space)
        const bgScrollY = scrollY * this.parallaxFactor;

        // This manages the LIFECYCLE of segments (spawn/despawn)
        this.updateSegments(bgScrollY);

        // 5. Render Positioning (Screen Space)
        // Only update Y positions for items marked for manual scroll (Walls)
        this.segments.forEach(seg => {
            seg.items.forEach(item => {
                // If it's a Factory Wrapper, the sprite is inside .visualObject
                const sprite = item.visualObject || item;

                if (sprite && sprite.active && sprite.getData) {
                    if (sprite.getData('useManualScroll')) {
                        const logicalY = sprite.getData('logicalY');
                        const pFactor = sprite.getData('parallaxFactor') || 1.0;
                        sprite.y = (logicalY - bgScrollY) * pFactor;
                    }
                }
            });
        });
    }
}
