/**
 * UI Helper utilities for creating consistent UI elements
 */

export class UIHelpers {
    static DEFAULT_BUTTON_WIDTH = 260;
    static isDesktop(scene) {
        return scene?.sys?.game?.device?.os?.desktop === true;
    }

    static applyButtonEffects(target, options = {}) {
        if (!target || !target.scene) return;
        const {
            hoverScale = 1.1,
            clickScale = 0.95,
            enableHover = true,
            enableClick = true,
            useCurrentScale = false
        } = options;

        const baseScaleX = target.scaleX;
        const baseScaleY = target.scaleY;
        let hoverBaseX = baseScaleX;
        let hoverBaseY = baseScaleY;
        const isDesktop = UIHelpers.isDesktop(target.scene);

        if (enableHover && isDesktop) {
            target.on('pointerover', () => {
                if (!target.scene) return;
                hoverBaseX = useCurrentScale ? target.scaleX : baseScaleX;
                hoverBaseY = useCurrentScale ? target.scaleY : baseScaleY;
                target.setScale(hoverBaseX * hoverScale, hoverBaseY * hoverScale);
            });
            target.on('pointerout', () => {
                if (!target.scene) return;
                target.setScale(hoverBaseX, hoverBaseY);
            });
        }

        if (enableClick) {
            target.on('pointerdown', () => {
                if (!target.scene) return;
                const clickBaseX = useCurrentScale ? target.scaleX : baseScaleX;
                const clickBaseY = useCurrentScale ? target.scaleY : baseScaleY;
                target.setScale(clickBaseX, clickBaseY);
                target.scene.tweens.add({
                    targets: target,
                    scaleX: clickBaseX * clickScale,
                    scaleY: clickBaseY * clickScale,
                    duration: 50,
                    yoyo: true,
                    ignoreGlobalTimeScale: true
                });
            });
        }
    }

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

        // Bind Pointer Events (hover only on desktop)
        if (UIHelpers.isDesktop(container.scene)) {
            container.on('pointerover', () => buttonObj.select());
            container.on('pointerout', () => buttonObj.deselect());
        }

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
            fontSize: fontSize, color: textColor, fontFamily: 'Pixelify Sans',
            stroke: '#000000', strokeThickness: 4
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
            fontSize: fontSize, color: textColor, fontFamily: 'Pixelify Sans',
            stroke: '#000000', strokeThickness: 4
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

    /**
     * Create a button using a sprite image from the ui_hud atlas
     * @param {Phaser.Scene} scene - The scene to add the button to
     * @param {number} x - X position (center)
     * @param {number} y - Y position (center)
     * @param {string} frame - Frame name from ui_hud atlas (e.g., 'btn-start.png')
     * @param {object} options - Additional options
     * @returns {object} - Object containing container and sprite references
     */
    static createSpriteButton(scene, x, y, frame, options = {}) {
        const {
            scale = 1,
            depth = 201,
            callback = null,
            hoverScale = 1.1
        } = options;

        const container = scene.add.container(x, y).setDepth(depth).setScrollFactor(0);

        // Create the button sprite from ui_hud atlas
        const sprite = scene.add.image(0, 0, 'ui_hud', frame)
            .setOrigin(0.5)
            .setScale(scale);

        container.add([sprite]);
        container.setSize(sprite.displayWidth, sprite.displayHeight);
        container.setInteractive({ useHandCursor: true });

        const buttonObj = { container, sprite, text: null, bg: null };

        // Define Actions
        buttonObj.select = () => {
            if (!container.scene) return;
            container.setScale(hoverScale);
        };

        buttonObj.deselect = () => {
            if (!container.scene) return;
            container.setScale(1);
        };

        buttonObj.trigger = () => {
            if (callback) callback();
            if (!container.scene) return;

            if (container.active) {
                container.setScale(1.0);
                container.scene.tweens.add({
                    targets: container,
                    scale: 0.95,
                    duration: 50,
                    yoyo: true,
                    ignoreGlobalTimeScale: true
                });
            }
        };

        // Bind Pointer Events (hover only on desktop)
        if (UIHelpers.isDesktop(container.scene)) {
            container.on('pointerover', () => buttonObj.select());
            container.on('pointerout', () => buttonObj.deselect());
        }

        if (callback) {
            container.on('pointerdown', () => buttonObj.trigger());
        }

        container.uiWrapper = buttonObj;

        return buttonObj;
    }

