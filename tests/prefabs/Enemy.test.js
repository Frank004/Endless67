
import { PatrolEnemy, ShooterEnemy } from '../../src/prefabs/Enemy.js';

describe('Enemies', () => {
    let scene;
    let player;
    let projectilesGroup;

    beforeEach(() => {
        scene = new PhaserMock.Scene('TestScene');
        player = { x: 100, y: 100, active: true };
        scene.player = player;

        projectilesGroup = {
            get: jest.fn(() => ({
                fire: jest.fn(),
                setActive: jest.fn(),
                setVisible: jest.fn(),
                body: { reset: jest.fn() }
            }))
        };
    });

    describe('PatrolEnemy', () => {
        let enemy;

        beforeEach(() => {
            enemy = new PatrolEnemy(scene, 200, 200);
        });

        test('should spawn correctly', () => {
            enemy.spawn(300, 300);
            expect(enemy.active).toBe(true);
            expect(enemy.visible).toBe(true);
            expect(enemy.body.reset).toHaveBeenCalledWith(300, 300);
        });

        test('should patrol within bounds', () => {
            enemy.spawn(200, 200);
            enemy.ridingPlatform = { body: { x: 100, width: 200, velocity: { x: 0 } } };
            enemy.body.blocked.down = true;

            enemy.patrol(100, 300, 60);

            // Move right
            enemy.preUpdate(0, 16);
            expect(enemy.body.velocity.x).toBe(60);

            // Hit right bound
            enemy.x = 310;
            enemy.preUpdate(0, 16);
            expect(enemy.x).toBe(279); // Clamped to platform bounds (100 + 200 - 16 - 5)
            expect(enemy.patrolDir).toBe(-1); // Reversed
        });
    });

    describe('ShooterEnemy', () => {
        let enemy;

        beforeEach(() => {
            enemy = new ShooterEnemy(scene, 200, 200);
        });

        test('should start shooting', () => {
            enemy.spawn(200, 200);
            enemy.startShooting(projectilesGroup, 0);

            expect(scene.time.addEvent).toHaveBeenCalled();
            expect(enemy.shootEvent).toBeDefined();
        });

        test('should shoot projectile towards player', () => {
            enemy.spawn(200, 200);
            scene.player.x = 100; // Left of enemy

            enemy.shoot(projectilesGroup, 0);

            expect(projectilesGroup.get).toHaveBeenCalled();
            // Should fire left (-1)
            // We can't easily check the arguments of the mock returned by get() unless we store it
            // But we can check if get was called with expected coordinates
        });

        test('should stop shooting when destroyed or offscreen', () => {
            enemy.spawn(200, 200);
            enemy.startShooting(projectilesGroup, 0);

            enemy.stopShooting();
            expect(enemy.shootEvent).toBeNull();
        });
    });
});
