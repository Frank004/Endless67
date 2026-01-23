import { ASSETS } from '../../config/AssetKeys.js';

/**
 * FireParticleSystem
 * 
 * A centralized system to manage fire particle emitters.
 * Uses object pooling via Phaser's ParticleEmitter to efficiently handle visual effects.
 */
export class FireParticleSystem {
    constructor(scene) {
        this.scene = scene;

        // Depth Constants (Based on Riser Depth 150)
        const RISER_DEPTH = 150;

        const particleTexture = scene.textures.exists(ASSETS.PARTICLE_BURN) ? ASSETS.PARTICLE_BURN : 'white_pixel';
        const smokeTexture = scene.textures.exists(ASSETS.PARTICLE_DUST) ? ASSETS.PARTICLE_DUST : 'white_pixel';
        // Use AURA if exists, otherwise same texture
        const auraTexture = scene.textures.exists(ASSETS.PARTICLE_AURA) ? ASSETS.PARTICLE_AURA : particleTexture;

        // 1. Smoke Emitter (Low Freq, Clouds)
        this.smoke = scene.add.particles(0, 0, smokeTexture, {
            emitting: false,
            quantity: 1,
            speedY: { min: -30, max: -60 },
            speedX: { min: -20, max: 20 },
            scale: { start: 4.0, end: 10.0 },
            alpha: { start: 0.2, end: 0.0 },
            lifespan: { min: 2000, max: 4000 },
            blendMode: 'NORMAL',
            tint: 0x333333
        });
        this.smoke.setDepth(RISER_DEPTH - 2);

        // 2. BG Fire Emitter (Medium Volume)
        this.bgFire = scene.add.particles(0, 0, particleTexture, {
            emitting: false,
            quantity: 1,
            speedY: { min: -50, max: -150 },
            speedX: { min: -20, max: 20 },
            scale: { start: 3.0, end: 0.0 },
            alpha: { start: 0.5, end: 0.0 },
            lifespan: { min: 400, max: 700 },
            blendMode: 'ADD',
            tint: [0xff0000, 0x880000]
        });
        this.bgFire.setDepth(RISER_DEPTH + 1);

        // 3. Body Fire (Give body to the riser, ~50px lower)
        // Red/Orange/Dark
        this.bodyFire = scene.add.particles(0, 0, particleTexture, {
            emitting: false,
            quantity: 1,
            speedY: { min: -40, max: -100 },
            speedX: { min: -10, max: 10 },
            scale: { start: 1.5, end: 0.5 },
            alpha: { start: 0.4, end: 0.0 },
            lifespan: { min: 500, max: 800 },
            blendMode: 'ADD',
            tint: [0xff4400, 0xff0000]
        });
        this.bodyFire.setDepth(RISER_DEPTH + 1);

        // 4. Glow Orbs (Soft Circles inside)
        this.glowOrbs = scene.add.particles(0, 0, auraTexture, {
            emitting: false,
            quantity: 1,
            speedY: { min: -20, max: -50 },
            speedX: { min: -5, max: 5 },
            scale: { start: 2.0, end: 4.0 },
            alpha: { start: 0.3, end: 0.0 },
            lifespan: { min: 1000, max: 2000 },
            blendMode: 'ADD',
            tint: 0xffaa00 // Yellow/Gold
        });
        this.glowOrbs.setDepth(RISER_DEPTH + 1);

        // 5. Base Fire (Large scale, Short height, Wave-Edge)
        this.baseFire = scene.add.particles(0, 0, particleTexture, {
            emitting: false,
            quantity: 1,
            speedY: { min: -40, max: -100 },
            speedX: { min: -10, max: 10 },
            scale: { start: 2.0, end: 0.5 },
            alpha: { start: 0.8, end: 0.0 },
            lifespan: { min: 300, max: 500 },
            blendMode: 'ADD',
            tint: [0xffaa00, 0xff4400]
        });
        this.baseFire.setDepth(RISER_DEPTH + 1.5);

        // 6. Main Sparks Emitter (High Frequency, Tall, Intense)
        this.sparks = scene.add.particles(0, 0, particleTexture, {
            emitting: false,
            quantity: 1,
            speedY: { min: -100, max: -350 },
            speedX: { min: -30, max: 30 },
            scale: { start: 0.8, end: 0.0 },
            alpha: { start: 1.0, end: 0.0 },
            lifespan: { min: 200, max: 450 },
            blendMode: 'ADD',
            tint: [0xffff00, 0xff8800, 0xff0000]
        });
        this.sparks.setDepth(RISER_DEPTH + 2);

        // Lifecycle Management
        // If the scene restarts, we must clear this singleton instance to prevent usage of destroyed emitters.
        scene.events.once('shutdown', this.destroy, this);
    }

    destroy() {
        if (this.scene) {
            this.scene._fireParticleSystem = null;
        }
    }

    emitSmoke(x, y, width) {
        if (!this.smoke || !this.smoke.active) return;
        const px = x + Phaser.Math.Between(-width / 2, width / 2);
        this.smoke.stop(); // Ensure manual control if needed
        this.smoke.explode(1, px, y + 10);
    }

    emitBg(x, y, width) {
        if (!this.bgFire || !this.bgFire.active) return;
        const px = x + Phaser.Math.Between(-width / 2, width / 2);
        this.bgFire.explode(1, px, y + 10);
    }

    emitBody(x, y, width) {
        if (!this.bodyFire || !this.bodyFire.active) return;
        const px = x + Phaser.Math.Between(-width / 2 + 10, width / 2 - 10);
        this.bodyFire.explode(1, px, y + 50 + Phaser.Math.Between(0, 30));
    }

    emitGlow(x, y, width) {
        if (!this.glowOrbs || !this.glowOrbs.active) return;
        const px = x + Phaser.Math.Between(-width / 2, width / 2);
        this.glowOrbs.explode(1, px, y + Phaser.Math.Between(50, 200));
    }

    emitBase(x, y, width, time = 0) {
        if (!this.baseFire || !this.baseFire.active) return;
        const px = x + Phaser.Math.Between(-width / 2 + 5, width / 2 - 5);
        const waveY = Math.sin(px * 0.05 + time * 5) * 6;
        this.baseFire.explode(1, px, y + 5 + waveY);
    }

    emitSparks(x, y, width, count = 1) {
        if (!this.sparks || !this.sparks.active) return;
        const realCount = count * 2;
        for (let i = 0; i < realCount; i++) {
            const px = x + Phaser.Math.Between(-width / 2 + 5, width / 2 - 5);
            this.sparks.explode(1, px, y);
        }
    }

    static get(scene) {
        if (!scene._fireParticleSystem) {
            scene._fireParticleSystem = new FireParticleSystem(scene);
        }
        return scene._fireParticleSystem;
    }
}
