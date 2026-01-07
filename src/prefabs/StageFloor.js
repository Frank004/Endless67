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
        let randomFrame = Phaser.Utils.Array.GetRandom(frames);

        // Fallback: if floor atlas not ready or frame missing, generate a placeholder texture
        let textureKey = ASSETS.FLOOR;
        if (!scene.textures.exists(ASSETS.FLOOR) || !scene.textures.get(ASSETS.FLOOR).has(randomFrame)) {
            const key = 'floor_placeholder';
            if (!scene.textures.exists(key)) {
                const g = scene.make.graphics({ x: 0, y: 0 });
                g.fillStyle(0x444444, 1);
                g.fillRect(0, 0, 32, 32);
                g.lineStyle(2, 0x666666, 1);
                g.strokeRect(0, 0, 32, 32);
                g.generateTexture(key, 32, 32);
                g.destroy();
            }
            textureKey = key;
            randomFrame = undefined;
        }

        super(scene, x, y, width, floorHeight, textureKey, randomFrame);

        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        this.setDepth(10);
    }
}
