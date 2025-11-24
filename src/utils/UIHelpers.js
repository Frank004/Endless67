/**
 * UI Helper utilities for creating consistent UI elements
 */

export class UIHelpers {
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
    static createIconButton(scene, x, y, iconFrame, text, options = {}) {
        const {
            fontSize = '24px',
            textColor = '#ffffff',
            hoverColor = '#ffff00',
            iconScale = 0.5,
            iconTint = 0xffffff,
            depth = 201,
            padding = { x: 20, y: 10 },
            callback = null
        } = options;

        // Create container for the button
        const container = scene.add.container(x, y).setDepth(depth).setScrollFactor(0);

        // Create background rectangle (we'll size it after creating text)
        const bg = scene.add.rectangle(0, 0, 200, 50, 0x333333)
            .setOrigin(0.5);

        // Create text
        const buttonText = scene.add.text(15, 0, text, {
            fontSize: fontSize,
            color: textColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Create icon (positioned to the left of text, inside the button)
        const icon = scene.add.image(-buttonText.width / 2 - 20, 0, 'ui_icons', iconFrame)
            .setOrigin(0.5)
            .setScale(iconScale)
            .setTint(iconTint);

        // Resize background to fit content with padding
        const totalWidth = icon.displayWidth + buttonText.width + padding.x * 3;
        const totalHeight = Math.max(icon.displayHeight, buttonText.height) + padding.y * 2;
        bg.setSize(totalWidth, totalHeight);

        // Reposition icon and text to be centered in the background
        const iconX = -totalWidth / 2 + padding.x + icon.displayWidth / 2;
        const textX = iconX + icon.displayWidth / 2 + 10 + buttonText.width / 2;

        icon.setX(iconX);
        buttonText.setX(textX);

        // Add to container
        container.add([bg, icon, buttonText]);

        // Make interactive
        container.setSize(totalWidth, totalHeight);
        container.setInteractive({ useHandCursor: true });

        // Hover effects
        container.on('pointerover', () => {
            buttonText.setColor(hoverColor);
            icon.setTint(hoverColor === '#ffff00' ? 0xffff00 : parseInt(hoverColor.replace('#', '0x')));
        });

        container.on('pointerout', () => {
            buttonText.setColor(textColor);
            icon.setTint(iconTint);
        });

        // Callback
        if (callback) {
            container.on('pointerdown', callback);
        }

        return { container, text: buttonText, icon, bg };
    }

    /**
     * Create a simple text button
     * @param {Phaser.Scene} scene - The scene to add the button to
     * @param {number} x - X position (center)
     * @param {number} y - Y position (center)
     * @param {string} text - Button text
     * @param {object} options - Additional options
     * @returns {Phaser.GameObjects.Text} - The text object
     */
    static createTextButton(scene, x, y, text, options = {}) {
        const {
            fontSize = '24px',
            textColor = '#ffffff',
            hoverColor = '#00ffff',
            depth = 201,
            padding = { x: 20, y: 10 },
            callback = null
        } = options;

        const button = scene.add.text(x, y, text, {
            fontSize: fontSize,
            color: textColor,
            fontStyle: 'bold',
            backgroundColor: '#333333',
            padding: padding
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth).setInteractive({ useHandCursor: true });

        button.on('pointerover', () => button.setColor(hoverColor));
        button.on('pointerout', () => button.setColor(textColor));

        if (callback) {
            button.on('pointerdown', callback);
        }

        return button;
    }
}
