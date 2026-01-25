import { ASSETS } from '../../Config/AssetKeys.js';
import { STORE_CARD_CONSTANTS } from './StoreCardConstants.js';

/**
 * Handles the background visual of the Store Card.
 */
export class StoreCardBackground {
    /**
     * @param {Phaser.Scene} scene 
     * @param {Phaser.GameObjects.Container} container 
     */
    constructor(scene, container) {
        this.scene = scene;
        this.container = container;
        this.image = null;
    }

    create() {
        // Calculate center relative to container (Top-Left 0,0)
        const centerX = STORE_CARD_CONSTANTS.WIDTH / 2;
        const centerY = STORE_CARD_CONSTANTS.HEIGHT / 2;

        // NOTE: Uses source width (120) for scale calculation to ensure exact fit
        const bgScale = STORE_CARD_CONSTANTS.WIDTH / 120;

        this.image = this.scene.add.image(centerX, centerY, ASSETS.STORE, STORE_CARD_CONSTANTS.TEXTURES.COMMON)
            .setOrigin(0.5)
            .setScale(bgScale);

        this.container.add(this.image);
    }

    /**
     * Updates the texture based on state
     * @param {string} rarity 
     * @param {boolean} owned 
     * @param {boolean} affordable 
     */
    updateTexture(rarity, owned, affordable) {
        if (!this.image) return;

        let texture = STORE_CARD_CONSTANTS.TEXTURES.COMMON;

        // if (owned) {
        //    texture = STORE_CARD_CONSTANTS.TEXTURES.OWNED;
        // } else {
        switch (rarity) {
            case 'rare': texture = STORE_CARD_CONSTANTS.TEXTURES.RARE; break;
            case 'epic': texture = STORE_CARD_CONSTANTS.TEXTURES.EPIC; break;
            case 'legendary': texture = STORE_CARD_CONSTANTS.TEXTURES.LEGENDARY; break;
            case 'blackmarket': texture = STORE_CARD_CONSTANTS.TEXTURES.BLACKMARKET; break;
            default: texture = STORE_CARD_CONSTANTS.TEXTURES.COMMON; break;
        }
        // }

        if (this.image.frame.name !== texture) {
            this.image.setFrame(texture);
        }
    }
}
