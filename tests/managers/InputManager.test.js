import { InputManager } from '../../src/managers/input/InputManager.js';
import EventBus, { Events } from '../../src/core/EventBus.js';

describe('InputManager', () => {
    let scene;
    let inputManager;

    beforeEach(() => {
        scene = new PhaserMock.Scene('TestScene');
        // Mock specific input properties
        scene.input.keyboard.createCursorKeys.mockReturnValue({
            left: { isDown: false },
            right: { isDown: false }
        });
        scene.input.keyboard.addKey.mockReturnValue({ on: jest.fn() });
        scene.input.manager = { pointers: [] };

        // Mock Player
        scene.player = {
            jump: jest.fn(),
            move: jest.fn(),
            stop: jest.fn()
        };

        // Mock Registry
        scene.registry.get.mockReturnValue(true); // showJoystick = true
        scene.registry.set = jest.fn();

        inputManager = new InputManager(scene);
        jest.spyOn(EventBus, 'emit');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should initialize with default settings', () => {
        expect(inputManager.joystickVisible).toBe(true);
        expect(inputManager.SPLIT_X).toBe(280);
    });

    test('setupInputs should configure inputs', () => {
        inputManager.setupInputs();
        expect(scene.input.keyboard.createCursorKeys).toHaveBeenCalled();
        expect(scene.input.keyboard.addKey).toHaveBeenCalled();
        expect(scene.input.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    test('handleJump should emit PLAYER_JUMP_REQUESTED', () => {
        inputManager.handleJump();
        expect(EventBus.emit).toHaveBeenCalledWith(Events.PLAYER_JUMP_REQUESTED, expect.any(Object));
    });

    test('update should handle keyboard movement', () => {
        inputManager.setupInputs();

        // Set required game state
        scene.gameStarted = true;
        scene.isGameOver = false;
        scene.isPaused = false;
        scene.isPausedEvent = false;
        scene.isDevMenuOpen = false;

        // Simulate Left Key Down
        scene.cursors.left.isDown = true;

        inputManager.update();

        inputManager.update();

        expect(EventBus.emit).toHaveBeenCalledWith(Events.PLAYER_MOVE, { direction: -1 });
    });

    test('update should handle touch movement (mobile)', () => {
        inputManager.setupInputs();
        scene.isMobile = true;
        scene.gameStarted = true;
        scene.isGameOver = false;
        scene.isPaused = false;
        scene.isPausedEvent = false;
        scene.isDevMenuOpen = false;

        // Simulate Pointer Down
        const pointer = { isDown: true, x: 100, y: 100 };
        scene.input.manager.pointers = [pointer];

        inputManager.update();

        // First update sets anchor
        expect(inputManager.moveAnchorX).toBe(100);

        // Move pointer
        pointer.x = 150; // +50 delta
        inputManager.update();

        expect(EventBus.emit).toHaveBeenCalledWith(Events.PLAYER_MOVE, { direction: 1 });
    });

    test('toggleJoystickVisual should toggle registry and property', () => {
        inputManager.toggleJoystickVisual();
        expect(inputManager.joystickVisible).toBe(false);
        expect(scene.registry.set).toHaveBeenCalledWith('showJoystick', false);
    });
});
