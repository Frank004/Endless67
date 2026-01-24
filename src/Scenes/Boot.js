import FluidPipeline from '../Pipelines/FluidPipeline.js';
import FlamesPipeline from '../Pipelines/FlamesPipeline.js';

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

        // Pre-load loading screen assets
        const v = window.GAME_VERSION ? `?v=${window.GAME_VERSION}` : '';
        this.load.image('main_bg', 'assets/ui/main-bg.png' + v);
        this.load.image('game_logo', 'assets/logo.png' + v);
        this.load.atlas('ui_hud', 'assets/ui/ui.png' + v, 'assets/ui/ui.json' + v);
    }

    create() {
        console.log('Boot sequence loaded - Starting Preloader');
        this.scene.start('Preloader');
    }
}
