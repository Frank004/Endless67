import { ASSETS } from "../Config/AssetKeys.js";
import { FireParticleSystem } from "../Systems/Visuals/FireParticleSystem.js";

export class FireRiserEffect {
    /**
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.GameObject} riserGameObject
     */
    constructor(scene, riserGameObject) {
        this.scene = scene;
        this.go = riserGameObject;

        // Hide the original tiling sprite pattern
        this.go.setVisible(false);

        const width = this.go.width;
        const depth = this.go.depth;

        // --- VISUALS (Static) ---
        // These are low-cost static images. We can keep them per-riser without issue.

        // 1. Top Gradient
        this.topGradient = scene.add.image(this.go.x, this.go.y, ASSETS.FIRE_TEXTURE);
        this.topGradient.setOrigin(0.5, 0);
        this.topGradient.displayWidth = width;
        this.topGradient.setDepth(depth);

        // 2. Bottom Fill
        this.bottomFill = scene.add.rectangle(this.go.x, this.go.y + 798, width, 4000, 0xff8c00);
        this.bottomFill.setOrigin(0.5, 0);
        this.bottomFill.setDepth(depth);

        // --- PARTICLE SYSTEM ---
        // Use optimized singleton pool
        this.particleSystem = FireParticleSystem.get(scene);
        this.time = 0;
    }

    /**
     * Update loop called every frame (e.g. 60fps)
     */
    update(deltaMs) {
        if (!this.go) return;

        this.time += deltaMs * 0.001;

        const x = this.go.x;
        const y = this.go.y;
        const w = this.go.width;

        // Sync Visuals
        if (this.topGradient) {
            this.topGradient.setPosition(x, y);
            this.topGradient.displayWidth = w;
        }
        if (this.bottomFill) {
            this.bottomFill.setPosition(x, y + 798);
            this.bottomFill.displayWidth = w;
        }

        // Emit Particles via System
        // We use probabilities to control frequency since this runs every frame
        // Smoke: Low Freq (e.g. 10/sec -> ~16% chance per frame)
        if (Math.random() < 0.16) {
            this.particleSystem.emitSmoke(x, y, w);
        }

        // BG Fire: Med Freq (e.g. 30/sec -> ~50% chance per frame)
        if (Math.random() < 0.5) {
            this.particleSystem.emitBg(x, y, w);
        }

        // Body Fire: High Freq (Filler ~80%)
        if (Math.random() < 0.8) {
            this.particleSystem.emitBody(x, y, w);
        }

        // Glow Orbs: Low Freq (Bubbles ~5%)
        if (Math.random() < 0.05) {
            this.particleSystem.emitGlow(x, y, w);
        }

        // Base Fire (Core): High Freq (~80%)
        // Large, short flames at the base
        if (Math.random() < 0.8) {
            this.particleSystem.emitBase(x, y, w, this.time);
        }

        // Main Sparks: High Freq (Every frame, often multiple)
        // 1-2 per frame is dense enough (~90/sec)
        this.particleSystem.emitSparks(x, y, w, 1);
    }
}
