
import { PipeDecoration } from '../../../../src/managers/visuals/decorations/PipeDecoration.js';

// Mock BaseWallDecoration and Phaser Scene
jest.mock('../../../../src/managers/visuals/decorations/BaseWallDecoration.js', () => {
    return {
        BaseWallDecoration: class {
            constructor(scene, config, x, y, side) {
                this.scene = scene;
                this.config = config;
                this.x = x;
                this.y = y;
                this.side = side;
            }
        }
    };
});

describe('PipeDecoration', () => {
    let mockScene;
    let mockContainer;
    let mockImage;

    beforeEach(() => {
        // Mock simple Phaser objects
        mockContainer = {
            setDepth: jest.fn(),
            setAlpha: jest.fn(),
            setScale: jest.fn(),
            add: jest.fn()
        };

        mockImage = {
            setOrigin: jest.fn()
        };

        mockScene = {
            add: {
                image: jest.fn(() => ({ ...mockImage })),
                container: jest.fn(() => mockContainer)
            }
        };
    });

    test('should create correct number of segments', () => {
        const config = {
            sprites: { top: 'top', mid: 'mid', bottom: 'bot' },
            atlas: 'atlas',
            depth: 2
        };
        const pattern = { midCount: 3, height: 160 }; // 32(top) + 3*32(mid) + 32(bot) = 160

        new PipeDecoration(mockScene, config, 0, 0, 'right', pattern);

        // 1 top + 3 mid + 1 bottom = 5 images
        expect(mockScene.add.image).toHaveBeenCalledTimes(5);
        expect(mockScene.add.container).toHaveBeenCalled();
    });

    test('should apply mirroring for left wall', () => {
        const config = {
            sprites: { top: 't', mid: 'm', bottom: 'b' },
            atlas: 'a',
            depth: 2,
            scale: 1
        };
        const pattern = { midCount: 1, height: 96 };

        new PipeDecoration(mockScene, config, 0, 0, 'left', pattern);

        // Expect x scale to be negative
        expect(mockContainer.setScale).toHaveBeenCalledWith(-1, 1);
    });

    test('should use normal scale for right wall', () => {
        const config = {
            sprites: { top: 't', mid: 'm', bottom: 'b' },
            atlas: 'a',
            depth: 2,
            scale: 1
        };
        const pattern = { midCount: 1, height: 96 };

        new PipeDecoration(mockScene, config, 0, 0, 'right', pattern);

        // Expect normal scale
        expect(mockContainer.setScale).toHaveBeenCalledWith(1);
    });

    test('should calculate height correctly', () => {
        const config = {
            sprites: { top: 't', mid: 'm', bottom: 'b' },
            atlas: 'a',
            depth: 2
        };
        const pattern = { midCount: 2, height: 128 }; // 32 + 32*2 + 32 = 128

        const pipe = new PipeDecoration(mockScene, config, 0, 0, 'right', pattern);

        expect(pipe.getHeight()).toBe(128);
    });
});
