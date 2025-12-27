import { LevelManager } from '../../src/managers/LevelManager.js';
import { enablePlatformRider } from '../../src/utils/platformRider.js';
import { WALLS } from '../../src/config/GameConstants.js';
import { getLevelConfig } from '../../src/data/LevelConfig.js';

jest.mock('../../src/data/LevelConfig.js', () => {
    const baseSettings = {
        minPlatformsPerScreen: 1,
        maxPlatformsPerScreen: 1,
        worldHeightForMaxDifficulty: 1000,
        maxHorizontalDelta: 50
    };
    return {
        getLevelConfig: jest.fn(() => ({
            maze: {
                enabled: true,
                allowMovingPlatforms: false,
                allowEnemies: false,
                chance: 0,
                enemyChance: 0,
                enemyCount: { min: 0, max: 0 },
                patterns: 'easy'
            },
            platforms: {
                width: 100,
                staticOnly: true,
                movingChance: 0,
                movingSpeed: 100,
                zigzagChance: 0
            },
            mechanics: { powerups: false, powerupChance: 0 },
            enemies: { spawnChance: 0, distribution: { patrol: 0, shooter: 0 } }
        })),
        LEVEL_CONFIG: { world1: { baseSettings } }
    };
});

jest.mock('../../src/data/MazePatterns.js', () => ({
    MAZE_PATTERNS: [],
    MAZE_PATTERNS_EASY: [[{ type: 'left', width: 120 }]],
    MAZE_PATTERNS_MEDIUM: [],
    MAZE_PATTERNS_HARD: [],
    MAZE_PATTERNS_NUMBERED: []
}));

jest.mock('../../src/utils/platformRider.js', () => ({
    enablePlatformRider: jest.fn()
}));

