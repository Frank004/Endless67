
import { EnemySpawnStrategy } from '../../../src/Systems/Level/EnemySpawnStrategy.js';

describe('EnemySpawnStrategy', () => {
    let mockScene;
    let strategy;
    let mockPlatform;

    beforeEach(() => {
        // Mock Scene & LevelManager
        mockScene = {
            levelManager: {
                spawnPatrol: jest.fn(() => ({ active: true, setPatrolBounds: jest.fn(), patrol: jest.fn() })),
                spawnShooter: jest.fn(),
                spawnJumperShooter: jest.fn()
            },
            time: {
                delayedCall: jest.fn((delay, callback) => callback()) // Execute immediately
            }
        };

        mockPlatform = {
            x: 100,
            y: 200,
            width: 128,
            active: true
        };

        strategy = new EnemySpawnStrategy(mockScene);
    });

    test('should NOT spawn enemy if platform is moving', () => {
        // Platform is NOT checked for "isMoving" property directly usually, 
        // passing isMoving flag to trySpawn is better or check inside?
        // Let's assume the method signature will receive isMoving.
        const result = strategy.trySpawn(mockPlatform, { isMoving: true });
        expect(result).toBe(false);
        expect(mockScene.levelManager.spawnPatrol).not.toHaveBeenCalled();
    });

    test('should NOT spawn enemy if platform is inactive', () => {
        mockPlatform.active = false;
        const result = strategy.trySpawn(mockPlatform, { isMoving: false });
        expect(result).toBe(false);
    });

    test('should spawn PATROL when random roll favors it', () => {
        // Chances: Patrol 0.2
        jest.spyOn(Math, 'random').mockReturnValue(0.1);

        const chances = { enemies: 1.0, distribution: { patrol: 20, shooter: 10, jumper: 10 } };

        const result = strategy.trySpawn(mockPlatform, { isMoving: false, spawnChances: chances });

        expect(result).toBe(true);
        expect(mockScene.levelManager.spawnPatrol).toHaveBeenCalledWith(mockPlatform);
    });

    test('should spawn SHOOTER when random roll favors it', () => {
        // Chances: Patrol 0.2, Shooter 0.1 => Range [0.2, 0.3)
        jest.spyOn(Math, 'random').mockReturnValue(0.25);

        const chances = { enemies: 1.0, distribution: { patrol: 20, shooter: 10, jumper: 10 } };

        const result = strategy.trySpawn(mockPlatform, { isMoving: false, spawnChances: chances });

        expect(result).toBe(true);
        expect(mockScene.levelManager.spawnShooter).toHaveBeenCalledWith(mockPlatform);
    });

    test('should spawn JUMPER when random roll favors it', () => {
        // Chances: Patrol 0.2, Shooter 0.1, Jumper 0.1 => Range [0.3, 0.4)
        jest.spyOn(Math, 'random').mockReturnValue(0.35);

        const chances = { enemies: 1.0, distribution: { patrol: 20, shooter: 10, jumper: 10 } };

        const result = strategy.trySpawn(mockPlatform, { isMoving: false, spawnChances: chances });

        expect(result).toBe(true);
        expect(mockScene.levelManager.spawnJumperShooter).toHaveBeenCalledWith(mockPlatform);
    });

    test('should spawn NOTHING when random roll is too high', () => {
        // Chances total 0.4. Value 0.5 should fail.
        jest.spyOn(Math, 'random').mockReturnValue(0.5);

        const chances = { enemies: 1.0, distribution: { patrol: 20, shooter: 10, jumper: 10 } };

        const result = strategy.trySpawn(mockPlatform, { isMoving: false, spawnChances: chances });

        expect(result).toBe(false);
        expect(mockScene.levelManager.spawnPatrol).not.toHaveBeenCalled();
        expect(mockScene.levelManager.spawnShooter).not.toHaveBeenCalled();
    });
});
