import { ASSETS } from '../../config/AssetKeys.js';
import { FireRiserEffect } from '../../effects/FireRiserEffect.js';
import { WaterRiserEffect } from '../../effects/WaterRiserEffect.js';

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

        if (textureKey === ASSETS.WATER_TEXTURE) {
            // Apply pipeline (distortion) AND Particle Effect
            if (pipelineName && scene.game.renderer.type === Phaser.WEBGL) {
                riser.setPostPipeline(pipelineName);
            }
            return new WaterRiserEffect(scene, riser);
        }

        // 2. Standard Pipelines (Post-Processing Shaders)
        // Only apply if no specialized effect took over and WebGL is available
        if (pipelineName && scene.game.renderer.type === Phaser.WEBGL) {
            riser.setPostPipeline(pipelineName);
        }

        return null;
    }
}
