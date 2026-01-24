import { ASSETS } from '../../Config/AssetKeys.js';
import { FireRiserEffect } from '../../Effects/FireRiserEffect.js';
import { LiquidRiserEffect } from '../../Effects/LiquidRiserEffect.js';

/**
 * RiserVisualManager
 * 
 * Central Factory/Manager to handle the visual setup of Risers.
 * It decides whether to apply a specialized Visual Effect (like generic particles/overlays)
 * or a PostFX Pipeline (Shaders) based on the texture or configuration.
 */
export class RiserVisualManager {

    /**
     * Sets up the visual components for a Riser.
     * @param {Phaser.Scene} scene 
     * @param {Phaser.GameObjects.GameObject} riser 
     * @param {string} textureKey 
     * @param {string|null} pipelineName 
     * @returns {Object|null} Returns an Effect wrapper if created (must have update method), or null.
     */
    static setup(scene, riser, textureKey, pipelineName) {
        // 1. Specialized Effects (Complex Visuals that might replace/overlay the Riser)
        if (textureKey === ASSETS.FIRE_TEXTURE) {
            return new FireRiserEffect(scene, riser);
        }

        // 2. Water (Liquid Effect)
        if (textureKey === ASSETS.WATER_TEXTURE) {
            if (pipelineName && scene.game.renderer.type === Phaser.WEBGL) {
                riser.setPostPipeline(pipelineName);
            }
            return new LiquidRiserEffect(scene, riser, {
                tint: 0xffffff,
                density: 8
            });
        }

        // 3. Acid (Liquid Effect)
        // Note: ASSETS.ACID_TEXTURE often maps to 'acid_texture'
        if (textureKey === 'acid_texture' || textureKey === ASSETS.ACID_TEXTURE) {
            if (pipelineName && scene.game.renderer.type === Phaser.WEBGL) {
                riser.setPostPipeline(pipelineName);
            }
            return new LiquidRiserEffect(scene, riser, {
                tint: 0xccff66, // Toxic Green
                density: 10,
                speedY: { min: -20, max: -50 }, // Faster fumes
                scale: { start: 0.8, end: 1.4 },
                blendMode: 'ADD'
            });
        }

        // 4. Standard Pipelines (Post-Processing Shaders) e.g. LAVA
        // Only apply if no specialized effect took over and WebGL is available
        if (pipelineName && scene.game.renderer.type === Phaser.WEBGL) {
            riser.setPostPipeline(pipelineName);
        }

        return null;
    }
}
