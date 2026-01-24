/**
 * Base abstract class for slot generation strategies.
 */
export class SlotStrategy {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Generates a slot contents based on provided layout data.
     * @param {Object} layoutData - The layout data from GridGenerator.
     * @returns {Object} Result metadata of the generation.
     */
    generate(layoutData) {
        throw new Error('SlotStrategy.generate() must be implemented by subclass');
    }
}
