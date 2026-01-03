export class GameOverMenu {
    constructor(scene) {
        this.scene = scene;
        this.blinkInterval = null;
    }

    showNameInput(scoreManager) {
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

        // Use InputManager to handle keyboard input for desktop
        let keyListener = null;

        if (!isMobile) {
            keyListener = scene.inputManager.createTextInputListener({
                onBackspace: () => {
                    if (name.length > 0) {
                        name = name.slice(0, -1);
                        updateNameTextDisplay();
                    }
                },
                onEnter: () => {
                    if (name.length > 0) { // Changed condition to match logic: submit if > 0
                        if (this.blinkInterval) this.blinkInterval.remove();
                        this.confirmScore(scoreManager, name, keyListener, [bg, title, prompt, nameText, confirmBtn], htmlInput);
                    }
                },
                onKeyPress: (key) => {
                    if (name.length < 3 && /[a-zA-Z0-9]/.test(key)) {
                        name += key.toUpperCase();
                        updateNameTextDisplay();
                    }
                }
            });
        }

        confirmBtn.on('pointerdown', () => {
            if (name.length > 0) {
                // Get final name from HTML input if mobile
                if (isMobile && htmlInput) {
                    name = htmlInput.value.toUpperCase().substring(0, 3);
                }

                // Stop blinking
                if (this.blinkInterval) this.blinkInterval.remove();

                this.confirmScore(scoreManager, name, keyListener, [bg, title, prompt, nameText, confirmBtn], htmlInput);
            }
        });
    }

    confirmScore(scoreManager, name, keyListener, elementsToDestroy, htmlInput = null) {
        const scene = this.scene;
        scoreManager.saveScore(name || 'UNK', scene.totalScore, scene.currentHeight);

        // Remove keyboard listener if desktop (using InputManager method)
        if (keyListener && !scene.isMobile) {
            scene.inputManager.removeTextInputListener(keyListener);
        }

        // Remove HTML input if mobile (using InputManager method)
        if (htmlInput) {
            scene.inputManager.removeMobileTextInput(htmlInput);
        }

        // Clean up input UI
        elementsToDestroy.forEach(el => el.destroy());

        // Show Options
        this.showPostGameOptions();
    }

    showPostGameOptions() {
        const scene = this.scene;

        // Ensure Game Over text is visible via scene helper if available (compatibility)
        if (scene.uiText) {
            scene.uiText.setVisible(true);
            scene.uiText.setText(`GAME OVER\nScore: ${scene.totalScore}`);
        }

        const centerX = scene.cameras.main.centerX;
        const startY = 350;
        const spacing = 60;

        // Restart Button
        const restartBtn = scene.add.text(centerX, startY, '🔄 RESTART', {
            fontSize: '24px', color: '#00ff00', backgroundColor: '#333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => {
            scene.audioManager.stopAudio();
            scene.scene.restart();
        });

        // Leaderboard Button
        const leaderboardBtn = scene.add.text(centerX, startY + spacing, '🏆 LEADERBOARD', {
            fontSize: '24px', color: '#00ffff', backgroundColor: '#333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0).setInteractive({ useHandCursor: true });

        leaderboardBtn.on('pointerdown', () => {
            scene.scene.start('Leaderboard');
        });

        // Menu Button
        const menuBtn = scene.add.text(centerX, startY + spacing * 2, '🏠 MAIN MENU', {
            fontSize: '24px', color: '#ffffff', backgroundColor: '#333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => {
            scene.scene.start('MainMenu');
        });

        // Hover effects
        [restartBtn, leaderboardBtn, menuBtn].forEach(btn => {
            btn.on('pointerover', () => btn.setColor('#ffff00'));
            btn.on('pointerout', () => {
                if (btn === restartBtn) btn.setColor('#00ff00');
                else if (btn === leaderboardBtn) btn.setColor('#00ffff');
                else btn.setColor('#ffffff');
            });
        });
    }
}
