import { RISER_TYPES } from '../../config/RiserConfig.js';

/**
 * RiserPipelineManager
 * 
 * Manages which pipeline (shader) to use for each riser type.
 * This decouples the riser type from the visual implementation,
 * allowing easy changes and additions of new riser types.
 */
export class RiserPipelineManager {
    constructor() {
        // Map riser types to their pipeline categories
        this.pipelineMap = {
            [RISER_TYPES.LAVA]: 'Fluid',
            [RISER_TYPES.WATER]: 'Fluid',
            [RISER_TYPES.ACID]: 'Fluid'
            // [RISER_TYPES.FIRE]: undefined // No pipeline for FIRE
        };
    }

    /**
     * Get the pipeline name for a given riser type
     * @param {string} riserType - The type of riser (from RISER_TYPES)
     * @returns {string} The pipeline name to use
     */
    getPipelineForType(riserType) {
        const category = this.pipelineMap[riserType];
        if (!category) {
            // If no pipeline mapped (e.g. FIRE), return null to use standard rendering
            return null;
        }
        return `${category}Pipeline`;
    }

    /**
     * Register a new riser type with a pipeline category
     * @param {string} riserType - The type of riser
     * @param {string} category - The pipeline category ('Fluid', 'Flames', etc.)
     */
    registerRiserType(riserType, category) {
        this.pipelineMap[riserType] = category;
    }

    /**
     * Get all registered pipeline categories
     * @returns {Array<string>} Array of unique pipeline categories
     */
    getRegisteredCategories() {
        return [...new Set(Object.values(this.pipelineMap))];
    }
}

// Singleton instance
export default new RiserPipelineManager();
