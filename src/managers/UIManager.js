import { ScoreManager } from './ScoreManager.js';

export class UIManager {
    constructor(scene) {
        this.scene = scene;
    }

    createUI() {
        const scene = this.scene;
        const isMobile = scene.isMobile;

        // UI - Ajustar márgenes para móvil
        const scoreX = isMobile ? 20 : 10;
        const scoreY = isMobile ? 20 : 10;
        const centerX = scene.cameras.main.centerX;
        const gameWidth = scene.cameras.main.width;
        scene.scoreText = scene.add.text(scoreX, scoreY, 'SCORE: 0', { fontSize: '24px', color: '#ffd700', fontStyle: 'bold' }).setScrollFactor(0).setDepth(100);
        scene.heightText = scene.add.text(scoreX, scoreY + 30, 'ALTURA: ' + scene.currentHeight + 'm', { fontSize: '14px', color: '#fff' }).setScrollFactor(0).setDepth(100);
        scene.uiText = scene.add.text(centerX, 200, '¡SUBE!', { fontSize: '18px', color: '#00ffff', align: 'center', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        // --- PAUSE BUTTON ---
        scene.pauseButton = scene.add.text(gameWidth - 30, 10, '⏸', { fontSize: '24px', color: '#ffffff' })
            .setScrollFactor(0).setDepth(150).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.togglePauseMenu());

        // --- PAUSE MENU OVERLAY ---
        scene.pauseMenuBg = scene.add.rectangle(scene.cameras.main.centerX, scene.cameras.main.centerY, scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.9)
            .setScrollFactor(0).setDepth(200).setVisible(false).setInteractive();

        scene.pauseMenuTitle = scene.add.text(centerX, 180, 'PAUSA', {
            fontSize: '48px', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);

        scene.versionText = scene.add.text(centerX, 220, 'v0.0.35', {
            fontSize: '14px', color: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);

        // Continue Button
        scene.continueButton = scene.add.text(centerX, 260, 'CONTINUAR', {
            fontSize: '24px', color: '#00ff00', fontStyle: 'bold',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.togglePauseMenu())
            .on('pointerover', function () { this.setColor('#00ffff'); })
            .on('pointerout', function () { this.setColor('#00ff00'); });

        // Sound Toggle Button - Initialize with current state from registry
        const soundEnabled = scene.registry.get('soundEnabled') !== false;
        const soundButtonText = soundEnabled ? '🔊 SONIDO: ON' : '🔇 SONIDO: OFF';
        scene.soundToggleButton = scene.add.text(centerX, 330, soundButtonText, {
            fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => scene.toggleSound()) // Assuming toggleSound remains in Game or moves to Audio
            .on('pointerover', function () { this.setColor('#ffff00'); })
            .on('pointerout', function () { this.setColor('#ffffff'); });

        // Joystick Toggle Button - Initialize with current state from registry
        const showJoystick = scene.registry.get('showJoystick') !== false;
        const joystickButtonText = showJoystick ? '🕹️ JOYSTICK: ON' : '🕹️ JOYSTICK: OFF';
        scene.joystickToggleButton = scene.add.text(centerX, 400, joystickButtonText, {
            fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => scene.inputManager.toggleJoystickVisual())
            .on('pointerover', function () { this.setColor('#ffff00'); })
            .on('pointerout', function () { this.setColor('#ffffff'); });

        // Exit Button
        scene.exitButton = scene.add.text(centerX, 470, '🚪 SALIR AL MENÚ', {
            fontSize: '24px', color: '#ff6666', fontStyle: 'bold',
            backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                scene.scene.start('MainMenu');
            })
            .on('pointerover', function () { this.setColor('#ff0000'); })
            .on('pointerout', function () { this.setColor('#ff6666'); });

        // Joystick UI (created here but controlled by InputManager)
        scene.joystickBase = scene.add.image(0, 0, 'joystick_base').setAlpha(0.5).setScrollFactor(0).setDepth(999).setVisible(false);
        scene.joystickKnob = scene.add.image(0, 0, 'joystick_knob').setAlpha(0.8).setScrollFactor(0).setDepth(1000).setVisible(false);

        // Mobile Controls UI
        if (isMobile) {
            const cameraHeight = scene.cameras.main.height;
            const cameraWidth = scene.cameras.main.width;
            // Dynamic split based on game width (70% for mobile)
            const SPLIT_X = Math.round(cameraWidth * 0.70);

            let splitLine = scene.add.graphics();
            splitLine.lineStyle(2, 0xffffff, 0.15);
            splitLine.beginPath(); splitLine.moveTo(SPLIT_X, cameraHeight); splitLine.lineTo(SPLIT_X, cameraHeight - 50); splitLine.strokePath();
            splitLine.setScrollFactor(0).setDepth(0);

            const controlY = cameraHeight - 40;
            // Left side text: center of left area (SPLIT_X / 2)
            const leftTextX = Math.round(SPLIT_X / 2);
            // Right side text: center of right area (SPLIT_X + (cameraWidth - SPLIT_X) / 2)
            const rightTextX = Math.round(SPLIT_X + (cameraWidth - SPLIT_X) / 2);

            scene.add.text(leftTextX, controlY, '< HOLD & SLIDE >', { fontSize: '12px', color: '#fff', alpha: 0.4 }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
            scene.add.text(rightTextX, controlY, 'JUMP', { fontSize: '12px', color: '#fff', alpha: 0.4 }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        } else {
            scene.add.text(centerX, 560, '← → MOVER | SPACE SALTAR', { fontSize: '12px', color: '#fff', alpha: 0.4 }).setOrigin(0.5).setScrollFactor(0);
        }
    }

    showJoystick(x, y, visible) {
        const scene = this.scene;
        if (scene.joystickBase && scene.joystickKnob) {
            scene.joystickBase.setPosition(x, y);
            scene.joystickKnob.setPosition(x, y);
            if (visible) {
                scene.joystickBase.setVisible(true);
                scene.joystickKnob.setVisible(true);
            }
        }
    }

    updateJoystickKnob(x, y) {
        const scene = this.scene;
        if (scene.joystickKnob) {
            scene.joystickKnob.setPosition(x, y);
        }
    }

    hideJoystick() {
        const scene = this.scene;
        if (scene.joystickBase) scene.joystickBase.setVisible(false);
        if (scene.joystickKnob) scene.joystickKnob.setVisible(false);
    }

    showJumpFeedback(x, y) {
        const scene = this.scene;
        let feedback = scene.add.image(x, y, 'jump_feedback')
            .setAlpha(0.8).setDepth(1000).setScrollFactor(0);
        scene.tweens.add({
            targets: feedback,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => feedback.destroy()
        });
    }

    update() {
        const scene = this.scene;
        scene.heightText.setText(`ALTURA: ${scene.currentHeight}m`);
    }

    updateScore(score) {
        const scene = this.scene;
        if (scene.scoreText) {
            scene.scoreText.setText('SCORE: ' + score);
        }
    }

    togglePauseMenu() {
        const scene = this.scene;
        scene.isPaused = !scene.isPaused;

        if (scene.isPaused) {
            scene.physics.pause();
            // Update button texts to reflect current registry state
            const soundEnabled = scene.registry.get('soundEnabled') !== false;
            const soundButtonText = soundEnabled ? '🔊 SONIDO: ON' : '🔇 SONIDO: OFF';
            if (scene.soundToggleButton) {
                scene.soundToggleButton.setText(soundButtonText);
            }

            const showJoystick = scene.registry.get('showJoystick') !== false;
            const joystickButtonText = showJoystick ? '🕹️ JOYSTICK: ON' : '🕹️ JOYSTICK: OFF';
            if (scene.joystickToggleButton) {
                scene.joystickToggleButton.setText(joystickButtonText);
            }

            scene.pauseMenuBg.setVisible(true);
            scene.pauseMenuTitle.setVisible(true);
            if (scene.versionText) scene.versionText.setVisible(true);
            scene.continueButton.setVisible(true);
            scene.soundToggleButton.setVisible(true);
            scene.joystickToggleButton.setVisible(true);
            scene.exitButton.setVisible(true);
            scene.pauseButton.setText('▶'); // Play icon
            scene.tweens.pauseAll();
        } else {
            scene.physics.resume();
            scene.pauseMenuBg.setVisible(false);
            scene.pauseMenuTitle.setVisible(false);
            if (scene.versionText) scene.versionText.setVisible(false);
            scene.continueButton.setVisible(false);
            scene.soundToggleButton.setVisible(false);
            scene.joystickToggleButton.setVisible(false);
            scene.exitButton.setVisible(false);
            scene.pauseButton.setText('⏸'); // Pause icon
            scene.tweens.resumeAll();
        }
    }

    trigger67Celebration() {
        const scene = this.scene;
        try {
            scene.isPausedEvent = true;
            scene.physics.pause();
            scene.cameras.main.flash(500, 255, 255, 255);

            if (scene.confettiEmitter) {
                scene.confettiEmitter.setPosition(scene.cameras.main.centerX, scene.cameras.main.scrollY - 50);
                scene.confettiEmitter.explode(80);
            }

            // Play celebration sound - delegate to AudioManager
            if (scene.audioManager) {
                scene.audioManager.playCelebrationSound();
            }

            let t = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.scrollY + 300, '67!', {
                fontFamily: '"Courier New", monospace', fontSize: '100px', color: '#ffd700', fontStyle: 'bold', stroke: '#8B4500', strokeThickness: 10,
                shadow: { offsetX: 6, offsetY: 6, color: '#000000', blur: 0, stroke: true, fill: true }
            }).setOrigin(0.5).setDepth(200);

            scene.tweens.add({ targets: t, scaleX: 1.3, scaleY: 1.3, duration: 300, yoyo: true, repeat: 2 });

            scene.time.delayedCall(1500, () => {
                if (t && t.destroy) t.destroy();
                scene.physics.resume();
                scene.isPausedEvent = false;
            });
        } catch (e) {
            console.error('Error in trigger67Celebration:', e);
            scene.physics.resume();
            scene.isPausedEvent = false;
        }
    }

    showNameInput(scoreManager) {
        const scene = this.scene;
        scene.uiText.setVisible(false); // Hide Game Over text temporarily

        // Background for input
        const centerX = scene.cameras.main.centerX;
        const bg = scene.add.rectangle(centerX, 300, 320, 240, 0x000000, 0.95).setDepth(300).setScrollFactor(0);
        bg.setStrokeStyle(2, 0xffd700);

        const title = scene.add.text(centerX, 220, 'NEW HIGH SCORE!', {
            fontSize: '24px', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        const isMobile = scene.isMobile;
        const promptText = isMobile ? 'TAP TO ENTER INITIALS' : 'ENTER 3 INITIALS:';

        const prompt = scene.add.text(centerX, 260, promptText, {
            fontSize: '16px', color: '#fff'
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        // Name Display
        let name = '';
        const nameText = scene.add.text(centerX, 310, '_ _ _', {
            fontSize: '48px', color: '#00ffff', fontStyle: 'bold', letterSpacing: 10
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        // Confirm Button
        const confirmBtn = scene.add.text(centerX, 380, 'CONFIRM', {
            fontSize: '24px', color: '#00ff00', backgroundColor: '#333', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0).setInteractive({ useHandCursor: true });

        // Use InputManager to create mobile text input
        const htmlInput = scene.inputManager.createMobileTextInput({
            onInputChange: (value) => {
                name = value;
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
                        const display = name.padEnd(3, '_').split('').join(' ');
                        nameText.setText(display);
                    }
                },
                onEnter: () => {
                    if (name.length > 0) {
                        this.confirmScore(scoreManager, name, keyListener, [bg, title, prompt, nameText, confirmBtn], htmlInput);
                    }
                },
                onKeyPress: (key) => {
                    if (name.length < 3 && /[a-zA-Z0-9]/.test(key)) {
                        name += key.toUpperCase();
                        const display = name.padEnd(3, '_').split('').join(' ');
                        nameText.setText(display);
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
        scene.uiText.setVisible(true); // Ensure Game Over text is visible
        scene.uiText.setText(`GAME OVER\nScore: ${scene.totalScore}`);

        const centerX = scene.cameras.main.centerX;
        const startY = 350;
        const spacing = 60;

        // Restart Button
        const restartBtn = scene.add.text(centerX, startY, '🔄 RESTART', {
            fontSize: '24px', color: '#00ff00', backgroundColor: '#333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => {
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
