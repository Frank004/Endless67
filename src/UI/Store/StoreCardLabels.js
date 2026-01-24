import { ASSETS } from '../../Config/AssetKeys.js';
import { UIHelpers } from '../../Utils/UIHelpers.js';
import { STORE_CARD_CONSTANTS } from './StoreCardConstants.js';

/**
 * Handles the text labels (Price, Owned, Equipped) of the Store Card.
 */
export class StoreCardLabels {
    /**
     * @param {Phaser.Scene} scene 
     * @param {Phaser.GameObjects.Container} container 
     */
    constructor(scene, container) {
        this.scene = scene;
        this.container = container;
        this.bottomContainer = null;
        this.equippedIndicator = null;
    }

    create() {
        const centerX = STORE_CARD_CONSTANTS.WIDTH / 2;
        const centerY = STORE_CARD_CONSTANTS.HEIGHT / 2;

        // Container for bottom area (Cost/Owned)
        this.bottomContainer = this.scene.add.container(centerX, centerY);
        this.container.add(this.bottomContainer);

        // Equipped Star Indicator (Top-Left)
        this.equippedIndicator = this.scene.add.text(10, 10, '★', {
            fontSize: '30px',
            color: STORE_CARD_CONSTANTS.COLORS.YELLOW,
            stroke: STORE_CARD_CONSTANTS.COLORS.BLACK,
            strokeThickness: 3
        }).setOrigin(0, 0); // Top-Left of the card

        this.equippedIndicator.setVisible(false);
        this.container.add(this.equippedIndicator);

        // Lock Icon (Top-Left)
        // Positioned same as equipped indicator: 10, 10
        // Use ASSETS.STORE instead of generic atlas if needed, but constants define texture name
        this.lockIcon = this.scene.add.image(10, 10, ASSETS.STORE, STORE_CARD_CONSTANTS.TEXTURES.LOCK)
            .setOrigin(0, 0); // Top-Left

        this.lockIcon.setVisible(false);
        this.container.add(this.lockIcon);
    }

    /**
     * Updates the status labels
     * @param {boolean} owned 
     * @param {number} cost 
     * @param {boolean} equipped 
     */
    update(owned, cost, equipped, affordable) {
        // Update Equipped Star
        if (this.equippedIndicator) {
            this.equippedIndicator.setVisible(equipped);
        }

        // Update Lock Icon
        if (this.lockIcon) {
            // Show lock if NOT owned AND NOT affordable
            const isLocked = !owned && !affordable;
            this.lockIcon.setVisible(isLocked);
        }

        // Rebuild Bottom Label
        this.bottomContainer.removeAll(true);
        const { LAYOUT, COLORS, FONTS } = STORE_CARD_CONSTANTS;

        if (owned) {
            const statusLabel = this.scene.add.text(LAYOUT.RIGHT_ANCHOR_X, LAYOUT.LABEL_Y, 'OWNED', {
                fontSize: FONTS.LABEL,
                fontFamily: FONTS.FAMILY,
                color: COLORS.YELLOW,
                stroke: COLORS.BLACK,
                strokeThickness: 3,
                fontStyle: 'bold',
                align: 'right'
            }).setOrigin(1, 0.5);

            this.bottomContainer.add(statusLabel);
        } else {
            const costText = this.scene.add.text(LAYOUT.RIGHT_ANCHOR_X, LAYOUT.LABEL_Y, UIHelpers.formatCurrency(cost), {
                fontSize: FONTS.PRICE,
                fontFamily: FONTS.FAMILY,
                color: affordable ? COLORS.TEXT : '#FF4444', // Red if can't afford
                fontStyle: 'bold',
                align: 'right'
            }).setOrigin(1, 0.5);

            const coinBaseSize = 8;
            const coinDisplayWidth = coinBaseSize * LAYOUT.COIN_SCALE;
            const textLeftEdgeX = LAYOUT.RIGHT_ANCHOR_X - costText.width;
            const coinCenterX = textLeftEdgeX - LAYOUT.ICON_PADDING - (coinDisplayWidth / 2);

            const coinIcon = this.scene.add.image(coinCenterX, LAYOUT.LABEL_Y, ASSETS.COINS, 'coin-01.png')
                .setScale(LAYOUT.COIN_SCALE)
                .setOrigin(0.4, 0.4);

            this.bottomContainer.add([costText, coinIcon]);
        }
    }
}
