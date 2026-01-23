
import { PlatformValidator } from '../../../src/managers/level/PlatformValidator.js';
import { WALLS } from '../../../src/config/GameConstants.js';

describe('PlatformValidator', () => {
    let validator;
    let mockScene;

    beforeEach(() => {
        mockScene = {
            cameras: {
                main: { width: 400, height: 600 }
            }
        };
        validator = new PlatformValidator(mockScene);
    });

    test('should reject positions too close vertically to active platforms', () => {
        const activePlatforms = [
            { x: 200, y: 500, width: 100, height: 32 }
        ];

        // 100px difference, min is 160
        expect(validator.isValidPosition(200, 400, 100, activePlatforms)).toBe(false);
    });

    test('should reject positions on same line', () => {
        const activePlatforms = [
            { x: 100, y: 500, width: 100, height: 32 }
        ];

        // 20px Y difference < SAME_LINE_EPS (32)
        expect(validator.isValidPosition(200, 510, 100, activePlatforms)).toBe(false);
    });

    test('should reject overlapping platforms', () => {
        const activePlatforms = [
            { x: 200, y: 500, width: 100, height: 32 }
        ];

        // Overlapping at same position
        expect(validator.isValidPosition(200, 500, 100, activePlatforms)).toBe(false);

        // Overlapping partially
        expect(validator.isValidPosition(220, 500, 100, activePlatforms)).toBe(false);
    });

    test('should accept valid position', () => {
        const activePlatforms = [
            { x: 200, y: 800, width: 100, height: 32 }
        ];

        // Far enough (500 vs 800) and centered
        expect(validator.isValidPosition(200, 500, 100, activePlatforms)).toBe(true);
    });
});
