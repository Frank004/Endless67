
import { Settings } from '../../src/scenes/Settings.js';
import { MainMenu } from '../../src/scenes/MainMenu.js';
import { Leaderboard } from '../../src/scenes/Leaderboard.js';
import { PauseMenu } from '../../src/managers/ui/menus/PauseMenu.js';
import { GameOverMenu } from '../../src/managers/ui/menus/GameOverMenu.js';
import EventBus, { Events } from '../../src/core/EventBus.js';
import GameState from '../../src/core/GameState.js';
import { UIHelpers } from '../../src/utils/UIHelpers.js';
import { InputManager } from '../../src/managers/input/InputManager.js';

// Mock ScoreManager
jest.mock('../../src/managers/gameplay/ScoreManager.js', () => ({
    getTopScores: jest.fn().mockReturnValue([])
}));

// Mock UIHelpers
jest.mock('../../src/utils/UIHelpers.js', () => ({
    UIHelpers: {
        createTextButton: jest.fn(),
        createIconButton: jest.fn()
    }
}));

// Mock InputManager
jest.mock('../../src/managers/input/InputManager.js', () => ({
    InputManager: jest.fn().mockImplementation(() => ({
        setupInputs: jest.fn(),
        update: jest.fn(),
        toggleJoystickVisual: jest.fn(),
        createMobileTextInput: jest.fn(),
        createTextInputListener: jest.fn(),
        removeTextInputListener: jest.fn(),
        removeMobileTextInput: jest.fn()
    }))
}));

