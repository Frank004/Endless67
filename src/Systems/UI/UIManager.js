import EventBus, { Events } from '../../Core/EventBus.js';
import GameState from '../../Core/GameState.js';
import ScoreManager from '../Gameplay/ScoreManager.js';
import CurrencyRunService from '../Gameplay/CurrencyRunService.js';
import { HUDManager } from '../../UI/HUD/HUDManager.js';
import { PauseMenu } from '../../UI/Menus/PauseMenu.js';
import { ControlsUI } from '../../UI/Controls/ControlsUI.js';
import { NotificationsUI } from '../../UI/Notifications/NotificationsUI.js';
import { GameOverMenu } from '../../UI/Menus/GameOverMenu.js';
import { MilestoneIndicatorManager } from '../../UI/HUD/MilestoneIndicatorManager.js';

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
    }

    createUI() {
        this.hud.create();
        this.pauseMenu.create();
        this.controls.create();

        // Initialize milestones
        if (this.milestoneIndicators) {
            this.milestoneIndicators.createParticleEmitter();
            this.milestoneIndicators.loadMilestones();
        }
    }

    setGameStartUI() {
        this.hud.hideUIText();
        this.controls.setGameStartUI();
    }

    // Proxy methods for HUD
    updateScore(score) {
        this.hud.updateScore(score);
    }

    updateHeight(height) {
        this.hud.updateHeight(height);
    }

    // Proxy methods for Pause Menu
    togglePauseMenu() {
        this.pauseMenu.toggle();
    }

    showPauseMenu() {
        this.pauseMenu.show();
    }

    hidePauseMenu() {
        this.pauseMenu.hide();
    }

    // Proxy methods for Controls
    showJoystick(x, y, visible) {
        this.controls.showJoystick(x, y, visible);
    }

    updateJoystickKnob(x, y) {
        this.controls.updateJoystickKnob(x, y);
    }

    hideJoystick() {
        this.controls.hideJoystick();
    }

    showJumpFeedback(x, y) {
        this.controls.showJumpFeedback(x, y);
    }

    // Proxy methods for Notifications
    trigger67Celebration() {
        this.notifications.trigger67Celebration();
    }

    // Proxy methods for Game Over
    showGameOver(data) {
        this.hud.showGameOver(data);
    }

    showNameInput(scoreManager) {
        this.gameOverMenu.showNameInput(scoreManager);
    }

    showPostGameOptions() {
        this.gameOverMenu.showPostGameOptions();
    }

    // Proxy methods for Milestone Indicators
    updateMilestones(playerHeight) {
        this.milestoneIndicators.update(playerHeight);
    }

    refreshMilestones() {
        this.milestoneIndicators.refresh();
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
            console.log('🎮 [UIManager] Checking high score with height:', data.height, 'score:', data.score);
            CurrencyRunService.commitRunCoinsToProfile();
            this.showGameOver(data);

            // Delay before showing UI to allow game over animation to play
            this.scene.time.delayedCall(1000, () => {
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
            });
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

        // Clean up milestone indicators
        if (this.milestoneIndicators) {
            this.milestoneIndicators.destroy();
        }
    }
}
