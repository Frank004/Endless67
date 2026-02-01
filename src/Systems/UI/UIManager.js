import { ExtraLifeModal } from '../../UI/Modals/ExtraLifeModal.js';
import { HUDManager } from '../../UI/HUD/HUDManager.js';
import { PauseMenu } from '../../UI/Menus/PauseMenu.js';
import { ControlsUI } from '../../UI/Controls/ControlsUI.js';
import { NotificationsUI } from '../../UI/Notifications/NotificationsUI.js';
import { GameOverMenu } from '../../UI/Menus/GameOverMenu.js';
import { MilestoneIndicatorManager } from '../../UI/HUD/MilestoneIndicatorManager.js';
import EventBus, { Events } from '../../Core/EventBus.js';
import ScoreManager from '../Gameplay/ScoreManager.js';
import CurrencyRunService from '../Gameplay/CurrencyRunService.js';

export class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.eventListeners = [];

        // Initialize Sub-Managers
        this.hud = new HUDManager(scene);
        this.pauseMenu = new PauseMenu(scene);
        this.controls = new ControlsUI(scene);
        this.notifications = new NotificationsUI(scene);
        this.gameOverMenu = new GameOverMenu(scene);
        this.milestoneIndicators = new MilestoneIndicatorManager(scene);

        // Initialize Modals
        this.extraLifeModal = new ExtraLifeModal(scene);
    }

    createUI() {
        this.hud.create();
        this.pauseMenu.create();
        this.controls.create();

        // Ensure modal is top-most
        if (this.extraLifeModal) {
            this.extraLifeModal.setDepth(1000);
        }

        // Initialize milestones
        if (this.milestoneIndicators) {
            this.milestoneIndicators.createParticleEmitter();
            this.milestoneIndicators.loadMilestones();
        }
    }

    // --- PROXY METHODS (Delegate to sub-managers) ---

    // HUD Delegates
    updateScore(score) {
        if (this.hud) this.hud.updateScore(score);
    }

    updateHeight(height) {
        if (this.hud) this.hud.updateHeight(height);
    }

    showGameOver(data) {
        // Show HUD text "GAME OVER"
        if (this.hud) this.hud.showGameOver(data);
    }

    hideGameOver() {
        if (this.hud) this.hud.hideUIText();
    }

    // Controls Delegates
    setGameStartUI() {
        if (this.controls) this.controls.setGameStartUI();
        if (this.hud) this.hud.hideUIText();
    }

    showJoystick(x, y, visible) {
        if (this.controls) this.controls.showJoystick(x, y, visible);
    }

    updateJoystickKnob(x, y) {
        if (this.controls) this.controls.updateJoystickKnob(x, y);
    }

    hideJoystick() {
        if (this.controls) this.controls.hideJoystick();
    }

    showJumpFeedback(x, y) {
        if (this.controls) this.controls.showJumpFeedback(x, y);
    }

    // Pause Menu Delegates
    showPauseMenu() {
        if (this.pauseMenu) this.pauseMenu.show();
    }

    hidePauseMenu() {
        if (this.pauseMenu) this.pauseMenu.hide();
    }

    // Milestone Delegates
    updateMilestones(playerY) {
        if (this.milestoneIndicators) this.milestoneIndicators.update(playerY);
    }

    // Notification Delegates
    trigger67Celebration() {
        if (this.notifications) this.notifications.trigger67Celebration();
    }

    // Game Over Menu / High Score Delegates
    showNameInput(scoreManager) {
        if (this.gameOverMenu) this.gameOverMenu.showNameInput(scoreManager);
    }

    showPostGameOptions() {
        if (this.gameOverMenu) this.gameOverMenu.showPostGameOptions();
    }

    // --- MODAL METHODS ---

    showExtraLifeModal(onRevive, onClose) {
        if (this.extraLifeModal) {
            this.extraLifeModal.show(onRevive, onClose);
        }
    }

    hideExtraLifeModal() {
        if (this.extraLifeModal) {
            this.extraLifeModal.setVisible(false);
            if (this.extraLifeModal.cleanupInput) {
                this.extraLifeModal.cleanupInput();
            }
        }
    }

    /**
     * Shows a 3-2-1-GO countdown sequence
     * @param {Function} onComplete Callback when countdown finishes
     */
    showReviveCountdown(onComplete) {
        const scene = this.scene;
        const width = scene.scale.width;
        const height = scene.scale.height;
        const cx = width / 2;
        const cy = height / 2;

        console.log('[UIManager] Starting Revive Countdown 3-2-1...');

        // Create large countdown text
        const countText = scene.add.text(cx, cy, '3', {
            fontSize: '120px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2000)
            .setScale(0);

        // Sequence: 3 -> 2 -> 1 -> GO!
        const sequence = ['3', '2', '1', 'GO!'];
        let currentIndex = 0;

        const playNextNumber = () => {
            if (currentIndex >= sequence.length) {
                // Done
                countText.destroy();
                if (onComplete) onComplete();
                return;
            }

            const text = sequence[currentIndex];
            countText.setText(text);
            countText.setScale(0);
            countText.setAlpha(1);

            // Special color for GO!
            if (text === 'GO!') {
                countText.setColor('#00ff00');
            } else {
                countText.setColor('#ffffff');
            }

            // Punchy animation: Pop in -> Pause -> Pop out
            scene.tweens.add({
                targets: countText,
                scale: 1,
                duration: 200,
                ease: 'Back.out', // Pop effect
                onComplete: () => {
                    // Hold
                    scene.time.delayedCall(500, () => {
                        // Fade out / scale up slightly
                        scene.tweens.add({
                            targets: countText,
                            scale: 1.5,
                            alpha: 0,
                            duration: 200,
                            onComplete: () => {
                                currentIndex++;
                                playNextNumber();
                            }
                        });
                    });
                }
            });
        };

        playNextNumber();
    }

    /**
     * Setup EventBus listeners for UI updates
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
            console.log('[UIManager] Received GAME_PAUSED');
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
            console.log('🎮 [UIManager] Game Over Event Received:', data);

            // Commit coins first
            CurrencyRunService.commitRunCoinsToProfile();

            // Always show "Game Over" HUD text initially
            this.showGameOver(data);

            // Flow Control is now handled by ReviveSystem (listens to GAME_OVER)
            // It will decide whether to offer revive or proceed to post-game.
        };
        EventBus.on(Events.GAME_OVER, gameOverListener);
        this.eventListeners.push({ event: Events.GAME_OVER, listener: gameOverListener });
    }

    proceedToPostGame(data) {
        // Check for High Score
        // Note: GameState emits { score, height }. ScoreManager expects isHighScore(height, coins).
        // Assuming data.score represents coins/points collected.
        const isHigh = ScoreManager.isHighScore(data.height, data.score);
        console.log('🎮 [UIManager] isHighScore result:', isHigh);

        if (isHigh) {
            console.log('✅ [UIManager] High Score detected! Showing Name Input.');
            this.showNameInput(ScoreManager);
        } else {
            console.log('❌ [UIManager] No High Score. Showing Options.');
            this.showPostGameOptions();
        }
    }

    /**
     * Clean up event listeners when UI is destroyed
     */
    destroy() {
        this.eventListeners.forEach(({ event, listener }) => {
            EventBus.off(event, listener);
        });
        this.eventListeners = [];

        // Clean up milestone indicators
        if (this.milestoneIndicators) {
            this.milestoneIndicators.destroy();
        }
    }
}
