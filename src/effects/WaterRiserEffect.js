import { ASSETS } from '../config/AssetKeys.js';

export class WaterRiserEffect {
    constructor(scene, riser) {
        this.scene = scene;
        this.riser = riser;
        this.time = 0;

        // Configuration for the wave matches the fluid shader roughly
        this.waveParams = {
            frequency: 0.04,
            speed: 0.003,
            amplitude: 6,
            yOffset: 0
        };

        this.createTexture();
        this.createEmitter();
    }

    createTexture() {
        if (!this.scene.textures.exists('foam_particle')) {
            const radius = 4; // 8x8 circle (small)
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(radius, radius, radius);
            graphics.generateTexture('foam_particle', radius * 2, radius * 2);
        }
    }

    createEmitter() {
        // Create a single manual emitter
        this.emitter = this.scene.add.particles(0, 0, 'foam_particle', {
            emitting: false, // We will manually emit in update
            lifespan: { min: 200, max: 500 },
            // "movimientos de altura de 5px namas"
            // With lifespan ~0.3s, speed -15 px/s -> moves ~5px.
            // SpeedY: pixels per second. To move 5px in 0.3s -> 5/0.3 = 16.
            speedY: { min: -10, max: -20 },
            speedX: { min: -5, max: 5 },
            scale: { start: 1.2, end: 0.3 }, // Larger bubbles
            alpha: { start: 0.9, end: 0 },
            blendMode: 'ADD'
        });

        // Depth above riser
        this.emitter.setDepth(this.riser.depth + 1);
    }

    update(delta) {
        this.time += delta;
        if (!this.riser.visible) return;

        // Manual Emission Loop
        // "Muchas burbujas" -> Emit multiple times per frame
        // "Un poco menos" -> Reduced from 10 to 8
        const density = 8;

        const width = this.riser.displayWidth;
        const startX = this.riser.x - (width * this.riser.originX);
        const topY = this.riser.y;

        for (let i = 0; i < density; i++) {
            // Random X across the riser
            const x = Phaser.Math.Between(startX, startX + width);

            // Calculate Wave Y at this X
            // Matches shader: sin(uv.y * 20.0 + uTime * 2.0) * 0.005 (horizontal distortion)
            // But we want vertical wave. 
            // The shader:
            // float waveY = cos(uv.x * 20.0 + uTime * 3.0) * 0.005;
            // 20.0 is the frequency factor. uTime * 3.0 is speed.
            // visual amplitude is small.

            // Let's stick to our waveParams which were tuned previously
            const waveY = Math.sin(x * this.waveParams.frequency + this.time * this.waveParams.speed) * this.waveParams.amplitude;

            // Distribute randomly between 0 and 20px ABOVE the wave surface to create volume
            const yScatter = Phaser.Math.Between(0, 20);

            // Offset +11px to align base of foam with water surface, then scatter upwards
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
