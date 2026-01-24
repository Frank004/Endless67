jest.mock('../../src/Entities/Platform.js', () => ({
    PLATFORM_WIDTH: 128,
    PLATFORM_HEIGHT: 32,
    Platform: class { }
}));
jest.mock('../../src/Config/SlotConfig.js', () => ({
    SLOT_CONFIG: {
        slotHeight: 640,
        slotGap: 0,
        platformWidth: 128,
        platformHeight: 32,
        minVerticalGap: 160,
        rules: {
            spawnBuffer: 2,
            cleanupDistance: 2000,
            tutorialSlots: 0,
            startPlatformY: 450
        },
        types: {
            PLATFORM_BATCH: { height: 640, platformCount: { min: 4, max: 4 }, transformWeights: {}, spawnChances: {} },
            SAFE_ZONE: { height: 640, platformCount: { min: 4, max: 4 }, transformWeights: {}, spawnChances: {} },
            MAZE: { height: 640, rowCount: 5, spawnChances: {}, transformWeights: {} }
        }
    },
    getPlatformBounds: jest.fn(() => ({ minX: 50, maxX: 350, centerX: 200 })),
    getItemBounds: jest.fn(() => ({ minX: 50, maxX: 350 }))
}));
jest.mock('../../src/Utils/playableBounds.js', () => ({
    getPlayableBounds: jest.fn(() => ({ minX: 50, maxX: 350, centerX: 200, width: 300 }))
}));
jest.mock('../../src/Utils/PatternTransformer.js', () => ({
    PatternTransformer: jest.fn().mockImplementation(() => ({
        setGameWidth: jest.fn(),
        randomTransform: jest.fn(() => ({
            platforms: [{ x: 200, y: 0, width: 128 }],
            transform: 'none'
        })),
        clampToBounds: jest.fn((platforms) => platforms)
    }))
}));
jest.mock('../../src/Data/PlatformPatterns.js', () => ({
    PLATFORM_PATTERNS: [{ name: 'test_pattern', platforms: [{ x: 200, y: 0 }] }],
    getRandomPattern: jest.fn(() => ({ name: 'test_pattern', platforms: [{ x: 200, y: 0 }] })),
    getRandomPatternExcluding: jest.fn(() => ({ name: 'test_pattern', platforms: [{ x: 200, y: 0 }] }))
}));

import { SlotGenerator } from '../../src/Systems/Level/SlotGenerator.js';

describe('SlotGenerator edge diagnostics', () => {
    let generator;
    let scene;

    beforeEach(() => {
        global.Phaser = {
            Math: {
                Between: jest.fn(() => 0),
                Linear: jest.fn(),
                Clamp: (v, min, max) => Math.max(min, Math.min(max, v))
            },
            Utils: {
                Array: {
                    Shuffle: (arr) => arr,
                    GetRandom: (arr) => arr[0]
                }
            }
        };

        scene = {
            cameras: { main: { width: 400, height: 800, scrollY: 0 } },
            registry: { get: jest.fn(() => false) },
            player: { y: -10000 }, // fuerza generación inmediata
            physics: { add: { staticSprite: jest.fn(() => ({ setDisplaySize: jest.fn().mockReturnThis(), refreshBody: jest.fn().mockReturnThis() })) } },
            levelManager: { spawnPlatform: jest.fn(() => ({ active: true })), cleanupOnly: jest.fn() },
            platforms: { add: jest.fn(), contains: jest.fn(() => false) },
            powerupPool: { spawn: jest.fn(() => ({})) },
            coinPool: { spawn: jest.fn(() => ({})) },
            powerups: { add: jest.fn() },
            coins: { add: jest.fn() },
            time: { delayedCall: jest.fn((_, cb) => cb && cb()) }
        };

        generator = new SlotGenerator(scene);
        generator.spawnBuffer = 0;
        generator.slotHeight = 640;
    });

    test('resets isGenerating flag after generation error', () => {
        generator.generateNextSlot = jest.fn(() => { throw new Error('fail'); });

        expect(() => generator.update()).not.toThrow();
        expect(generator.isGenerating).toBe(false);
    });

    test('warns when hitting max generations per frame', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        generator.slots = [];
        generator.generateNextSlot = jest.fn(() => {
            const last = generator.slots[generator.slots.length - 1];
            const yStart = last ? last.yEnd : 0;
            const yEnd = yStart - generator.slotHeight;
            generator.slots.push({ yStart, yEnd, height: generator.slotHeight, contentHeight: generator.slotHeight, type: 'PLATFORM_BATCH' });
            generator.currentSlotIndex++;
        });

        generator.update();

        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });
});
