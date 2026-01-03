import EventBus, { Events } from '../../core/EventBus.js';
import GameState from '../../core/GameState.js';
import { HUDManager } from './hud/HUDManager.js';
import { PauseMenu } from './menus/PauseMenu.js';
import { ControlsUI } from './controls/ControlsUI.js';
import { NotificationsUI } from './notifications/NotificationsUI.js';
import { GameOverMenu } from './menus/GameOverMenu.js';

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
    }

    createUI() {
        this.hud.create();
        this.pauseMenu.create();
        this.controls.create();
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
}
