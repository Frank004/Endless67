
import { UIManager } from '../../../src/managers/ui/UIManager.js';
import EventBus, { Events } from '../../../src/core/EventBus.js';

// Mock dependencies
jest.mock('../../../src/managers/ui/hud/HUDManager.js');
jest.mock('../../../src/managers/ui/menus/PauseMenu.js');
jest.mock('../../../src/managers/ui/controls/ControlsUI.js');
jest.mock('../../../src/managers/ui/notifications/NotificationsUI.js');
jest.mock('../../../src/managers/ui/menus/GameOverMenu.js');
jest.mock('../../../src/core/EventBus.js');

describe('UIManager', () => {
    let uiManager;
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                text: jest.fn(),
                image: jest.fn()
            }
        };

        // Reset mocks
        jest.clearAllMocks();

        uiManager = new UIManager(mockScene);
    });

    test('should initialize all sub-managers', () => {
        expect(uiManager.hud).toBeDefined();
        expect(uiManager.pauseMenu).toBeDefined();
        expect(uiManager.controls).toBeDefined();
        expect(uiManager.notifications).toBeDefined();
        expect(uiManager.gameOverMenu).toBeDefined();
    });

    test('createUI should call create on sub-managers', () => {
        uiManager.createUI();
        expect(uiManager.hud.create).toHaveBeenCalled();
        expect(uiManager.pauseMenu.create).toHaveBeenCalled();
        expect(uiManager.controls.create).toHaveBeenCalled();
    });

    test('setGameStartUI should configure UI for game start', () => {
        uiManager.setGameStartUI();
        expect(uiManager.hud.hideUIText).toHaveBeenCalled();
        expect(uiManager.controls.setGameStartUI).toHaveBeenCalled();
    });

    test('should delegate updateScore to HUDManager', () => {
        uiManager.updateScore(100);
        expect(uiManager.hud.updateScore).toHaveBeenCalledWith(100);
    });

    test('should delegate updateHeight to HUDManager', () => {
        uiManager.updateHeight(50);
        expect(uiManager.hud.updateHeight).toHaveBeenCalledWith(50);
    });

    test('should delegate togglePauseMenu to PauseMenu', () => {
        uiManager.togglePauseMenu();
        expect(uiManager.pauseMenu.toggle).toHaveBeenCalled();
    });

    test('should delegate showJoystick to ControlsUI', () => {
        uiManager.showJoystick(10, 20, true);
        expect(uiManager.controls.showJoystick).toHaveBeenCalledWith(10, 20, true);
    });

    test('should delegate trigger67Celebration to NotificationsUI', () => {
        uiManager.trigger67Celebration();
        expect(uiManager.notifications.trigger67Celebration).toHaveBeenCalled();
    });

    test('should delegate showGameOver to HUDManager', () => {
        const data = { score: 100 };
        uiManager.showGameOver(data);
        expect(uiManager.hud.showGameOver).toHaveBeenCalledWith(data);
    });

    test('should delegate showNameInput to GameOverMenu', () => {
        const scoreManager = {};
        uiManager.showNameInput(scoreManager);
        expect(uiManager.gameOverMenu.showNameInput).toHaveBeenCalledWith(scoreManager);
    });

    test('setupEventListeners should register EventBus listeners', () => {
        uiManager.setupEventListeners();

        expect(EventBus.on).toHaveBeenCalledWith(Events.SCORE_UPDATED, expect.any(Function));
        expect(EventBus.on).toHaveBeenCalledWith(Events.HEIGHT_UPDATED, expect.any(Function));
        expect(EventBus.on).toHaveBeenCalledWith(Events.GAME_PAUSED, expect.any(Function));
        expect(EventBus.on).toHaveBeenCalledWith(Events.GAME_RESUMED, expect.any(Function));
        expect(EventBus.on).toHaveBeenCalledWith(Events.GAME_OVER, expect.any(Function));
    });

    test('destroy should remove event listeners', () => {
        uiManager.setupEventListeners();
        uiManager.destroy();

        expect(EventBus.off).toHaveBeenCalledTimes(5); // Score, Height, Pause, Resume, GameOver
    });
});
