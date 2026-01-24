
import { WallDecorManager } from '../../../src/Systems/Visuals/WallDecorManager.js';
import { WallDecorFactory } from '../../../src/Systems/Visuals/decorations/WallDecorFactory.js';
import { DecorRules } from '../../../src/Systems/Visuals/rules/DecorRules.js';

// Mock dependencias
jest.mock('../../../src/Systems/Visuals/decorations/WallDecorFactory.js');
jest.mock('../../../src/Systems/Visuals/rules/DecorRules.js');
jest.mock('../../../src/Config/WallDecorConfig.js', () => ({
    WALL_DECOR_CONFIG: {
        ENABLED: true
    },
    getWallInsetX: jest.fn(() => 100),
    getRandomDecorationType: jest.fn(() => ({ name: 'SIGN_A', depth: 2, frames: { left: [], right: [] } })),
    getRandomFrameForType: jest.fn(() => 'frame1')
}));

describe('WallDecorManager', () => {
    let manager;
    let mockScene;

    beforeEach(() => {
        mockScene = {
            game: {
                config: { width: 800, height: 600 }
            },
            scale: {
                width: 800,
                height: 600
            },
            cameras: {
                main: { scrollY: 0, height: 600 }
            }
        };
        WallDecorFactory.getPipe = jest.fn();
        WallDecorFactory.getSign = jest.fn();
        WallDecorFactory.release = jest.fn();
        WallDecorFactory.clearPools = jest.fn();
        DecorRules.isTooCloseToSameType = jest.fn(() => false);
        DecorRules.isTooCloseToSameType = jest.fn(() => false);
        DecorRules.checkVerticalOverlap = jest.fn(() => false);
        DecorRules.hasEnoughHeight = jest.fn(() => true);

        manager = new WallDecorManager(mockScene);
    });

    test('should add decoration when spawn is successful', () => {
        const mockDecor = {
            initParallax: jest.fn(),
            update: jest.fn(),
            active: true
        };
        WallDecorFactory.getSign.mockReturnValue(mockDecor);

        const decorType = { name: 'SIGN_A', depth: 2, frames: { left: ['f1'], right: ['f1'] } };
        const slotDecorations = [];
        const usedFrames = new Set();

        manager.spawnDecoration(decorType, 100, 100, 'left', slotDecorations, usedFrames);

        expect(WallDecorFactory.getSign).toHaveBeenCalled();
        expect(mockDecor.initParallax).toHaveBeenCalled();
        expect(manager.decorations.length).toBe(1);
    });

    test('should not spawn if rules prevent it', () => {
        // Simular regla fallida
        DecorRules.isTooCloseToSameType.mockReturnValue(true);

        const decorType = { name: 'SIGN_A', depth: 2 };
        const slotDecorations = [];
        const usedFrames = new Set();

        manager.spawnDecoration(decorType, 100, 100, 'left', slotDecorations, usedFrames);

        expect(WallDecorFactory.getSign).not.toHaveBeenCalled();
        expect(manager.decorations.length).toBe(0);
    });

    test('should NOT spawn if not enough height', () => {
        // Simular altura insuficiente
        DecorRules.hasEnoughHeight.mockReturnValue(false);

        const decorType = { name: 'SIGN_A', depth: 2 };
        const slotDecorations = [];
        const usedFrames = new Set();
        const distanceFromFloor = 0; // Very low

        manager.spawnDecoration(decorType, 100, 100, 'left', slotDecorations, usedFrames, distanceFromFloor);

        expect(DecorRules.hasEnoughHeight).toHaveBeenCalled();
        expect(WallDecorFactory.getSign).not.toHaveBeenCalled();
        expect(manager.decorations.length).toBe(0);
    });

    test('should cleanup decorations outside range', () => {
        const mockDecor = {
            shouldCleanup: jest.fn(() => true),
            y: 3000
        };
        manager.decorations = [mockDecor];

        manager.cleanup(0); // Player at 0, limit is ~1800

        expect(mockDecor.shouldCleanup).toHaveBeenCalled();
        expect(WallDecorFactory.release).toHaveBeenCalledWith(mockDecor);
        expect(manager.decorations.length).toBe(0);
    });
});
