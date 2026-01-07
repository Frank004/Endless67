
import { CleanupManager } from '../../../src/managers/level/CleanupManager.js';

describe('CleanupManager', () => {
    let cleanupManager;
    let mockScene;
    let mockPool;
    let mockGroup;

    beforeEach(() => {
        // Mock Pool
        mockPool = {
            getActive: jest.fn(() => []), // Return empty by default
            despawn: jest.fn(),
            trim: jest.fn()
        };

        // Mock Group
        mockGroup = {
            remove: jest.fn(),
            children: {
                each: jest.fn((callback) => {
                    // Simulate empty iteration
                })
            }
        };

        // Mock Scene structure
        mockScene = {
            platforms: mockGroup,
            platformPool: mockPool,

            patrolEnemies: mockGroup,
            patrolEnemyPool: mockPool,

            shooterEnemies: mockGroup,
            shooterEnemyPool: mockPool,

            jumperShooterEnemies: mockGroup,
            jumperShooterEnemyPool: mockPool,

            coins: mockGroup,
            coinPool: mockPool,

            powerups: mockGroup,
            powerupPool: mockPool,

            mazeWalls: {
                children: {
                    each: jest.fn()
                }
            }
        };

        cleanupManager = new CleanupManager(mockScene);
    });

    test('should despawn platforms below limitY', () => {
        const activePlatforms = [
            { y: 100, active: true }, // Should stay
            { y: 2000, active: true } // Should remove (limit is 900)
        ];
        mockScene.platformPool.getActive.mockReturnValue(activePlatforms);

        const limitY = 900;
        cleanupManager.cleanup(limitY);

        expect(mockScene.platformPool.despawn).toHaveBeenCalledWith(activePlatforms[1]);
        expect(mockScene.platformPool.despawn).not.toHaveBeenCalledWith(activePlatforms[0]);
    });

    test('should despawn enemies below limitY', () => {
        const activeEnemies = [
            { y: 2000, active: true }
        ];
        mockScene.patrolEnemyPool.getActive.mockReturnValue(activeEnemies);

        const limitY = 900;
        cleanupManager.cleanup(limitY);

        expect(mockScene.patrolEnemyPool.despawn).toHaveBeenCalledWith(activeEnemies[0]);
    });

    test('should clean coins using group iteration', () => {
        const mockCoins = [
            { y: 500, active: true },
            { y: 1500, active: true }
        ];

        mockScene.coins.children.each.mockImplementation((callback) => {
            mockCoins.forEach(coin => callback(coin));
        });

        const limitY = 900;
        cleanupManager.cleanup(limitY);

        expect(mockScene.coinPool.despawn).toHaveBeenCalledWith(mockCoins[1]);
    });

    test('should call trim on pools', () => {
        const limitY = 900;
        cleanupManager.cleanup(limitY);

        expect(mockScene.platformPool.trim).toHaveBeenCalled();
        expect(mockScene.patrolEnemyPool.trim).toHaveBeenCalled();
    });
});
