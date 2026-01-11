import { FOG_CONFIG } from '../config/FogConfig.js';

export class FogEffect {
    constructor(scene) {
        this.scene = scene;
        this.width = scene.scale.width;
        this.height = scene.scale.height;

        this.gradientKey = null;
        this.particleKey = 'fog_particle';

        this.createGradientTexture();
        this.createFogLayer();
        this.createParticleTexture();
        this.createParticles();
    }

    createGradientTexture() {
        const { width, height } = this;
        const key = `fog_gradient_${width}x${height}`;
        this.gradientKey = key;

        if (this.scene.textures.exists(key)) return;

        const canvas = this.scene.textures.createCanvas(key, width, height);
        const ctx = canvas.context;

        ctx.clearRect(0, 0, width, height);

        // Base haze across the play area.
        ctx.fillStyle = 'rgba(200, 210, 225, 0.08)';
        ctx.fillRect(0, 0, width, height);

        // Darker center veil to push focus away from the middle.
        const centerGrad = ctx.createRadialGradient(
            width / 2,
            height / 2,
            Math.min(width, height) * 0.15,
            width / 2,
            height / 2,
            Math.max(width, height) * 0.6
        );
        centerGrad.addColorStop(0, 'rgba(40, 48, 60, 0.22)');
        centerGrad.addColorStop(1, 'rgba(40, 48, 60, 0)');
        ctx.fillStyle = centerGrad;
        ctx.fillRect(0, 0, width, height);

        // Left wall fog.
        const leftGrad = ctx.createLinearGradient(0, 0, width * 0.45, 0);
        leftGrad.addColorStop(0, 'rgba(200, 210, 225, 0.55)');
        leftGrad.addColorStop(1, 'rgba(200, 210, 225, 0)');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, width * 0.45, height);

        // Right wall fog.
        const rightGrad = ctx.createLinearGradient(width, 0, width * 0.55, 0);
        rightGrad.addColorStop(0, 'rgba(200, 210, 225, 0.55)');
        rightGrad.addColorStop(1, 'rgba(200, 210, 225, 0)');
        ctx.fillStyle = rightGrad;
        ctx.fillRect(width * 0.55, 0, width * 0.45, height);

        canvas.refresh();
    }

    createFogLayer() {
        const { width, height } = this;
        this.fogLayer = this.scene.add.image(width / 2, height / 2, this.gradientKey);
        this.fogLayer.setScrollFactor(0);
        this.fogLayer.setDepth(FOG_CONFIG.depth);
        this.fogLayer.setAlpha(FOG_CONFIG.baseAlpha);
        this.fogLayer.setTint(FOG_CONFIG.baseTint);
        this.fogLayer.setBlendMode(Phaser.BlendModes.SCREEN);

        // Darker depth layer to reduce grayness without hiding background.
        this.fogShadowLayer = this.scene.add.image(width / 2, height / 2, this.gradientKey);
        this.fogShadowLayer.setScrollFactor(0);
        this.fogShadowLayer.setDepth(FOG_CONFIG.depth - 0.1);
        this.fogShadowLayer.setAlpha(FOG_CONFIG.shadowAlpha);
        this.fogShadowLayer.setTint(FOG_CONFIG.shadowTint);
        this.fogShadowLayer.setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    createParticleTexture() {
        if (this.scene.textures.exists(this.particleKey)) return;

        const size = 64;
        const canvas = this.scene.textures.createCanvas(this.particleKey, size, size);
        const ctx = canvas.context;

        const gradient = ctx.createRadialGradient(
            size / 2,
            size / 2,
            0,
            size / 2,
            size / 2,
            size / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        canvas.refresh();
    }

    createParticles() {
        const { width, height } = this;
        const spawnWidth = FOG_CONFIG.particleSpawnWidth;

        this.leftEmitter = this.scene.add.particles(0, 0, this.particleKey, {
            lifespan: FOG_CONFIG.particleLifespan,
            speedX: FOG_CONFIG.particleSpeedX,
            speedY: FOG_CONFIG.particleSpeedY,
            scale: FOG_CONFIG.particleScale,
            alpha: FOG_CONFIG.particleAlpha,
            tint: FOG_CONFIG.particleTint,
            frequency: FOG_CONFIG.particleFrequency,
            quantity: 1,
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(0, 0, spawnWidth, height)
            }
        });
        this.leftEmitter.setScrollFactor(0);
        this.leftEmitter.setDepth(FOG_CONFIG.depth);
        this.leftEmitter.setBlendMode(Phaser.BlendModes.SCREEN);

        this.rightEmitter = this.scene.add.particles(0, 0, this.particleKey, {
            lifespan: FOG_CONFIG.particleLifespan,
            speedX: { min: -FOG_CONFIG.particleSpeedX.max, max: -FOG_CONFIG.particleSpeedX.min },
            speedY: FOG_CONFIG.particleSpeedY,
            scale: FOG_CONFIG.particleScale,
            alpha: FOG_CONFIG.particleAlpha,
            tint: FOG_CONFIG.particleTint,
            frequency: FOG_CONFIG.particleFrequency,
            quantity: 1,
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(width - spawnWidth, 0, spawnWidth, height)
            }
        });
        this.rightEmitter.setScrollFactor(0);
        this.rightEmitter.setDepth(FOG_CONFIG.depth);
        this.rightEmitter.setBlendMode(Phaser.BlendModes.SCREEN);
    }

    destroy() {
        if (this.leftEmitter) {
            this.leftEmitter.destroy();
            this.leftEmitter = null;
        }
        if (this.rightEmitter) {
            this.rightEmitter.destroy();
            this.rightEmitter = null;
        }
        if (this.fogLayer) {
            this.fogLayer.destroy();
            this.fogLayer = null;
        }
        if (this.fogShadowLayer) {
            this.fogShadowLayer.destroy();
            this.fogShadowLayer = null;
        }
    }
}
