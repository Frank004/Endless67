
import { Player } from '../../src/prefabs/Player.js';
import EventBus, { Events } from '../../src/core/EventBus.js';

describe('Player', () => {
    let scene;
    let player;

    beforeEach(() => {
        scene = new PhaserMock.Scene('TestScene');
        scene.registry.get.mockReturnValue(false); // Default: no PNG
        // Add anims mock
        scene.anims = {
            exists: jest.fn(() => false),
            play: jest.fn()
        };
        player = new Player(scene, 100, 100);
    });

    afterEach(() => {
        if (player && player.destroy) {
            player.destroy();
        }
        EventBus.removeAllListeners();
    });

    test('should be created correctly', () => {
        expect(player).toBeDefined();
        expect(player.x).toBe(100);
        expect(player.y).toBe(100);
        // Gravity is now inherited from world (1200), not set on individual sprites
        expect(player.controller).toBeDefined();
    });

    // Logic tests for jump/wallJump removed as they are now handled by PlayerController (FSM)

    test('move and stop should delegate acceleration changes', () => {
        player.setAccelerationX = jest.fn();

        player.move(1);
        player.stop();

        // 828 is baseMoveForce
        expect(player.setAccelerationX).toHaveBeenCalledWith(828);
        expect(player.setAccelerationX).toHaveBeenCalledWith(0);
    });

    // handleWallTouch tests removed as logic moved to FSM

    test('destroy should remove EventBus listeners', () => {
        const moveListenersBefore = EventBus.events[Events.PLAYER_MOVE]?.length || 0;

        player.destroy();
        player = null;

        expect(EventBus.events[Events.PLAYER_MOVE] || []).toHaveLength(0);
        expect(EventBus.events[Events.PLAYER_STOP] || []).toHaveLength(0);
        expect(EventBus.events[Events.PLAYER_JUMP_REQUESTED] || []).toHaveLength(0);
        expect(moveListenersBefore).toBeGreaterThan(0);
    });
});
