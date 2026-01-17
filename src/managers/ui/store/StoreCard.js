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
        this.labels = new StoreCardLabels(scene, this);

        // Initialize
        this.create();
    }

    create() {
        // 1. Create Layout Components
        this.background.create();
        this.labels.create();

        // 2. Set Size and Input (Standard Top-Left)
        this.setSize(STORE_CARD_CONSTANTS.WIDTH, STORE_CARD_CONSTANTS.HEIGHT);

        // 3. Setup Input (Centralized)
        this._setupInput();

        // 4. Pointer Events
        this.on('pointerup', (pointer) => {
            if (this.scene.isDragging) return;
            const dist = Phaser.Math.Distance.Between(pointer.downX, pointer.downY, pointer.upX, pointer.upY);
            if (dist < 10) {
                this.handleClick();
            }
        });

        // 5. Initial State Update
        this.updateVisualState();
    }

    _setupInput() {
        // Force clean slate
        if (this.input) {
            this.disableInteractive();
            this.removeInteractive();
        }

        // Standard Phaser: HitArea is relative to the Game Object's origin.
        // For a Container, the origin is always 0,0 (Top-Left).
        // However, based on visual verification, we need to center the hit area logic 
        // to match the centered content.
        const halfW = STORE_CARD_CONSTANTS.WIDTH / 2;
        const halfH = STORE_CARD_CONSTANTS.HEIGHT / 2;

        this.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(halfW, halfH, this.width, this.height),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });

        // Force debug refresh
        this.scene.input.enableDebug(this, STORE_CARD_CONSTANTS.COLORS.DEBUG);
    }

    updateVisualState() {
        const { owned, equipped, cost, rarity } = this.skinData;
        const affordable = this.playerCoins >= cost;

        this.background.updateTexture(rarity, owned, affordable);
        this.labels.update(owned, cost, equipped);

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
        // Emit interaction intent immediately. 
        // Logic (can afford? already equipped?) is for the parent/manager to decide.
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
