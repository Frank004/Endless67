import FluidPipeline from '../pipelines/FluidPipeline.js';
import FlamesPipeline from '../pipelines/FlamesPipeline.js';

/**
 * @phasereditor
 * @scene Boot
 * @width 400
 * @height 600
 * @backgroundColor 0x000000
 */
export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Register Riser Pipelines
        if (this.game.renderer.type === Phaser.WEBGL) {
            this.renderer.pipelines.addPostPipeline('FluidPipeline', FluidPipeline);
            this.renderer.pipelines.addPostPipeline('FlamesPipeline', FlamesPipeline);
        }
    }

    create() {
        console.log('Boot sequence loaded - Starting Preloader');
        this.scene.start('Preloader');
    }
}
