import EventBus, { Events } from '../../Core/EventBus.js';
import { UIHelpers } from '../../Utils/UIHelpers.js';
import { MenuNavigation } from './MenuNavigation.js';

export class GameOverMenu {
    constructor(scene) {
        this.scene = scene;
        this.blinkInterval = null;
        this.navListeners = null;
        this.currentState = null; // 'NAME_INPUT' | 'POST_GAME_OPTIONS' | null

        // Ensure cleanup on scene shutdown to prevent EventBus leaks
        scene.events.once('shutdown', () => this.cleanup());
    }

    cleanup() {
        if (this.menuNavigation) {
            this.menuNavigation.cleanup();
        }
        if (this.blinkInterval) {
            this.blinkInterval.remove();
            this.blinkInterval = null;
        }
        this.currentState = null;
    }

    reset() {
        this.cleanup();
        this.currentState = null;
    }

    showNameInput(scoreManager) {
        console.log('[GameOverMenu] showNameInput called. CurrentState:', this.currentState);

        // Ensure any previous navigation is killed
        if (this.menuNavigation) {
            console.log('[GameOverMenu] Cleaning up leftover MenuNavigation');
            this.menuNavigation.cleanup();
            this.menuNavigation = null;
        }

        // Force reset state to allow name input
        if (this.currentState !== null) {
            console.warn('[GameOverMenu] Forcing state reset from:', this.currentState);
            this.currentState = null;
        }

        this.currentState = 'NAME_INPUT';
        console.log('[GameOverMenu] State set to NAME_INPUT');

        const scene = this.scene;
        // Temporarily hide generic Game Over text handled by HUDManager if possible
        if (scene.uiText) scene.uiText.setVisible(false);

        // Background for input
        const centerX = scene.cameras.main.centerX;
        const centerY = scene.cameras.main.centerY;

        const bg = scene.add.rectangle(centerX, centerY, scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.9)
            .setOrigin(0.5).setDepth(300).setScrollFactor(0);
        bg.setStrokeStyle(2, 0xffd700);

        const title = scene.add.text(centerX, centerY - 90, 'NEW HIGH SCORE!', {
            fontSize: '24px', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        const isMobile = scene.isMobile;
        const promptText = isMobile ? 'TAP TO ENTER INITIALS' : 'ENTER 3 INITIALS:';

        const prompt = scene.add.text(centerX, centerY - 50, promptText, {
            fontSize: '16px', color: '#fff'
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        // Name Display
        let name = '';
        const nameText = scene.add.text(centerX, centerY + 20, '_ _ _', {
            fontSize: '48px',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        // Add blinking cursor effect to the first underscore
        let cursorVisible = true;
        const updateNameTextDisplay = () => {
            const display = name.padEnd(3, '_').split('').join(' ');
            if (name.length < 3 && cursorVisible) {
                // Replace the first underscore with a blinking cursor
                const chars = display.split(' ');
                chars[name.length] = '|';
                nameText.setText(chars.join(' '));
            } else {
                nameText.setText(display);
            }
        };

        this.blinkInterval = scene.time.addEvent({
            delay: 500,
            callback: () => {
                cursorVisible = !cursorVisible;
                updateNameTextDisplay();
            },
            loop: true
        });

        const confirmBtn = scene.add.text(centerX, centerY + 100, 'CONFIRM', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#00aa00',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0).setInteractive({ useHandCursor: true });

        // Use InputManager to create mobile text input
        const htmlInput = scene.inputManager.createMobileTextInput({
            onInputChange: (value) => {
                name = value.toUpperCase().substring(0, 3);
                updateNameTextDisplay();
            },
            onEnter: (value) => {
                name = value;
                confirmBtn.emit('pointerdown');
            },
            nameTextDisplay: nameText,
            clickableText: nameText
        });

        // Mobile: Make everything clickable to focus input
        if (isMobile && htmlInput) {
            const focusInput = () => {
                try {
                    htmlInput.focus();
                    htmlInput.click();
                } catch (e) {
                    console.error('Error focusing input:', e);
                }
            };

            bg.setInteractive({ useHandCursor: true }).on('pointerdown', focusInput);
            title.setInteractive({ useHandCursor: true }).on('pointerdown', focusInput);
            prompt.setInteractive({ useHandCursor: true }).on('pointerdown', focusInput);

            // Add a pulsing effect to the prompt to encourage tapping
            scene.tweens.add({
                targets: prompt,
                alpha: 0.5,
                duration: 800,
                yoyo: true,
                repeat: -1
            });
        }

        // Use InputManager to handle keyboard input (enabled for both mobile and desktop)
        let keyListener = null;

        // Always enable keyboard input for better compatibility
        keyListener = scene.inputManager.createTextInputListener({
            onBackspace: () => {
                if (name.length > 0) {
                    name = name.slice(0, -1);
                    updateNameTextDisplay();
                }
            },
            onEnter: () => {
                // Submit name
                if (this.blinkInterval) this.blinkInterval.remove();
                this.confirmScore(scoreManager, name, keyListener, [bg, title, prompt, nameText, confirmBtn], htmlInput);
            },
            onKeyPress: (key) => {
                if (name.length < 3 && /[a-zA-Z0-9]/.test(key)) {
                    name += key.toUpperCase();
                    updateNameTextDisplay();
                }
            }
        });

        // Pointer support for confirm button
        confirmBtn.on('pointerdown', () => {
            if (this.blinkInterval) this.blinkInterval.remove();
            this.confirmScore(scoreManager, name, keyListener, [bg, title, prompt, nameText, confirmBtn], htmlInput);
        });
    }

    confirmScore(scoreManager, name, keyListener, elementsToDestroy, htmlInput = null) {
        const scene = this.scene;
        scoreManager.saveScore(name || 'UNK', scene.totalScore, scene.currentHeight);

        // Remove keyboard listener (always created now)
        if (keyListener) {
            scene.inputManager.removeTextInputListener(keyListener);
        }

        // Remove HTML input if mobile (using InputManager method)
        if (htmlInput) {
            scene.inputManager.removeMobileTextInput(htmlInput);
        }

        // Clean up input UI
        elementsToDestroy.forEach(el => el.destroy());

        // Transition state
        this.currentState = null;

        // Show Options
        this.showPostGameOptions();
    }

    showPostGameOptions() {
        // Prevent showing options if already in a state
        if (this.currentState !== null) {
            console.warn('[GameOverMenu] Already in state:', this.currentState);
            return;
        }
        this.currentState = 'POST_GAME_OPTIONS';

        const scene = this.scene;

        // Set extended cooldown to prevent accidental restart
        if (scene.inputManager) {
            scene.inputManager.setExtendedCooldown(800); // 800ms cooldown for Game Over
        }

        // Ensure Game Over text is visible via scene helper if available (compatibility)
        if (scene.uiText) {
            scene.uiText.setVisible(true);
            scene.uiText.setText(`GAME OVER\nHeight: ${scene.currentHeight}m`);
        }

        const centerX = scene.cameras.main.centerX;
        const startY = 350;
        const spacing = 60;

        // Restart Button
        const restartBtn = UIHelpers.createTextButton(scene, centerX, startY, '🔄 RESTART', {
            textColor: '#00ff00',
            callback: () => {
                // Reset InputManager before restart
                if (scene.inputManager) {
                    scene.inputManager.setExtendedCooldown(1000);
                }
                scene.audioManager.stopAudio();
                scene.time.delayedCall(100, () => {
                    scene.scene.restart();
                });
            }
        });

        // Leaderboard Button
        const leaderboardBtn = UIHelpers.createTextButton(scene, centerX, startY + spacing, '🏆 LEADERBOARD', {
            textColor: '#00ffff',
            callback: () => {
                // Reset InputManager before scene transition
                if (scene.inputManager) {
                    scene.inputManager.setExtendedCooldown(1000);
                }
                scene.time.delayedCall(100, () => {
                    scene.scene.start('Leaderboard');
                });
            }
        });

        // Menu Button
        const menuBtn = UIHelpers.createTextButton(scene, centerX, startY + spacing * 2, '🏠 MAIN MENU', {
            textColor: '#ffffff',
            callback: () => {
                // Reset InputManager to prevent inputs from carrying over to MainMenu
                if (scene.inputManager) {
                    scene.inputManager.setExtendedCooldown(1500); // Long cooldown
                }
                // Small delay to ensure cooldown is set before scene transition
                scene.time.delayedCall(100, () => {
                    scene.scene.start('MainMenu');
                });
            }
        });

        // Setup centralized navigation
        if (this.menuNavigation) this.menuNavigation.cleanup();

        this.menuNavigation = new MenuNavigation(scene, [restartBtn, leaderboardBtn, menuBtn]);
        this.menuNavigation.setup();
        // Force selection of first button to ensure visual highlight
        this.menuNavigation.selectButton(0);
    }
}
