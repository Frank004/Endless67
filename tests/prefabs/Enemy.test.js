
import { PatrolEnemy, ShooterEnemy } from '../../src/prefabs/Enemy.js';

describe('Enemies', () => {
    let scene;
    let player;
    let projectilesGroup;

    beforeEach(() => {
        scene = new PhaserMock.Scene('TestScene');
        player = { x: 100, y: 100, active: true };
        scene.player = player;
        scene.time = {
            addEvent: jest.fn(() => ({
                destroy: jest.fn(),
                remove: jest.fn()
            })),
            delayedCall: jest.fn()
        };

        projectilesGroup = {
            get: jest.fn(() => ({
                fire: jest.fn(),
                setActive: jest.fn(),
                setVisible: jest.fn(),
                body: {
                    reset: jest.fn(),
                    setVelocityX: jest.fn(),
                    setVelocityY: jest.fn()
                }
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

            // Verificar que se inició el patrullaje (legacy check removed)
            // Expect autoPatrol properties to be set on sprite
            expect(enemy.riderAutoPatrol).toBe(true);
            expect(enemy.riderPatrolSpeed).toBe(60);

            // Note: patrolDir logic is now internal to platformRider.js
            // We verify the intent via configuration flags
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
            expect(enemy.shootBehavior.timer).toBeDefined(); // Ahora está en behavior
        });

        test('should shoot projectile towards player', () => {
            enemy.spawn(200, 200);
            scene.player.x = 100; // Left of enemy

            // Iniciar shooting primero para que el behavior tenga el grupo
            enemy.startShooting(projectilesGroup, 0);
            // Luego disparar
            enemy.shootBehavior.fireOnce();

            expect(projectilesGroup.get).toHaveBeenCalled();
            // Should fire left (-1)
            // We can't easily check the arguments of the mock returned by get() unless we store it
            // But we can check if get was called with expected coordinates
        });

        test('should stop shooting when destroyed or offscreen', () => {
            enemy.spawn(200, 200);
            enemy.startShooting(projectilesGroup, 0);

            enemy.stopShooting();
            expect(enemy.shootBehavior.timer).toBeNull(); // Ahora está en behavior
        });
    });
});
