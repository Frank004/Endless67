
import { PlayerStateMachine } from '../../../src/Entities/Player/PlayerStateMachine.js';

describe('PlayerStateMachine', () => {
    let fsm;
    let mockContext;
    let mockAnim;

    beforeEach(() => {
        // Mock Context
        mockContext = {
            sensors: {
                onFloor: true,
                vx: 0,
                vy: 0,
                touchWall: false
            },
            flags: {
                dead: false,
                hit: false,
                inputLocked: false,
                canDoubleJump: true,
                airStyle: 'UP'
            },
            intent: {
                moveX: 0,
                jumpJustPressed: false
            },
            hasJumpBuffered: jest.fn(() => false),
            canAcceptJump: jest.fn(() => true),
            consumeJumpBuffer: jest.fn(),
            setAirStyleFromInput: jest.fn(),
            doJump: jest.fn(() => ({ type: 'jump' })),
            doDoubleJump: jest.fn(() => ({ type: 'double_jump' })),
            doWallJump: jest.fn(() => ({ type: 'wall_jump' })),
            hasCoyote: jest.fn(() => false),
            emitJumpEvent: jest.fn(),
            hitTimer: 0
        };

        // Mock Animation Controller
        mockAnim = {
            resolve: jest.fn((state, sub) => `${state}_${sub || 'base'}`),
            play: jest.fn(),
            playOnceHoldLast: jest.fn(),
            playOnceThen: jest.fn(),
            setFacing: jest.fn(),
            currentKey: ''
        };

        fsm = new PlayerStateMachine(mockContext, mockAnim);
    });

    test('should initialize in GROUND state', () => {
        expect(fsm.state).toBe('GROUND');
    });

    test('should transition to DEAD state if dead flag is set', () => {
        mockContext.flags.dead = true;
        fsm.update();
        expect(fsm.state).toBe('DEAD');
        expect(mockAnim.play).toHaveBeenCalledWith('DEAD_base');
    });

    test('should transition to HIT state if hit flag is set', () => {
        mockContext.flags.hit = true;
        mockContext.hitTimer = 100;
        fsm.update();
        expect(fsm.state).toBe('HIT');
        expect(mockAnim.playOnceHoldLast).toHaveBeenCalled();
    });

    test('should handle running on GROUND', () => {
        mockContext.sensors.onFloor = true;
        mockContext.intent.moveX = 1; // Moving right

        fsm.update();

        expect(fsm.state).toBe('GROUND');
        expect(mockAnim.play).toHaveBeenCalledWith('GROUND_run');
        expect(mockAnim.setFacing).toHaveBeenCalledWith(1);
    });

    test('should transition to AIR_RISE on jump', () => {
        mockContext.sensors.onFloor = true;
        mockContext.intent.jumpJustPressed = true;

        fsm.update();

        expect(fsm.state).toBe('AIR_RISE');
        expect(mockContext.consumeJumpBuffer).toHaveBeenCalled();
        expect(mockContext.doJump).toHaveBeenCalled();
    });

    test('should look for falling state if in air and vy > 0', () => {
        mockContext.sensors.onFloor = false;
        mockContext.sensors.vy = 100;

        fsm.update();

        expect(fsm.state).toBe('AIR_FALL');
        expect(fsm.state).toBe('AIR_FALL');
        expect(mockAnim.playOnceThen).toHaveBeenCalled();
    });

    test('should transition to WALL_SLIDE if touching wall in air', () => {
        mockContext.sensors.onFloor = false;
        mockContext.sensors.touchWall = true;

        fsm.update();

        expect(fsm.state).toBe('WALL_SLIDE');
        expect(fsm.state).toBe('WALL_SLIDE');
        expect(mockAnim.playOnceThen).toHaveBeenCalled();
    });

    test('should perform double jump in air', () => {
        mockContext.sensors.onFloor = false;
        mockContext.sensors.vy = -100; // Rising
        mockContext.intent.jumpJustPressed = true;
        mockContext.flags.canDoubleJump = true;
        mockContext.jumpsUsed = 1;

        fsm.update();

        // Should trigger double jump logic
        expect(mockContext.doDoubleJump).toHaveBeenCalled();
        expect(fsm.state).toBe('AIR_RISE');
    });
});
