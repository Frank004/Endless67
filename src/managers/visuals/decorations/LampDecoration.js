import { BaseWallDecoration } from './BaseWallDecoration.js';

export class LampDecoration extends BaseWallDecoration {
    constructor(scene, config, x, y, side, frame, tint = 0xffffff) {
        super(scene, config, x, y, side);
        this.frame = frame;
        this.tint = tint;

        // Component references
        this.lampSprite = null;
        this.glowOuter = null;
        this.glowInner = null;
        this.bugsEmitter1 = null;
        this.bugsEmitter2 = null;

        this.createVisuals();
    }

    createVisuals() {
        const container = this.scene.add.container(this.x, this.y);
        container.setDepth(this.config.depth);
        this.visualObject = container;

        // --- 1. Textures ---

        // A. Outer Glow (Smoother Pixel Stepped Gradient)
        // Key: 'lamp_glow_pixel_v3'
        if (!this.scene.textures.exists('lamp_glow_pixel_v3')) {
            const canvas = this.scene.textures.createCanvas('lamp_glow_pixel_v3', 128, 128);
            const ctx = canvas.context;
            const cx = 64, cy = 64;

            // 3 Rings for softer transition
            // Ring 1 (Faint Outer)
            ctx.fillStyle = 'rgba(255, 200, 100, 0.05)';
            ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI * 2); ctx.fill();

            // Ring 2 (Mid)
            ctx.fillStyle = 'rgba(255, 220, 150, 0.1)';
            ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.fill();

            // Ring 3 (Center)
            ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
            ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();

            canvas.refresh();
        }

        // B. Inner Core (Strong Gradient)
        if (!this.scene.textures.exists('lamp_core')) {
            const canvas = this.scene.textures.createCanvas('lamp_core', 32, 32);
            const ctx = canvas.context;
            const grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            grd.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            grd.addColorStop(0.5, 'rgba(255, 255, 200, 0.8)');
            grd.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 32, 32);
            canvas.refresh();
        }

        // C. Pixel Particle (Slightly grey for contrast against light)
        if (!this.scene.textures.exists('pixel_gray')) {
            const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xcccccc, 1);
            g.fillRect(0, 0, 2, 2);
            g.generateTexture('pixel_gray', 2, 2);
        }

        // --- 2. Components ---
        const bulbOffset = (this.side === 'left' ? 14 : -14); // Was 18, moved 4px towards wall
        const bulbOffsetY = 3; // Moved 3px down

        // A. Outer Glow (Image)
        this.glowOuter = this.scene.add.image(bulbOffset, bulbOffsetY, 'lamp_glow_pixel_v3');
        this.glowOuter.setBlendMode(Phaser.BlendModes.ADD);
        this.glowOuter.setAlpha(0.8);
        this.glowOuter.setScale(1.0);
        container.add(this.glowOuter);

        // B. Inner Core (Image)
        this.glowInner = this.scene.add.image(bulbOffset, bulbOffsetY, 'lamp_core');
        this.glowInner.setBlendMode(Phaser.BlendModes.ADD);
        this.glowInner.setAlpha(1.0);
        this.glowInner.setScale(1.2);
        container.add(this.glowInner);

        // C. Lamp Sprite
        this.lampSprite = this.scene.add.image(0, 0, this.config.atlas, this.frame);
        this.lampSprite.setTint(this.tint);
        if (this.side === 'left') {
            this.lampSprite.setOrigin(0, 0.5);
            this.lampSprite.setFlipX(true);
        } else {
            this.lampSprite.setOrigin(1, 0.5);
            this.lampSprite.setFlipX(false);
        }
        container.add(this.lampSprite);

        // D. Particles (Bugs)
        // Group 1: Small/Fast (Swarming)
        this.bugsEmitter1 = this.scene.add.particles(0, 0, 'pixel_gray', {
            // Emitter itself is at (0,0) relative to container, emitZone handles spread around bulbOffset
            speed: { min: 4, max: 10 }, // Reduced speed for stability
            angle: { min: 0, max: 360 },
            scale: { start: 1.0, end: 0.5 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 600,
            quantity: 1,
            frequency: 120,
            blendMode: 'ADD',
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Circle(bulbOffset, 17, 13) // Shifted down (12 + 5 = 17)
            }
        });

        // Group 2: Large/Slow (Floaters)
        this.bugsEmitter2 = this.scene.add.particles(0, 0, 'pixel_gray', {
            speed: { min: 2, max: 6 }, // Reduced speed
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0.8 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 1000,
            quantity: 1,
            frequency: 200,
            blendMode: 'ADD',
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Circle(bulbOffset, 17, 17) // Shifted down (12 + 5 = 17)
            }
        });

        // Add emitters to the container
        container.add(this.bugsEmitter1);
        container.add(this.bugsEmitter2);

        // Ensure the lamp sprite is on top of the glows and particles
        container.bringToTop(this.lampSprite);
    }

    reset(config, x, y, side, frame, tint = 0xffffff) {
        super.reset(config, x, y, side);
        this.frame = frame;
        this.tint = tint;

        const container = this.visualObject;
        container.setPosition(x, y);
        container.setVisible(true);
        container.setActive(true);
        container.setDepth(config.depth);
        container.setAlpha(config.alpha !== undefined ? config.alpha : 1);
        container.setScale(config.scale !== undefined ? config.scale : 1);

        // Update Offsets based on side
        const bulbOffset = (side === 'left' ? 14 : -14); // Was 18
        const bulbOffsetY = 5;

        // Update Glows
        this.glowOuter.setPosition(bulbOffset, bulbOffsetY);
        this.glowInner.setPosition(bulbOffset, bulbOffsetY);

        // Update Sprite
        this.lampSprite.setTexture(config.atlas, frame);
        this.lampSprite.setTint(tint);
        if (side === 'left') {
            this.lampSprite.setOrigin(0, 0.5);
            this.lampSprite.setFlipX(true);
        } else {
            this.lampSprite.setOrigin(1, 0.5);
            this.lampSprite.setFlipX(false);
        }

        // Update Emitters' emitZone source position (Shifted down +17y total)
        if (this.bugsEmitter1 && this.bugsEmitter1.emitZone && this.bugsEmitter1.emitZone.source) {
            this.bugsEmitter1.emitZone.source.setPosition(bulbOffset, 17);
        }
        if (this.bugsEmitter2 && this.bugsEmitter2.emitZone && this.bugsEmitter2.emitZone.source) {
            this.bugsEmitter2.emitZone.source.setPosition(bulbOffset, 17);
        }

        this.bugsEmitter1.start();
        this.bugsEmitter2.start();

        // Ensure the lamp sprite is on top
        container.bringToTop(this.lampSprite);
    }

    deactivate() {
        super.deactivate();
        if (this.bugsEmitter1) this.bugsEmitter1.stop();
        if (this.bugsEmitter2) this.bugsEmitter2.stop();
    }

    destroy() {
        if (this.bugsEmitter1) this.bugsEmitter1.destroy();
        if (this.bugsEmitter2) this.bugsEmitter2.destroy();
        if (this.glowInner) this.glowInner.destroy();
        if (this.glowOuter) this.glowOuter.destroy();
        super.destroy();
    }
}
