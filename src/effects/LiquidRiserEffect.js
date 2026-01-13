import { ASSETS } from '../config/AssetKeys.js';

/**
 * LiquidRiserEffect
 * 
 * Generic effect for fluid risers (Water, Acid, Slime) that need:
 * 1. Surface distortion (via Shader pipeline externally applied)
 * 2. Surface particles (Bubbles/Foam)
 */
export class LiquidRiserEffect {
    /**
     * @param {Phaser.Scene} scene 
     * @param {Phaser.GameObjects.GameObject} riser 
     * @param {Object} config - { tint: number, density: number, speedY: {min,max}, bubbleScale: {min,max} }
     */
    constructor(scene, riser, config = {}) {
        this.scene = scene;
        this.riser = riser;
        this.time = 0;

        // Default Config (Water-like)
        this.config = {
            tint: config.tint || 0xffffff,
            density: config.density || 8,
            speedY: config.speedY || { min: -10, max: -20 },
            speedX: config.speedX || { min: -5, max: 5 },
            lifespan: config.lifespan || { min: 200, max: 500 },
            scale: config.scale || { start: 1.2, end: 0.3 },
            alpha: config.alpha || { start: 0.9, end: 0 },
            blendMode: config.blendMode || 'ADD'
        };

        this.waveParams = {
            frequency: 0.04,
            speed: 0.003,
            amplitude: 6
        };

        this.createTexture();
        this.createEmitter();
    }

    createTexture() {
        if (!this.scene.textures.exists('foam_particle')) {
            const radius = 4;
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(radius, radius, radius);
            graphics.generateTexture('foam_particle', radius * 2, radius * 2);
        }
    }

    createEmitter() {
        this.emitter = this.scene.add.particles(0, 0, 'foam_particle', {
            emitting: false,
            lifespan: this.config.lifespan,
            speedY: this.config.speedY,
            speedX: this.config.speedX,
            scale: this.config.scale,
            alpha: this.config.alpha,
            tint: this.config.tint,
            blendMode: this.config.blendMode
        });

        this.emitter.setDepth(this.riser.depth + 1);
    }

    update(delta) {
        this.time += delta;
        if (!this.riser.visible) return;

        const width = this.riser.displayWidth;
        const startX = this.riser.x - (width * this.riser.originX);
        const topY = this.riser.y;

        for (let i = 0; i < this.config.density; i++) {
            const x = Phaser.Math.Between(startX, startX + width);
            const waveY = Math.sin(x * this.waveParams.frequency + this.time * this.waveParams.speed) * this.waveParams.amplitude;
            const yScatter = Phaser.Math.Between(0, 20);

            // Emit
            this.emitter.explode(1, x, topY + waveY + 11 - yScatter);
        }
    }

    destroy() {
        if (this.emitter) {
            this.emitter.destroy();
            this.emitter = null;
        }
    }
}
