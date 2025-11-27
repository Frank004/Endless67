
import { Player } from '../../src/prefabs/Player.js';

describe('Player', () => {
    let scene;
    let player;

    beforeEach(() => {
        scene = new PhaserMock.Scene('TestScene');
        scene.registry.get.mockReturnValue(false); // Default: no PNG
        player = new Player(scene, 100, 100);
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
});
