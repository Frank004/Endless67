import { STORE_CARD_CONSTANTS } from './StoreCardConstants.js';
import { StoreCardBackground } from './StoreCardBackground.js';
import { StoreCardLabels } from './StoreCardLabels.js';

/**
 * StoreCard - Main UI Component
 * Orchestrates visuals and interactions.
 */
export class StoreCard extends Phaser.GameObjects.Container {
    constructor(scene, x, y, skinData, playerCoins) {
        super(scene, x, y);

        this.skinData = skinData;
        this.playerCoins = playerCoins;

        // Components
        this.background = new StoreCardBackground(scene, this);
        this.previewSprite = null; // Character Sprite
        this.labels = new StoreCardLabels(scene, this);

        // Initialize
        this.create();
    }

    create() {
        // Create Layout Components
        this.background.create();

        // Create Preview Sprite (Center of card)
        // Position at bottom with 20px padding
        this.previewSprite = this.scene.add.sprite(STORE_CARD_CONSTANTS.WIDTH / 2, STORE_CARD_CONSTANTS.HEIGHT - 15, 'player') // Default fallback
            .setOrigin(0.5, 1.0) // Bootom-Center origin
            .setScale(3); // Adjust scale to fit nicely
        this.add(this.previewSprite);

        this.labels.create();

        // Set Size and Input
        this.setSize(STORE_CARD_CONSTANTS.WIDTH, STORE_CARD_CONSTANTS.HEIGHT);
        this._setupInput();

        // Pointer Events
        this.on('pointerup', (pointer) => {
            if (this.scene.isDragging) return;
            const dist = Phaser.Math.Distance.Between(pointer.downX, pointer.downY, pointer.upX, pointer.upY);
            if (dist < 10) {
                this.handleClick();
            }
        });

        // Initial State Update
        this.updateVisualState();
    }

    _setupInput() {
        // Force clean slate
        if (this.input) {
            this.disableInteractive();
            this.removeInteractive();
        }

        // Center the hit area to match content
        const halfW = STORE_CARD_CONSTANTS.WIDTH / 2;
        const halfH = STORE_CARD_CONSTANTS.HEIGHT / 2;

        this.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(halfW, halfH, this.width, this.height),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });
    }

    updateVisualState() {
        const { owned, equipped, cost, rarity } = this.skinData;
        const affordable = this.playerCoins >= cost;

        this.background.updateTexture(rarity, owned, affordable);

        // Update Preview
        const skinKey = `skin_atlas_${this.skinData.id}`;
        if (this.scene.textures.exists(skinKey)) {
            const texture = this.scene.textures.get(skinKey);
            const frames = texture.getFrameNames();
            // Find a frame that matches "idle" and "1" or "01", preventing matches like "10", "11", etc.
            // Matches: "idle-01.png", "IDLE/IDLE 1.png", "IDLE_01.png"
            const idleFrame = frames.find(f => f.match(/idle.*[^0-9]0?1\.png/i));

            if (idleFrame) {
                this.previewSprite.setTexture(skinKey, idleFrame);
                this.previewSprite.setVisible(true);
            } else {
                this.previewSprite.setVisible(false);
            }
        } else {
            // Asset not loaded yet or invalid
            this.previewSprite.setVisible(false);
        }

        this.labels.update(owned, cost, equipped, affordable);

        this.updateInteractiveState();
    }

    updateAffordableState(newPlayerCoins) {
        this.playerCoins = newPlayerCoins;
        this.updateVisualState();
    }

    updateInteractiveState() {
        if (this.skinData.equipped) {
            if (this.input) {
                this.removeInteractive();
            }
        } else {
            // Check if input is missing OR if we want to ensure it's fresh
            if (!this.input || !this.input.enabled) {
                this._setupInput();
            }
        }
    }

    handleClick() {
        // Emit interaction intent immediately
        this.emit('cardClick', { skinData: this.skinData });
    }

    animateSuccess() {
        this._animateClick();
    }

    animateFail() {
        this._animateShake();
    }

    _animateClick() {
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.updateVisualState();
            }
        });
    }

    _animateShake() {
        this.scene.tweens.add({
            targets: this,
            x: this.x - 5,
            duration: 50,
            yoyo: true,
            repeat: 3
        });
    }
}
