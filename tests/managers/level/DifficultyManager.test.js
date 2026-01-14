import { DifficultyManager } from '../../../src/managers/level/DifficultyManager.js';
import { LEVEL_CONFIG } from '../../../src/data/LevelConfig.js';

describe('DifficultyManager', () => {
    let difficultyManager;
    let mockScene;

    beforeEach(() => {
        mockScene = {
            registry: {
                get: jest.fn()
            },
            events: {
                emit: jest.fn()
            }
        };
        difficultyManager = new DifficultyManager(mockScene);
    });

    test('should start at height 0 with the first tier', () => {
        expect(difficultyManager.currentHeight).toBe(0);
        const tier = difficultyManager.getCurrentTier();
        expect(tier).toBeDefined();
        // Check strict equality to the config object (reference)
        expect(tier.description).toContain('Training');
    });

    test('should transition to Intro tier at 300m', () => {
        difficultyManager.update(300);
        const tier = difficultyManager.getCurrentTier();
        expect(tier.description).toContain('Intro: Moving Platforms');
        expect(tier.platforms.staticOnly).toBe(false);
    });

    test('should transition to Patrol Enemies at 1000m', () => {
        difficultyManager.update(1000);
        const tier = difficultyManager.getCurrentTier();
        expect(tier.description).toContain('Intro: Patrol Enemies');
        expect(tier.enemies.types).toContain('patrol');
    });

    test('should handle high heights gracefully (Endless Chaos)', () => {
        difficultyManager.update(50000); // Way above max
        const tier = difficultyManager.getCurrentTier();
        expect(tier.description).toContain('Endless Chaos');
        expect(tier.lava.speed).toBe(-110);
    });

    test('getPlatformConfig should return correct config for current tier', () => {
        difficultyManager.update(500); // Moving Platforms tier
        const config = difficultyManager.getPlatformConfig();
        expect(config.movingChance).toBe(40);
        expect(config.movingSpeed).toBe(80);
    });
});
