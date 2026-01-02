import ScoreManager from './ScoreManager.js';
import { UIHelpers } from '../utils/UIHelpers.js';
import EventBus, { Events } from '../core/EventBus.js';
import GameState from '../core/GameState.js';

export class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.eventListeners = [];
    }

    createUI() {
        const scene = this.scene;
        const isMobile = scene.isMobile;

        // UI - Position away from left wall
        const scoreX = 35; // Align with wall
        const scoreY = isMobile ? 20 : 10;
        const centerX = scene.cameras.main.centerX;
        const gameWidth = scene.cameras.main.width;

        // Semi-transparent background for score
        scene.scoreTextBg = scene.add.rectangle(scoreX, scoreY + 12, 130, 28, 0x000000, 0.5)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(99);

        scene.scoreText = scene.add.text(scoreX + 8, scoreY, 'SCORE: 0', {
            fontSize: '20px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(100);

        // Semi-transparent background for height
        scene.heightTextBg = scene.add.rectangle(scoreX, scoreY + 42, 110, 22, 0x000000, 0.5)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(99);

        scene.heightText = scene.add.text(scoreX + 8, scoreY + 30, 'HEIGHT: ' + scene.currentHeight + 'm', {
            fontSize: '14px',
            color: '#fff'
        }).setScrollFactor(0).setDepth(100);

        scene.uiText = scene.add.text(centerX, 200, 'CLIMB!', { fontSize: '18px', color: '#00ffff', align: 'center', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        // --- PAUSE BUTTON ---
        // Icon should be white (from atlas) and sized appropriately
        // Positioned inside right wall (approx 32px from right)

        // Circular background for pause button
        scene.pauseButtonBg = scene.add.circle(gameWidth - 16, 40, 16, 0x000000, 0.5)
            .setScrollFactor(0).setDepth(149);

        scene.pauseButton = scene.add.image(gameWidth - 16, 40, 'ui_icons', 'pause')
            .setScrollFactor(0).setDepth(150).setInteractive({ useHandCursor: true })
            .setScale(0.375) // Scale down 64px to 24px
            .setTint(0xffffff) // Ensure white/light
            .on('pointerdown', () => this.togglePauseMenu())
            .on('pointerover', () => scene.pauseButtonBg.setFillStyle(0x333333, 0.7))
            .on('pointerout', () => scene.pauseButtonBg.setFillStyle(0x000000, 0.5));

        // --- PAUSE MENU OVERLAY ---
        scene.pauseMenuBg = scene.add.rectangle(scene.cameras.main.centerX, scene.cameras.main.centerY, scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.9)
            .setScrollFactor(0).setDepth(200).setVisible(false).setInteractive();

        scene.pauseMenuTitle = scene.add.text(centerX, 180, 'PAUSE', {
            fontSize: '48px', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);

        scene.versionText = scene.add.text(centerX, 220, 'v0.0.36', {
            fontSize: '14px', color: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setVisible(false);

        // Button spacing
        const buttonSpacing = 70;
        let buttonY = 280;

        // Continue Button (Text only, no icon)
        const continueBtn = UIHelpers.createTextButton(scene, centerX, buttonY, 'CONTINUE', {
            textColor: '#00ff00',
            hoverColor: '#00ffff',
            callback: () => this.togglePauseMenu()
        });
        scene.continueButton = continueBtn.container;
        scene.continueButtonText = continueBtn.text;
        scene.continueButton.setVisible(false);
        buttonY += buttonSpacing;

        // Sound Toggle Button (Icon + Text)
        const soundEnabled = scene.registry.get('soundEnabled') !== false;
        const soundTextStr = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
        const soundIconFrame = soundEnabled ? 'volume-up' : 'volume-mute';

        const soundButton = UIHelpers.createIconButton(scene, centerX, buttonY, soundIconFrame, soundTextStr, {
            callback: () => scene.toggleSound()
        });
        scene.soundToggleContainer = soundButton.container;
        scene.soundToggleText = soundButton.text;
        scene.soundToggleIcon = soundButton.icon;
        scene.soundToggleContainer.setVisible(false);
        buttonY += buttonSpacing;

        // Joystick Toggle Button (Icon + Text)
        const showJoystick = scene.registry.get('showJoystick') !== false;
        const joystickTextStr = showJoystick ? 'JOYSTICK: ON' : 'JOYSTICK: OFF';

        const joystickButton = UIHelpers.createIconButton(scene, centerX, buttonY, 'gamepad', joystickTextStr, {
            callback: () => scene.inputManager.toggleJoystickVisual()
        });
        scene.joystickToggleContainer = joystickButton.container;
        scene.joystickToggleText = joystickButton.text;
        scene.joystickToggleIcon = joystickButton.icon;
        scene.joystickToggleContainer.setVisible(false);
        buttonY += buttonSpacing;

        // Exit Button (Icon + Text)
        const exitButton = UIHelpers.createIconButton(scene, centerX, buttonY, 'door', 'EXIT TO MENU', {
            textColor: '#ff6666',
            hoverColor: '#ff0000',
            iconTint: 0xff6666,
            callback: () => scene.scene.start('MainMenu')
        });
        scene.exitButtonContainer = exitButton.container;
        scene.exitButtonText = exitButton.text;
        scene.exitButtonIcon = exitButton.icon;
        scene.exitButtonContainer.setVisible(false);

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
            scene.add.text(centerX, 560, '← → MOVE | SPACE JUMP', { fontSize: '12px', color: '#fff', alpha: 0.4 }).setOrigin(0.5).setScrollFactor(0);
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

    /**
     * Setup EventBus listeners for UI updates
     * This replaces the update() method that was called from the game loop
     */
    setupEventListeners() {
        // Listen to score updates
        const scoreListener = (data) => {
            this.updateScore(data.score);
        };
        EventBus.on(Events.SCORE_UPDATED, scoreListener);
        this.eventListeners.push({ event: Events.SCORE_UPDATED, listener: scoreListener });

        // Listen to height updates
        const heightListener = (data) => {
            this.updateHeight(data.height);
        };
        EventBus.on(Events.HEIGHT_UPDATED, heightListener);
        this.eventListeners.push({ event: Events.HEIGHT_UPDATED, listener: heightListener });

        // Listen to pause/resume events
        const pauseListener = () => {
            this.showPauseMenu();
        };
        EventBus.on(Events.GAME_PAUSED, pauseListener);
        this.eventListeners.push({ event: Events.GAME_PAUSED, listener: pauseListener });

        const resumeListener = () => {
            this.hidePauseMenu();
        };
        EventBus.on(Events.GAME_RESUMED, resumeListener);
        this.eventListeners.push({ event: Events.GAME_RESUMED, listener: resumeListener });

        // Listen to game over
        const gameOverListener = (data) => {
            this.showGameOver(data);
        };
        EventBus.on(Events.GAME_OVER, gameOverListener);
        this.eventListeners.push({ event: Events.GAME_OVER, listener: gameOverListener });
    }

    /**
     * Clean up event listeners when UI is destroyed
     */
    destroy() {
        this.eventListeners.forEach(({ event, listener }) => {
            EventBus.off(event, listener);
        });
        this.eventListeners = [];
    }

    /**
     * Update score display (called via EventBus)
     */
    updateScore(score) {
        const scene = this.scene;
        if (scene.scoreText) {
            scene.scoreText.setText('SCORE: ' + score);
        }
    }

    /**
     * Update height display (called via EventBus)
     */
    updateHeight(height) {
        const scene = this.scene;
        if (scene.heightText) {
            scene.heightText.setText(`HEIGHT: ${height}m`);
        }
    }

    /**
     * Toggle pause menu - now uses GameState instead of directly pausing physics
     * Physics pause/resume is handled by Game.js or GameState
     */
    togglePauseMenu() {
        // Refrescar estado actual
        const currentlyPaused = GameState.isPaused;
        if (currentlyPaused) {
            GameState.resume();     // Emitirá GAME_RESUMED
            this.hidePauseMenu();   // Fallback directo
        } else {
            GameState.pause();      // Emitirá GAME_PAUSED
            this.showPauseMenu();   // Fallback directo
        }
    }

    /**
     * Show pause menu UI (called via EventBus when GAME_PAUSED event is emitted)
     */
    showPauseMenu() {
        const scene = this.scene;

            // Update button icons and text to reflect current registry state
        const soundEnabled = GameState.soundEnabled;
            const soundTextStr = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
            const soundIcon = soundEnabled ? 'volume-up' : 'volume-mute';
            if (scene.soundToggleText) {
                scene.soundToggleText.setText(soundTextStr);
                scene.soundToggleIcon.setFrame(soundIcon);
            }

            const showJoystick = scene.registry.get('showJoystick') !== false;
            const joystickTextStr = showJoystick ? 'JOYSTICK: ON' : 'JOYSTICK: OFF';
            if (scene.joystickToggleText) {
                scene.joystickToggleText.setText(joystickTextStr);
                scene.joystickToggleIcon.setAlpha(showJoystick ? 1 : 0.5);
            }

            scene.pauseMenuBg.setVisible(true);
            scene.pauseMenuTitle.setVisible(true);
            if (scene.versionText) scene.versionText.setVisible(true);
            scene.continueButton.setVisible(true);
            scene.soundToggleContainer.setVisible(true);
            scene.joystickToggleContainer.setVisible(true);
            scene.exitButtonContainer.setVisible(true);
            scene.pauseButton.setFrame('play'); // Play icon
            scene.tweens.pauseAll();
    }

    /**
     * Hide pause menu UI (called via EventBus when GAME_RESUMED event is emitted)
     */
    hidePauseMenu() {
        const scene = this.scene;
            scene.pauseMenuBg.setVisible(false);
            scene.pauseMenuTitle.setVisible(false);
            if (scene.versionText) scene.versionText.setVisible(false);
            scene.continueButton.setVisible(false);
            scene.soundToggleContainer.setVisible(false);
            scene.joystickToggleContainer.setVisible(false);
            scene.exitButtonContainer.setVisible(false);
            scene.pauseButton.setFrame('pause'); // Pause icon
            scene.tweens.resumeAll();
    }

    /**
     * Show game over UI (called via EventBus when GAME_OVER event is emitted)
     */
    showGameOver(data) {
        const scene = this.scene;
        // This will be handled by existing game over logic
        // For now, we keep compatibility with existing code
        if (scene.uiText) {
            scene.uiText.setVisible(true);
            scene.uiText.setText(`GAME OVER\nScore: ${data.score}`);
        }
    }

    trigger67Celebration() {
        const scene = this.scene;
        try {
            // Use a temporary pause flag for this special event
            scene.isPausedEvent = true;
            // Pause physics temporarily (this is a special case, not regular pause)
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

        const blinkInterval = scene.time.addEvent({
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
                    if (name.length > 0) {
                        blinkInterval.remove();
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
                blinkInterval.remove();

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
