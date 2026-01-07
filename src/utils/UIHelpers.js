/**
 * UI Helper utilities for creating consistent UI elements
 */

export class UIHelpers {
    static DEFAULT_BUTTON_WIDTH = 260;

    /**
     * Create a button with an icon and text
     * @param {Phaser.Scene} scene - The scene to add the button to
     * @param {number} x - X position (center)
     * @param {number} y - Y position (center)
     * @param {string} iconFrame - Frame name from ui_icons atlas
     * @param {string} text - Button text
     * @param {object} options - Additional options
     * @returns {object} - Object containing container, text, and icon references
     */
    /**
     * Internal helper to standardize button behavior
     * @param {object} buttonObj - { container, text, bg, icon? }
     * @param {object} options - { textColor, hoverColor, iconTint, callback }
     */
    static setupButtonBehavior(buttonObj, options) {
        const { container, text, icon } = buttonObj;
        const { textColor = '#ffffff', hoverColor = '#ffff00', iconTint = 0xffffff, callback } = options;

        // Store original properties for restoration
        container.setData('originalColor', textColor);
        if (icon) container.setData('originalIconTint', iconTint);

        // Define Actions
        buttonObj.select = () => {
            if (!container.scene) return;
            if (text && text.scene) text.setColor(hoverColor);
            if (icon && icon.scene) icon.setTint(hoverColor === '#ffff00' ? 0xffff00 : parseInt(hoverColor.replace('#', '0x')));
            if (container.scene) container.setScale(1.1);
        };

        buttonObj.deselect = () => {
            if (!container.scene) return;
            if (text && text.scene) text.setColor(textColor);
            if (icon && icon.scene) icon.setTint(iconTint);
            if (container.scene) container.setScale(1.0);
        };

        buttonObj.trigger = () => {
            // 1. Execute Logic IMMEDIATELY for responsiveness
            if (callback) callback();

            if (!container.scene) return;

            // 2. Subtle Visual Feedback (Non-blocking)
            if (container.active) {
                // Reset scale first to avoid drift if clicked rapidly
                container.setScale(1.0);

                container.scene.tweens.add({
                    targets: container,
                    scale: 0.95, // Subtle "press" feel
                    duration: 50, // Very fast
                    yoyo: true,
                    ignoreGlobalTimeScale: true
                });
            }
        };

        // Bind Pointer Events
        container.on('pointerover', () => buttonObj.select());
        container.on('pointerout', () => buttonObj.deselect());

        if (callback) {
            container.on('pointerdown', () => buttonObj.trigger());
        }

        // Attach to container for easy access 
        container.uiWrapper = buttonObj;
    }

    /**
     * Create a button with an icon and text
     */
    static createIconButton(scene, x, y, iconFrame, text, options = {}) {
        const {
            fontSize = '24px',
            textColor = '#ffffff',
            hoverColor = '#ffff00',
            iconScale = 0.5,
            iconTint = 0xffffff,
            depth = 201,
            padding = { x: 20, y: 10 },
            width = UIHelpers.DEFAULT_BUTTON_WIDTH,
            callback = null
        } = options;

        const container = scene.add.container(x, y).setDepth(depth).setScrollFactor(0);

        // Background
        const bg = scene.add.rectangle(0, 0, 200, 50, 0x333333).setOrigin(0.5);

        // Text
        const buttonText = scene.add.text(15, 0, text, {
            fontSize: fontSize, color: textColor, fontStyle: 'bold'
        }).setOrigin(0.5);

        // Icon
        const icon = scene.add.image(-buttonText.width / 2 - 20, 0, 'ui_icons', iconFrame)
            .setOrigin(0.5).setScale(iconScale).setTint(iconTint);

        // Sizing
        const naturalWidth = icon.displayWidth + buttonText.width + padding.x * 3;
        const totalWidth = Math.max(width, naturalWidth);
        const totalHeight = Math.max(icon.displayHeight, buttonText.height) + padding.y * 2;
        bg.setSize(totalWidth, totalHeight);

        // Position
        const iconX = -totalWidth / 2 + padding.x + icon.displayWidth / 2;
        const textX = iconX + icon.displayWidth / 2 + 10 + buttonText.width / 2;
        icon.setX(iconX);
        buttonText.setX(textX);

        container.add([bg, icon, buttonText]);
        container.setSize(totalWidth, totalHeight);
        container.setInteractive({ useHandCursor: true });

        const buttonObj = { container, text: buttonText, icon, bg };
        UIHelpers.setupButtonBehavior(buttonObj, { textColor, hoverColor, iconTint, callback });

        return buttonObj;
    }

    /**
     * Create a simple text button
     */
    static createTextButton(scene, x, y, text, options = {}) {
        const {
            fontSize = '24px',
            textColor = '#ffffff',
            hoverColor = '#ffff00',
            depth = 201,
            padding = { x: 20, y: 10 },
            width = UIHelpers.DEFAULT_BUTTON_WIDTH,
            callback = null
        } = options;

        const container = scene.add.container(x, y).setDepth(depth).setScrollFactor(0);
        const buttonText = scene.add.text(0, 0, text, {
            fontSize: fontSize, color: textColor, fontStyle: 'bold'
        }).setOrigin(0.5);

        const naturalWidth = buttonText.width + padding.x * 2;
        const totalWidth = Math.max(width, naturalWidth);
        const totalHeight = buttonText.height + padding.y * 2;
        const bg = scene.add.rectangle(0, 0, totalWidth, totalHeight, 0x333333).setOrigin(0.5);

        container.add([bg, buttonText]);
        container.setSize(totalWidth, totalHeight);
        container.setInteractive({ useHandCursor: true });
        container.setScrollFactor(0);

        const buttonObj = { container, text: buttonText, bg };
        UIHelpers.setupButtonBehavior(buttonObj, { textColor, hoverColor, callback });

        return buttonObj;
    }
}
