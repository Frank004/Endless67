
import { PlayerVisuals } from '../../../src/Entities/Player/PlayerVisuals.js';
import { ASSETS } from '../../../src/Config/AssetKeys.js';

describe('PlayerVisuals', () => {
    let playerVisuals;
    let mockScene;
    let mockPlayer;

    beforeEach(() => {
        mockScene = {
            textures: {
                exists: jest.fn(),
                get: jest.fn(() => ({
                    has: jest.fn(() => true)
                }))
            },
            tweens: {
                add: jest.fn()
            },
            registry: {
                get: jest.fn()
            },
            make: {
                graphics: jest.fn()
            }
        };

        mockPlayer = {
            scene: mockScene,
            setTexture: jest.fn(),
            setFrame: jest.fn(),
            setTint: jest.fn(),
            clearTint: jest.fn(),
            fillStyle: jest.fn(),
            fillRect: jest.fn(),
            generateTexture: jest.fn(),
            destroy: jest.fn(),
            setFlipX: jest.fn(),
            width: 32,
            height: 32
        };

        // By default, texture does not exist
        mockScene.textures.exists.mockReturnValue(false);
    });

    test('should initialize with placeholder if no texture exists', () => {
        // Mock graphics context for texture generation
        const mockGraphics = {
            fillStyle: jest.fn(),
            fillRect: jest.fn(),
            generateTexture: jest.fn(),
            destroy: jest.fn()
        };
        mockScene.make = { graphics: jest.fn(() => mockGraphics) };

        playerVisuals = new PlayerVisuals(mockPlayer);
        playerVisuals.init();

        expect(mockScene.make.graphics).toHaveBeenCalled();
        expect(mockPlayer.setTexture).toHaveBeenCalledWith('player_placeholder');
    });

    test('should initialize with atlas texture if exists', () => {
        mockScene.textures.exists.mockImplementation(key => key === ASSETS.PLAYER);

        playerVisuals = new PlayerVisuals(mockPlayer);
        playerVisuals.init();

        expect(mockPlayer.setTexture).toHaveBeenCalledWith(ASSETS.PLAYER);
        expect(mockPlayer.setFrame).toHaveBeenCalledWith('IDLE 1.png');
    });

    test('should handle flipX', () => {
        playerVisuals = new PlayerVisuals(mockPlayer);
        playerVisuals.setFlipX(true);
        expect(mockPlayer.setFlipX).toHaveBeenCalledWith(true);
    });

    test('should apply invincibility effect', () => {
        playerVisuals = new PlayerVisuals(mockPlayer);
        playerVisuals.setInvincibilityVisuals(true);
        expect(mockScene.tweens.add).toHaveBeenCalled();
    });

    test('should update visuals based on velocity', () => {
        playerVisuals = new PlayerVisuals(mockPlayer);

        // Setup body mock
        mockPlayer.body = { velocity: { x: -100 } };
        playerVisuals.update();
        expect(mockPlayer.setFlipX).toHaveBeenCalledWith(true);

        mockPlayer.body.velocity.x = 100;
        playerVisuals.update();
        expect(mockPlayer.setFlipX).toHaveBeenCalledWith(false);
    });
});
