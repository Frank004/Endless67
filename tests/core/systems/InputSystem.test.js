import { InputSystem } from '../../../src/core/systems/InputSystem.js';
import EventBus, { Events } from '../../../src/core/EventBus.js';

describe('InputSystem', () => {
    let scene;
    let inputManager; // Variable name kept for minimal diff, or rename it? Let's keep it.
    let mockPad;

    beforeEach(() => {
        scene = new PhaserMock.Scene('TestScene');
        // Mock specific input properties
        scene.input.keyboard.createCursorKeys.mockReturnValue({
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false },
            down: { isDown: false },
            space: { isDown: false }
        });
        scene.input.keyboard.addKey = jest.fn().mockImplementation((key) => {
            return { isDown: false, on: jest.fn() };
        });
        scene.input.keyboard.addKey.mockClear(); // Reset calls

        // We need specific references for the test to toggle them
        const shiftMock = { isDown: false };
        const escMock = { isDown: false };
        const spaceMock = { isDown: false };
        const enterMock = { isDown: false };

        // Override for specific tests if needed, or better, make addKey return a map?
        // Let's refine the mock to return stable objects we can control.
        scene.shiftKey = { isDown: false };
        scene.escKey = { isDown: false };
        scene.spaceKey = { isDown: false };
        scene.enterKey = { isDown: false };
        scene.input.keyboard.addKey.mockImplementation((k) => {
            if (k === 32) return scene.spaceKey; // Space
            if (k === 13) return scene.enterKey; // Enter
            if (k === 27) return scene.escKey; // Esc
            if (k === 16) return scene.shiftKey; // Shift
            return { isDown: false };
        });

        // Mock Gamepad
        mockPad = {
            id: 'Xbox Controller',
            connected: true,
            buttons: [], // generic buttons array
            getAxisValue: jest.fn().mockReturnValue(0),
            up: false,
            down: false,
            left: false,
            right: false,
            A: false,
            B: false,
            X: false,
            Y: false
        };
        // Populate buttons for index access (e.g. pad.buttons[9])
        for (let i = 0; i < 20; i++) mockPad.buttons[i] = { pressed: false, value: 0 };

        // Enhance existing mock instead of overwriting entirely
        Object.assign(scene.input.gamepad, {
            on: jest.fn(),
            getPad: jest.fn().mockReturnValue(mockPad),
            enabled: true,
            start: jest.fn()
        });

        // Mock Player
        scene.player = {
            jump: jest.fn(),
            move: jest.fn(),
            stop: jest.fn()
        };

        // Mock Registry
        scene.registry.get.mockReturnValue(true); // showJoystick = true
        scene.registry.set = jest.fn();

        inputManager = new InputSystem(scene);
        jest.spyOn(EventBus, 'emit');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should initialize with default settings', () => {
        expect(inputManager.joystickVisible).toBe(true);
        expect(inputManager.SPLIT_X).toBe(280);
    });

    test('setupInputs should configure inputs and gamepad listeners', () => {
        inputManager.setupInputs();
        expect(scene.input.keyboard.createCursorKeys).toHaveBeenCalled();
        expect(scene.input.keyboard.addKey).toHaveBeenCalled();
        expect(scene.input.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));

        // Gamepad listeners
        expect(scene.input.gamepad.on).toHaveBeenCalledWith('connected', expect.any(Function));
        expect(scene.input.gamepad.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    });

    test('should NOT crash if scene.startGame is missing on pointerdown', () => {
        inputManager.setupInputs();

        // Simulate pointerdown
        const pointerDownCallback = scene.input.on.mock.calls.find(call => call[0] === 'pointerdown')[1];

        // Scene without startGame
        scene.gameStarted = false;
        scene.isPaused = false;
        scene.startGame = undefined; // Explicitly ensure it's missing

        // Should not throw
        expect(() => {
            pointerDownCallback({ x: 100, y: 100 });
        }).not.toThrow();
    });

    test('handleJump should emit PLAYER_JUMP_REQUESTED', () => {
        inputManager.handleJump();
        expect(EventBus.emit).toHaveBeenCalledWith(Events.PLAYER_JUMP_REQUESTED, expect.any(Object));
    });

    // --- GAMEPLAY INPUTS ---

    test('processGameInputs should handle keyboard movement', () => {
        inputManager.setupInputs();
        scene.gameStarted = true;
        scene.cursors.left.isDown = true;
        inputManager.update();
        expect(EventBus.emit).toHaveBeenCalledWith(Events.PLAYER_MOVE, { direction: -1 });
    });

    test('processGameInputs should handle gamepad axis movement', () => {
        inputManager.setupInputs();
        scene.gameStarted = true;

        // Simulate Stick Left
        mockPad.getAxisValue.mockReturnValue(-0.8);

        inputManager.update();
        expect(EventBus.emit).toHaveBeenCalledWith(Events.PLAYER_MOVE, { direction: -1 });
    });

    test('processGameInputs should handle gamepad d-pad movement', () => {
        inputManager.setupInputs();
        scene.gameStarted = true;

        mockPad.right = true;

        inputManager.update();
        expect(EventBus.emit).toHaveBeenCalledWith(Events.PLAYER_MOVE, { direction: 1 });
    });

    test('processGameInputs should handle gamepad jump (Button A)', () => {
        inputManager.setupInputs();
        scene.gameStarted = true;

        mockPad.A = true;

        inputManager.update();
        expect(EventBus.emit).toHaveBeenCalledWith(Events.PLAYER_JUMP_REQUESTED, expect.any(Object));
    });

    test('processGameInputs should emit PAUSE_TOGGLE on Gamepad Start button', () => {
        inputManager.setupInputs();
        scene.gameStarted = true;

        // Start Button (index 9)
        mockPad.buttons[9].pressed = true;

        inputManager.update();
        expect(EventBus.emit).toHaveBeenCalledWith(Events.PAUSE_TOGGLE);

        // Verify debouncing (should not emit again if still held)
        EventBus.emit.mockClear();
        inputManager.update();
        expect(EventBus.emit).not.toHaveBeenCalledWith(Events.PAUSE_TOGGLE);
    });

    test('processGameInputs should emit PAUSE_TOGGLE on ESC key', () => {
        inputManager.setupInputs();
        scene.gameStarted = true;

        scene.escKey.isDown = true;

        inputManager.update();
        expect(EventBus.emit).toHaveBeenCalledWith(Events.PAUSE_TOGGLE);

        // Verify debouncing
        EventBus.emit.mockClear();
        inputManager.update();
        expect(EventBus.emit).not.toHaveBeenCalledWith(Events.PAUSE_TOGGLE);
    });

    test('processGameInputs should emit PAUSE_TOGGLE on SHIFT key', () => {
        inputManager.setupInputs();
        scene.gameStarted = true;

        scene.shiftKey.isDown = true;

        inputManager.update();
        expect(EventBus.emit).toHaveBeenCalledWith(Events.PAUSE_TOGGLE);

        // Verify debouncing
        EventBus.emit.mockClear();
        inputManager.update();
        expect(EventBus.emit).not.toHaveBeenCalledWith(Events.PAUSE_TOGGLE);
    });

    // --- MENU INPUTS ---

    test('processMenuInputs should handle gamepad navigation (UI_NAV_DOWN)', () => {
        inputManager.setupInputs();
        // Set state to paused to trigger menu inputs
        scene.isPaused = true;

        // Mock Stick Down
        mockPad.getAxisValue.mockImplementation((axis) => axis === 1 ? 0.8 : 0);

        inputManager.update(1000, 16); // Time enough to pass threshold

        expect(EventBus.emit).toHaveBeenCalledWith(Events.UI_NAV_DOWN);
    });

    test('processMenuInputs should handle gamepad selection (Button A)', () => {
        inputManager.setupInputs();
        scene.isPaused = true;

        mockPad.A = true;

        inputManager.update(1000, 16);
        expect(EventBus.emit).toHaveBeenCalledWith(Events.UI_SELECT);
    });

    test('processMenuInputs should handle gamepad back (Button B)', () => {
        inputManager.setupInputs();
        scene.isPaused = true;

        mockPad.B = true;

        inputManager.update(1000, 16);
        expect(EventBus.emit).toHaveBeenCalledWith(Events.UI_BACK);
    });

    test('processMenuInputs should respect debounce threshold', () => {
        inputManager.setupInputs();
        scene.isPaused = true;
        mockPad.A = true;

        // First press
        inputManager.update(1000, 16);
        expect(EventBus.emit).toHaveBeenCalledWith(Events.UI_SELECT);
        EventBus.emit.mockClear();

        // Second press immediately (should be ignored)
        inputManager.update(1050, 16); // +50ms < 200ms threshold
        expect(EventBus.emit).not.toHaveBeenCalled();

        // Third press after threshold
        inputManager.update(1250, 16); // +250ms > 200ms threshold
        expect(EventBus.emit).toHaveBeenCalledWith(Events.UI_SELECT);
    });

    test('processMenuInputs should be called in MainMenu state (game not started, not paused)', () => {
        inputManager.setupInputs();
        scene.gameStarted = false;
        scene.isPaused = false;
        scene.isGameOver = false;

        // Spy on processMenuInputs
        const spy = jest.spyOn(inputManager, 'processMenuInputs');

        // Mock Stick Down to force an emission
        mockPad.getAxisValue.mockImplementation((axis) => axis === 1 ? 0.8 : 0);

        inputManager.update(1000, 16);

        expect(spy).toHaveBeenCalled();
        expect(EventBus.emit).toHaveBeenCalledWith(Events.UI_NAV_DOWN);
    });
});
