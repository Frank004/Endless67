import { RiserManager } from '../../src/Systems/Gameplay/RiserManager.js';
import { RISER_TYPES } from '../../src/Config/RiserConfig.js';

// Mock dependencies
const mockScene = {
    game: {
        config: {
            width: 400,
            height: 600
        },
        renderer: {
            type: 1 // WEBGL
        }
    },
    scale: {
        width: 400,
        height: 600
    },
    cameras: {
        main: {
            scrollY: 0,
            height: 600
        }
    },
    add: {
        existing: jest.fn(),
        tileSprite: jest.fn().mockReturnValue({
            setOrigin: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setPostPipeline: jest.fn().mockReturnThis(),
            body: {
                setSize: jest.fn(),
                setOffset: jest.fn(),
                allowGravity: true,
                immovable: false
            }
        })
    },
    physics: {
        add: {
            existing: jest.fn()
        }
    },
    time: {
        now: 0
    },
    gameStarted: true
};

// Mock Riser Prefab since it uses Phaser calls in constructor
jest.mock('../../src/Entities/Riser.js', () => {
    return {
        Riser: class MockRiser {
            constructor(scene, x, y, width, height, texture) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
                this.texture = texture;
                this.tilePositionY = 0;

                this.body = {
                    setSize: jest.fn(),
                    setOffset: jest.fn()
                };
                this.setVisible = jest.fn();
                // Simulate Phaser adding to scene
                scene.riser = this;
            }
            setPostPipeline() { }
        }
    };
});

describe('RiserManager', () => {
    let riserManager;

    beforeEach(() => {
        jest.clearAllMocks();
        riserManager = new RiserManager(mockScene, RISER_TYPES.LAVA);
    });

    test('should initialize with correct riser type', () => {
        expect(riserManager.config.type).toBe(RISER_TYPES.LAVA);
        expect(riserManager.config.texture).toBe('lava_texture');
    });

    test('should create riser on createRiser', () => {
        riserManager.createRiser();
        expect(riserManager.riser).toBeDefined();

        expect(riserManager.riser.texture).toBe('lava_texture');
    });

    test('should update riser position based on speed', () => {
        riserManager.createRiser();
        riserManager.setEnabled(true);
        const initialY = riserManager.riser.y;

        // Mock getLevelConfig
        jest.mock('../../src/Data/LevelConfig.js', () => ({
            getLevelConfig: () => ({ lava: { speed: -50 } })
        }));

        riserManager.update(600, 16, false);
        // Second call simulates player rising to 0 (rise of 600 > 300)
        riserManager.update(0, 16, false);

        // Should move up (negative Y)
        expect(riserManager.riser.y).toBeLessThan(initialY);
    });

    test('should handle game over state', () => {
        riserManager.createRiser();
        riserManager.setEnabled(true);
        riserManager.triggerRising();

        const initialY = riserManager.riser.y;
        // Initialize
        riserManager.update(600, 16, false);
        riserManager.update(0, 16, true); // isGameOver = true

        // Should rise faster in game over
        expect(riserManager.riser.y).toBeLessThan(initialY);
    });

    test('should configure different riser types', () => {
        const waterManager = new RiserManager(mockScene, RISER_TYPES.WATER);
        expect(waterManager.config.type).toBe(RISER_TYPES.WATER);
        expect(waterManager.config.texture).toBe('water_texture');
        expect(waterManager.config.soundKey).toBe('water_ambient');

        const acidManager = new RiserManager(mockScene, RISER_TYPES.ACID);
        expect(acidManager.config.type).toBe(RISER_TYPES.ACID);
        expect(acidManager.config.texture).toBe('acid_texture');

        const fireManager = new RiserManager(mockScene, RISER_TYPES.FIRE);
        expect(fireManager.config.type).toBe(RISER_TYPES.FIRE);
        expect(fireManager.config.texture).toBe('fire_texture');
    });
});
