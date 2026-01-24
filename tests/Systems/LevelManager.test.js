import { LevelManager } from '../../src/Systems/Level/LevelManager.js';

// Mocks
const mockPlatformSpawner = { spawn: jest.fn() };
const mockMazeSpawner = { spawnMazeRowFromConfig: jest.fn() };

jest.mock('../../src/Systems/Level/PlatformSpawner.js', () => ({
    PlatformSpawner: jest.fn(() => mockPlatformSpawner)
}));

jest.mock('../../src/Systems/Level/MazeSpawner.js', () => ({
    MazeSpawner: jest.fn(() => mockMazeSpawner)
}));

describe('LevelManager', () => {
    let scene;
    let levelManager;

    beforeEach(() => {
        scene = {
            patrolEnemyPool: {},
            shooterEnemyPool: {}
        };
        // Reset mocks
        mockPlatformSpawner.spawn.mockClear();
        mockMazeSpawner.spawnMazeRowFromConfig.mockClear();

        levelManager = new LevelManager(scene);
    });

    test('should initialize with spawners', () => {
        expect(levelManager.platformSpawner).toBeDefined();
        expect(levelManager.mazeSpawner).toBeDefined();
    });

    test('spawnPlatform should delegate to PlatformSpawner', () => {
        levelManager.spawnPlatform(10, 20, 100, true, 50);
        expect(mockPlatformSpawner.spawn).toHaveBeenCalledWith(10, 20, 100, true, 50);
    });

    test('spawnMazeRowFromConfig should delegate to MazeSpawner', () => {
        const config = {};
        levelManager.spawnMazeRowFromConfig(100, config, true, false);
        expect(mockMazeSpawner.spawnMazeRowFromConfig).toHaveBeenCalledWith(100, config, true, false, null, null, null, null, null);
    });
});