describe('LevelManager', () => {
    const createScene = () => ({
        currentHeight: 0,
        lastPowerupSpawnHeight: 0,
        lastPowerupTime: 0,
        time: { now: 0, delayedCall: jest.fn() },
        cameras: {
            main: { width: 400, height: 600, centerX: 200, scrollY: 0 }
        },
        coins: {
            create: jest.fn((x, y) => ({ x, y })),
            children: { iterate: jest.fn() }
        },
        powerups: {
            create: jest.fn((x, y) => ({ x, y })),
            children: { iterate: jest.fn() }
        },
        mazeWalls: {
            create: jest.fn(() => ({
                setOrigin: jest.fn().mockReturnThis(),
                setDisplaySize: jest.fn().mockReturnThis(),
                refreshBody: jest.fn().mockReturnThis(),
                setDepth: jest.fn().mockReturnThis()
            })),
            children: { iterate: jest.fn() }
        },
        platforms: {
            add: jest.fn(),
            children: { iterate: jest.fn() }
        },
        patrolEnemies: { children: { iterate: jest.fn() }, countActive: jest.fn(() => 0) },
        shooterEnemies: { children: { iterate: jest.fn() }, countActive: jest.fn(() => 0) },
        jumperShooterEnemies: { children: { iterate: jest.fn() }, countActive: jest.fn(() => 0) },
        projectilePool: null,
        projectiles: { remove: jest.fn() },
        patrolEnemyPool: null,
        shooterEnemyPool: null,
        jumperShooterEnemyPool: null,
        platformPool: null
    });

    test('generateNextRow should not spawn normal platforms while maze sequence is active', () => {
        const scene = createScene();
        const manager = new LevelManager(scene);
        manager.spawnPlatform = jest.fn();
        manager.spawnMazeRowFromConfig = jest.fn();

        manager.currentMazePattern = [{ type: 'left', width: 120 }];
        manager.mazeSequenceRemaining = 1;
        manager.currentMazeRowIndex = 0;

        manager.generateNextRow();

        expect(manager.spawnMazeRowFromConfig).toHaveBeenCalledTimes(1);
        expect(manager.spawnPlatform).not.toHaveBeenCalled();
        expect(manager.mazeSequenceRemaining).toBe(0);
    });

    test('spawnMazeRowFromConfig should place walls and items within maze gap', () => {
        const scene = createScene();
        const manager = new LevelManager(scene);
        jest.spyOn(Phaser.Math, 'Between').mockReturnValue(10);

        manager.spawnMazeRowFromConfig(200, { type: 'left', width: 120 }, false, false);

        const wallCall = scene.mazeWalls.create.mock.calls[0];
        expect(wallCall[0]).toBe(0); // left wall anchored at x=0

        const coinCall = scene.coins.create.mock.calls[0];
        const coinX = coinCall[0];
        expect(coinX).toBeGreaterThanOrEqual(WALLS.WIDTH);
        expect(coinX).toBeLessThanOrEqual(scene.cameras.main.width - WALLS.WIDTH);

        expect(enablePlatformRider).toHaveBeenCalled();

        Phaser.Math.Between.mockRestore();
    });

    test('generateNextRow should spawn platforms within wall bounds and horizontal delta', () => {
        getLevelConfig.mockReturnValue({
            maze: { enabled: false, chance: 0, allowEnemies: false, allowMovingPlatforms: false },
            platforms: {
                width: 120,
                staticOnly: true,
                movingChance: 0,
                movingSpeed: 100,
                zigzagChance: 0
            },
            mechanics: { powerups: false, powerupChance: 0 },
            enemies: { spawnChance: 0, distribution: { patrol: 0, shooter: 0 } }
        });
        const scene = createScene();
        const manager = new LevelManager(scene);
        manager.spawnPlatform = jest.fn();
        manager.lastPlatformX = WALLS.WIDTH + WALLS.MARGIN + 40; // previous platform
        manager.minPlatformsPerScreen = 5;
        manager.maxPlatformsPerScreen = 5;
        manager.worldHeightForMaxDifficulty = 1;
        let call = 0;
        jest.spyOn(Phaser.Math, 'Between').mockImplementation((min, max) => {
            call += 1;
            // First call is the chance roll, force spawn
            if (call === 1) return min;
            return (min + max) / 2;
        });

        manager.generateNextRow();

        const [[x]] = manager.spawnPlatform.mock.calls;
        const minX = WALLS.WIDTH + WALLS.MARGIN;
        const maxX = scene.cameras.main.width - WALLS.WIDTH - WALLS.MARGIN;
        expect(x).toBeGreaterThanOrEqual(minX);
        expect(x).toBeLessThanOrEqual(maxX);
        expect(Math.abs(x - manager.lastPlatformX)).toBeLessThanOrEqual(manager.maxHorizontalDelta);

        Phaser.Math.Between.mockRestore();
    });

    test('starting a maze should spawn a safety platform without blocking entrances', () => {
        getLevelConfig.mockReturnValue({
            maze: {
                enabled: true,
                allowMovingPlatforms: false,
                allowEnemies: false,
                chance: 100,
                patterns: 'easy',
                enemyChance: 0,
                enemyCount: { min: 0, max: 0 }
            },
            platforms: {
                width: 120,
                staticOnly: true,
                movingChance: 0,
                movingSpeed: 100,
                zigzagChance: 0
            },
            mechanics: { powerups: false, powerupChance: 0 },
            enemies: { spawnChance: 0, distribution: { patrol: 0, shooter: 0 } }
        });
        const scene = createScene();
        const manager = new LevelManager(scene);
        manager.spawnPlatform = jest.fn();
        manager.platformsSinceLastMaze = 11; // enable allowMaze gate
        jest.spyOn(Phaser.Math, 'Between').mockReturnValue(0);

        manager.generateNextRow();

        expect(manager.spawnPlatform).toHaveBeenCalledWith(
            scene.cameras.main.centerX,
            expect.any(Number),
            200,
            false
        );
        expect(manager.currentMazePattern).not.toBeNull();

        Phaser.Math.Between.mockRestore();
    });
});