describe('Menu Navigation Integration', () => {
    let mockScene;
    let mockContainer;
    let mockText;
    let mockIcon;

    // Helper to create a mock button object consistent with UIHelpers refactor
    const createMockButtonObj = (container, text, icon = null, callback = null) => {
        return {
            container,
            text,
            icon,
            callback,
            select: jest.fn().mockImplementation(function () {
                this.container.setScale(1.1);
                if (this.text) this.text.setColor('#ffff00');
                if (this.icon) this.icon.setTint(0xffff00);
            }),
            deselect: jest.fn().mockImplementation(function () {
                this.container.setScale(1.0);
                if (this.text) this.text.setColor('#ffffff');
                if (this.icon) this.icon.clearTint();
            }),
            trigger: jest.fn().mockImplementation(function () {
                if (this.callback) this.callback();
            })
        };
    };

    beforeEach(() => {
        // Setup common Phaser Scene mocks
        mockContainer = {
            active: true,
            scene: {},
            setData: jest.fn(),
            getData: jest.fn(),
            on: jest.fn().mockReturnThis(),
            off: jest.fn().mockReturnThis(),
            setAlpha: jest.fn(),
            setScale: jest.fn(),
            setVisible: jest.fn(),
            destroy: jest.fn(),
            emit: jest.fn()
        };
        mockText = {
            active: true,
            scene: {},
            setText: jest.fn().mockReturnThis(),
            setColor: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setOrigin: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setScrollFactor: jest.fn().mockReturnThis(),
            setInteractive: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            on: jest.fn().mockReturnThis(),
            destroy: jest.fn()
        };
        mockIcon = {
            active: true,
            scene: {},
            setFrame: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setTint: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setScrollFactor: jest.fn().mockReturnThis(),
            setInteractive: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            clearTint: jest.fn()
        };

        mockScene = new PhaserMock.Scene('MockScene');
        mockScene.add = {
            rectangle: jest.fn().mockReturnValue({
                setOrigin: jest.fn().mockReturnThis(),
                setScrollFactor: jest.fn().mockReturnThis(),
                setDepth: jest.fn().mockReturnThis(),
                setVisible: jest.fn().mockReturnThis(),
                setInteractive: jest.fn().mockReturnThis(),
                setStrokeStyle: jest.fn(),
                on: jest.fn(),
                destroy: jest.fn()
            }),
            text: jest.fn().mockReturnValue(mockText),
            image: jest.fn().mockReturnValue(mockIcon),
            circle: jest.fn().mockReturnValue({
                setScrollFactor: jest.fn().mockReturnThis(),
                setDepth: jest.fn().mockReturnThis(),
                setFillStyle: jest.fn()
            })
        };
        mockScene.toggleSound = jest.fn();

        // Mock InputManager instance for the scene
        mockScene.inputManager = {
            setupInputs: jest.fn(),
            update: jest.fn(),
            toggleJoystickVisual: jest.fn(),
            createMobileTextInput: jest.fn(),
            createTextInputListener: jest.fn(),
            removeTextInputListener: jest.fn(),
            removeMobileTextInput: jest.fn()
        };

        // Spy on EventBus
        jest.spyOn(EventBus, 'on');
        jest.spyOn(EventBus, 'off');
        jest.spyOn(EventBus, 'emit');
    });

    afterEach(() => {
        jest.clearAllMocks();
        try { EventBus.removeAllListeners(); } catch (e) { }
    });

    describe('MainMenu', () => {
        let mainMenu;
        let startBtnContainer, leaderboardBtnContainer, settingsBtnContainer;

        beforeEach(() => {
            mainMenu = new MainMenu();
            mainMenu.cameras = mockScene.cameras;
            mainMenu.add = mockScene.add;
            mainMenu.scene = mockScene.scene;
            mainMenu.registry = mockScene.registry;
            mainMenu.events = mockScene.events;
            mainMenu.input = mockScene.input;
            mainMenu.time = mockScene.time;
            mainMenu.tweens = mockScene.tweens;

            // Specific mocks for buttons
            startBtnContainer = { ...mockContainer };
            leaderboardBtnContainer = { ...mockContainer };
            settingsBtnContainer = { ...mockContainer };

            UIHelpers.createTextButton
                .mockImplementationOnce((s, x, y, t, o) => createMockButtonObj(startBtnContainer, mockText, null, o?.callback))
                .mockImplementationOnce((s, x, y, t, o) => createMockButtonObj(leaderboardBtnContainer, mockText, null, o?.callback))
                .mockImplementationOnce((s, x, y, t, o) => createMockButtonObj(settingsBtnContainer, mockText, null, o?.callback));

            // For Dev Mode button if needed later
            // UIHelpers.createTextButton.mockImplementation((s, x, y, t, o) => createMockButtonObj(mockContainer, mockText, null, o?.callback));
        });

        test('should navigate up/down and select Start Game', () => {
            mainMenu.create();
            // Initial selection: Index 0 (Start)
            expect(startBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            EventBus.emit(Events.UI_NAV_DOWN);
            expect(leaderboardBtnContainer.setScale).toHaveBeenCalledWith(1.1);
            expect(startBtnContainer.setScale).toHaveBeenCalledWith(1.0); // Deselected

            EventBus.emit(Events.UI_NAV_DOWN);
            expect(settingsBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            EventBus.emit(Events.UI_NAV_DOWN);
            expect(startBtnContainer.setScale).toHaveBeenCalledWith(1.1); // Loop back to start

            EventBus.emit(Events.UI_NAV_UP);
            expect(settingsBtnContainer.setScale).toHaveBeenCalledWith(1.1); // Loop back to end

            // Select Settings (current)
            EventBus.emit(Events.UI_SELECT);
            expect(mainMenu.scene.start).toHaveBeenCalledWith('Settings');
        });
    });

    describe('Leaderboard Scene', () => {
        let leaderboardScene;
        let backBtnContainer;

        beforeEach(() => {
            leaderboardScene = new Leaderboard();
            leaderboardScene.cameras = mockScene.cameras;
            leaderboardScene.add = mockScene.add;
            leaderboardScene.scene = mockScene.scene;
            leaderboardScene.events = mockScene.events;
            leaderboardScene.input = mockScene.input;

            backBtnContainer = { ...mockContainer };
            UIHelpers.createTextButton.mockImplementation((s, x, y, t, o) =>
                createMockButtonObj(backBtnContainer, mockText, null, o?.callback));
        });

        test('should select Back button by default and go back on UI_BACK or interaction', () => {
            leaderboardScene.create();

            // Should be selected by default (highlighted)
            expect(backBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            // Trigger Back via EventBus (Simulate Escape or Back Button)
            EventBus.emit(Events.UI_BACK);
            expect(leaderboardScene.scene.start).toHaveBeenCalledWith('MainMenu');

            // Reset mock
            leaderboardScene.scene.start.mockClear();

            // Trigger Back via Select (Simulate Enter/Space on the only button)
            EventBus.emit(Events.UI_SELECT);
            expect(leaderboardScene.scene.start).toHaveBeenCalledWith('MainMenu');
        });
    });

    describe('Settings Menu', () => {
        let settingsScene;
        let soundBtnContainer, joystickBtnContainer, backBtnContainer;

        beforeEach(() => {
            settingsScene = new Settings();
            settingsScene.cameras = mockScene.cameras;
            settingsScene.add = mockScene.add;
            settingsScene.scene = mockScene.scene;
            settingsScene.registry = mockScene.registry;
            settingsScene.events = mockScene.events;
            settingsScene.input = mockScene.input;
            settingsScene.sound = { mute: false };

            soundBtnContainer = { ...mockContainer };
            joystickBtnContainer = { ...mockContainer };
            backBtnContainer = { ...mockContainer };

            UIHelpers.createIconButton
                .mockImplementationOnce((s, x, y, f, t, o) => createMockButtonObj(soundBtnContainer, mockText, mockIcon, o?.callback))
                .mockImplementationOnce((s, x, y, f, t, o) => createMockButtonObj(joystickBtnContainer, mockText, mockIcon, o?.callback));

            // Back button
            UIHelpers.createTextButton.mockImplementation((s, x, y, t, o) => createMockButtonObj(backBtnContainer, mockText, null, o?.callback));
        });

        test('should navigate and toggle settings', () => {
            settingsScene.create();

            // Default selected: Sound (first item)
            // Trigger Select -> Toggle Sound
            EventBus.emit(Events.UI_SELECT);
            expect(settingsScene.registry.set).toHaveBeenCalledWith('soundEnabled', expect.any(Boolean));

            EventBus.emit(Events.UI_NAV_DOWN);
            // Selected Joystick
            expect(joystickBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            EventBus.emit(Events.UI_SELECT);
            expect(settingsScene.registry.set).toHaveBeenCalledWith('showJoystick', expect.any(Boolean));

            EventBus.emit(Events.UI_BACK);
            expect(settingsScene.scene.start).toHaveBeenCalledWith('MainMenu');
        });
    });

    describe('Pause Menu', () => {
        let pauseMenu;
        let continueBtnContainer, soundBtnContainer, joystickBtnContainer, exitBtnContainer;

        beforeEach(() => {
            pauseMenu = new PauseMenu(mockScene);
            continueBtnContainer = { ...mockContainer };
            soundBtnContainer = { ...mockContainer };
            joystickBtnContainer = { ...mockContainer };
            exitBtnContainer = { ...mockContainer };

            UIHelpers.createTextButton
                .mockImplementationOnce((s, x, y, t, o) => createMockButtonObj(continueBtnContainer, mockText, null, o?.callback));

            UIHelpers.createIconButton
                .mockImplementationOnce((s, x, y, f, t, o) => createMockButtonObj(soundBtnContainer, mockText, mockIcon, o?.callback))
                .mockImplementationOnce((s, x, y, f, t, o) => createMockButtonObj(joystickBtnContainer, mockText, mockIcon, o?.callback))
                .mockImplementationOnce((s, x, y, f, t, o) => createMockButtonObj(exitBtnContainer, mockText, null, o?.callback));
        });

        test('should navigate Pause Menu options', () => {
            pauseMenu.create();
            pauseMenu.show();
            // 0: Continue, 1: Sound, 2: Joystick, 3: Exit

            // Initial: Continue selected
            expect(continueBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            EventBus.emit(Events.UI_NAV_DOWN); // 1: Sound
            expect(soundBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            EventBus.emit(Events.UI_NAV_DOWN); // 2: Joystick
            expect(joystickBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            EventBus.emit(Events.UI_NAV_DOWN); // 3: Exit
            expect(exitBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            // Navigate back to Continue
            EventBus.emit(Events.UI_NAV_DOWN);
            expect(continueBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            const toggleSpy = jest.spyOn(pauseMenu, 'toggle');
            EventBus.emit(Events.UI_SELECT); // Select Continue
            expect(toggleSpy).toHaveBeenCalled();
        });
    });

    describe('GameOverMenu', () => {
        let gameOverMenu;
        let restartBtnContainer, leaderboardBtnContainer, menuBtnContainer;

        beforeEach(() => {
            gameOverMenu = new GameOverMenu(mockScene);

            restartBtnContainer = { ...mockContainer };
            leaderboardBtnContainer = { ...mockContainer };
            menuBtnContainer = { ...mockContainer };

            // Mock UIHelpers for GameOverMenu
            // NOTE: showPostGameOptions calls UIHelpers.createTextButton 3 times.
            UIHelpers.createTextButton
                .mockImplementationOnce((s, x, y, t, o) => createMockButtonObj(restartBtnContainer, mockText, null, o?.callback))
                .mockImplementationOnce((s, x, y, t, o) => createMockButtonObj(leaderboardBtnContainer, mockText, null, o?.callback))
                .mockImplementationOnce((s, x, y, t, o) => createMockButtonObj(menuBtnContainer, mockText, null, o?.callback));
        });

        test('should navigate Game Over options', () => {
            // Setup scene text mock for showNameInput usage (optional if we only test options)
            mockScene.add.text.mockReturnValue(mockText);

            // Directly call options for testing navigation
            gameOverMenu.showPostGameOptions();

            // 1. Initial State: Restart Button (Index 0) should be highlighted
            expect(restartBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            // 2. Navigate Down -> Leaderboard (Index 1)
            EventBus.emit(Events.UI_NAV_DOWN);
            expect(restartBtnContainer.setScale).toHaveBeenCalledWith(1.0); // Deselect
            expect(leaderboardBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            // 3. Navigate Down -> Main Menu (Index 2)
            EventBus.emit(Events.UI_NAV_DOWN);
            expect(menuBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            // 4. Navigate Up -> Leaderboard (Index 1)
            EventBus.emit(Events.UI_NAV_UP);
            expect(leaderboardBtnContainer.setScale).toHaveBeenCalledWith(1.1);

            // 5. Input Press -> Trigger Action
            // Leaderboard callback
            EventBus.emit(Events.UI_SELECT);
            expect(mockScene.scene.start).toHaveBeenCalledWith('Leaderboard');
        });
    });
});