    /**
     * Format large numbers into compact strings (e.g. 1.2k, 1M)
     * @param {number} amount - The numeric amount
     * @returns {string} - Formatted string
     */
    static formatCurrency(amount) {
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (amount >= 1000) {
            return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return (amount || 0).toLocaleString();
    }
    /**
     * Create a standardized Music toggle button
     */
    static createMusicButton(scene, x, y, options = {}) {
        const { scale = 1.0 } = options;
        const isEnabled = scene.registry.get('musicEnabled') !== false;
        const frame = isEnabled ? 'btn-mid/music-on.png' : 'btn-mid/music-off.png';
        const GameState = scene.sys.game.gameState; // Access singleton if available via game instance or import

        const btn = this.createSpriteButton(scene, x, y, frame, {
            scale,
            callback: () => {
                const current = scene.registry.get('musicEnabled') !== false;
                const newState = !current;

                // Update Registry
                scene.registry.set('musicEnabled', newState);

                // Update GameState if available (it should be)
                if (window.GameStateInstance) {
                    window.GameStateInstance.setMusicEnabled(newState);
                } else {
                    // Fallback using events if GameState instance not global
                    const Events = scene.events ? scene.events.constructor : null;
                    if (scene.game.events) scene.game.events.emit('MUSIC_TOGGLED', { enabled: newState });
                }

                // Update Visual
                const newFrame = newState ? 'btn-mid/music-on.png' : 'btn-mid/music-off.png';
                btn.sprite.setFrame(newFrame);

                if (options.callback) options.callback(newState);
            }
        });
        return btn;
    }

    /**
     * Create a standardized SFX toggle button
     */
    static createSFXButton(scene, x, y, options = {}) {
        const { scale = 1.0 } = options;
        const isEnabled = scene.registry.get('sfxEnabled') !== false;
        const frame = isEnabled ? 'btn-mid/sfx-on.png' : 'btn-mid/sfx-off.png';

        const btn = this.createSpriteButton(scene, x, y, frame, {
            scale,
            callback: () => {
                const current = scene.registry.get('sfxEnabled') !== false;
                const newState = !current;

                scene.registry.set('sfxEnabled', newState);

                if (window.GameStateInstance) {
                    window.GameStateInstance.setSFXEnabled(newState);
                }

                const newFrame = newState ? 'btn-mid/sfx-on.png' : 'btn-mid/sfx-off.png';
                btn.sprite.setFrame(newFrame);

                if (options.callback) options.callback(newState);
            }
        });
        return btn;
    }

    /**
     * Create a standardized Joystick toggle button
     */
    static createJoystickButton(scene, x, y, options = {}) {
        const { scale = 1.0 } = options;
        const isEnabled = scene.registry.get('showJoystick') !== false;
        const frame = isEnabled ? 'btn/btn-joystick-on.png' : 'btn/btn-joystick-off.png';

        const btn = this.createSpriteButton(scene, x, y, frame, {
            scale,
            callback: () => {
                const current = scene.registry.get('showJoystick') !== false;
                const newState = !current;

                scene.registry.set('showJoystick', newState);

                // Update Visual
                const newFrame = newState ? 'btn/btn-joystick-on.png' : 'btn/btn-joystick-off.png';
                btn.sprite.setFrame(newFrame);

                if (options.callback) options.callback(newState);
            }
        });
        return btn;
    }
}
