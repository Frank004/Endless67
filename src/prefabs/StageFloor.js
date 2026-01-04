import { LAYOUT_CONFIG } from '../config/LayoutConfig.js';
import { ASSETS } from '../config/AssetKeys.js';
import { WALLS } from '../config/GameConstants.js';

/**
 * StageFloor
 * 
 * El piso inicial del juego. Estático y visible al inicio.
 * Ubicado encima del ad banner.
 */
export class StageFloor extends Phaser.GameObjects.TileSprite {
    constructor(scene, screenHeight) {
        const config = LAYOUT_CONFIG.stageFloor;
        // Ad banner está arriba, así que el floor va al fondo sin restar adHeight
        const effectiveHeight = screenHeight;

        const x = scene.scale.width / 2;
        const floorHeight = config.height; // 32
        const y = effectiveHeight - (floorHeight / 2);
        const width = scene.scale.width;

        // Choose a random frame
        const frames = ['stagefloor-01.png', 'stagefloor-02.png', 'stagefloor-03.png'];
        const randomFrame = Phaser.Utils.Array.GetRandom(frames);

        super(scene, x, y, width, floorHeight, ASSETS.FLOOR, randomFrame);

        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        this.setDepth(10);
    }
}
