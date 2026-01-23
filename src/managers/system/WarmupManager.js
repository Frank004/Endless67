import { ASSETS } from '../../config/AssetKeys.js';
import { FireParticleSystem } from '../visuals/FireParticleSystem.js';

export class WarmupManager {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Executes the warmup process for Shaders and Particles.
     * @returns {Promise<void>} Resolves when warmup is complete (after a short delay to allow rendering).
     */
    async warmup() {
        console.log('[WarmupManager] Starting system warmup...');
        const startTime = performance.now();

        this.warmupPipelines();
        this.warmupParticles();

        // Allow a frame to pass so the renderer actually processes the draw calls
        return new Promise(resolve => {
            this.scene.time.delayedCall(50, () => {
                const duration = performance.now() - startTime;
                console.log(`[WarmupManager] Warmup complete in ${duration.toFixed(2)}ms`);
                resolve();
            });
        });
    }

    warmupPipelines() {
        const renderer = this.scene.game.renderer;
        if (renderer.type !== Phaser.WEBGL) return;

        // Warmup FluidPipeline (Lava, Water, Acid)
        if (renderer.pipelines.has('FluidPipeline')) {
            const dummy = this.scene.add.sprite(-100, -100, ASSETS.WALL_PLACEHOLDER || 'white_pixel');
            dummy.setPostPipeline('FluidPipeline');
            // Force a render pass effectively happens when the scene renders.
            // By adding it to the scene, it will be processed in the next frame.
            // We destroy it after the delay in the main warmup method? 
            // Better: keeping them alive for the duration of the delay ensuring they get rendered.
            this.scene.time.delayedCall(40, () => dummy.destroy());
        }

        // Warmup FlamesPipeline (Fire)
        if (renderer.pipelines.has('FlamesPipeline')) {
            const dummy = this.scene.add.sprite(-100, -100, ASSETS.FIRE_TEXTURE);
            dummy.setPostPipeline('FlamesPipeline');
            this.scene.time.delayedCall(40, () => dummy.destroy());
        }
    }

    warmupParticles() {
        // Initialize the FireParticleSystem briefly to ensure textures are uploaded to GPU
        // This is a bit specific, but creating the emitters forces texture checks.

        // We can reuse the singleton logic or just create a temporary instance.
        // Since FireParticleSystem is designed to be a singleton attached to the scene,
        // we can instantiate it, emit a few invisible particles, then clear it.

        // However, FireParticleSystem attaches to scene._fireParticleSystem.
        // Preloader doesn't need to keep it, but iterating the constructor is enough to check textures.

        // Actually, the main stutter comes from the first time a specific Texture + BlendMode is used.
        // E.g. 'particle_burn' with ADD blend mode.

        // Let's create a dummy emitter.
        if (this.scene.textures.exists(ASSETS.PARTICLE_BURN)) {
            const p = this.scene.add.particles(0, 0, ASSETS.PARTICLE_BURN, {
                emitting: false,
                quantity: 1,
                alpha: 0,
                blendMode: 'ADD'
            });
            p.explode(1, -100, -100);
            this.scene.time.delayedCall(40, () => p.destroy());
        }
    }
}
