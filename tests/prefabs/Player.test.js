
import { Player } from '../../src/prefabs/Player.js';
import EventBus, { Events } from '../../src/core/EventBus.js';

describe('Player', () => {
    let scene;
    let player;

    beforeEach(() => {
        scene = new PhaserMock.Scene('TestScene');
        scene.registry.get.mockReturnValue(false); // Default: no PNG
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
        expect(player.body.gravity.y).toBe(1200);
    });

    test('should jump when on ground', () => {
        player.jumps = 0;
        player.maxJumps = 2;

        const result = player.jump();

        expect(result).not.toBeNull();
        expect(result.type).toBe('jump');
        expect(player.body.velocity.y).toBeLessThan(0); // Moving up
        expect(player.jumps).toBe(1);
    });

    test('should double jump', () => {
        player.jumps = 1;
        player.maxJumps = 2;

        const result = player.jump();

        expect(result).not.toBeNull();
        expect(result.type).toBe('double_jump');
        expect(player.jumps).toBe(2);
    });

    test('should not jump if max jumps reached', () => {
        player.jumps = 2;
        player.maxJumps = 2;

        const result = player.jump();

        expect(result).toBeNull();
    });

    test('should wall jump from left wall', () => {
        player.body.touching.left = true;
        player.jumps = 2; // Even if jumps exhausted

        const result = player.jump();

        expect(result).not.toBeNull();
        expect(result.type).toBe('wall_jump');
        expect(player.body.velocity.x).toBeGreaterThan(0); // Pushed right
        expect(player.jumps).toBe(1); // Reset jumps to 1
    });

    test('move and stop should delegate acceleration changes', () => {
        player.setAccelerationX = jest.fn();

        player.move(1);
        player.stop();

        expect(player.setAccelerationX).toHaveBeenCalledWith(900);
        expect(player.setAccelerationX).toHaveBeenCalledWith(0);
    });

    test('handleWallTouch should apply friction and reset jumps on new wall', () => {
        player.body.velocity.y = 200;
        player.jumps = 2;
        player.lastWallTouched = null;
        player.wallJumpConsecutive = 2;

        player.handleWallTouch('right');

        expect(player.body.velocity.y).toBe(80);
        expect(player.jumps).toBe(0);
        expect(player.wallJumpConsecutive).toBe(2); // Unchanged, reset happens in checkWallStamina
    });

    test('handleWallTouch should show depleted stamina feedback', () => {
        player.body.velocity.y = 100;
        player.lastWallTouched = 'left';
        player.wallJumpConsecutive = 5;

        player.handleWallTouch('left');

        expect(player.body.velocity.y).toBe(400);
        expect(player.tint).toBe(0x555555);
    });

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
