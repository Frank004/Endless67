
import { PlayerPhysics } from '../../src/player/PlayerPhysics.js';
import { PLAYER_CONFIG } from '../../src/config/PlayerConfig.js';
import { ASSETS } from '../../src/config/AssetKeys.js';

describe('PlayerPhysics', () => {
    let playerPhysics;
    let mockScene;
    let mockPlayer;
    let mockBody;

    beforeEach(() => {
        mockBody = {
            setGravityY: jest.fn(),
            setBounce: jest.fn(),
            setSize: jest.fn(),
            setOffset: jest.fn(),
            setDragX: jest.fn(),
            setMaxVelocity: jest.fn(),
            setVelocity: jest.fn(),
            setAcceleration: jest.fn(),
            setVelocityY: jest.fn(),
            velocity: { x: 0, y: 0 }
        };

        mockScene = {
            textures: {
                exists: jest.fn()
            }
        };

        mockPlayer = {
            scene: mockScene,
            body: mockBody,
            width: 32,
            height: 48
        };
    });

    test('should initialize physics body properties', () => {
        playerPhysics = new PlayerPhysics(mockPlayer);
        playerPhysics.init();

        // expect(mockBody.setGravityY).toHaveBeenCalledWith(PLAYER_CONFIG.GRAVITY_Y); // Disabled for double gravity fix
        expect(mockBody.setBounce).toHaveBeenCalledWith(0);
        expect(mockBody.setDragX).toHaveBeenCalledWith(PLAYER_CONFIG.DRAG_X);
    });

    test('should set size based on Atlas texture', () => {
        mockScene.textures.exists.mockReturnValue(true); // Has Atlas
        playerPhysics = new PlayerPhysics(mockPlayer);
        playerPhysics.init();

        // Should use BODY config
        expect(mockBody.setSize).toHaveBeenCalledWith(
            PLAYER_CONFIG.BODY.WIDTH,
            expect.any(Number) // Height depends on logic
        );
        expect(mockBody.setOffset).toHaveBeenCalled();
    });

    test('should apply jump velocity', () => {
        playerPhysics = new PlayerPhysics(mockPlayer);
        playerPhysics.jump(-500);

        expect(mockBody.setVelocityY).toHaveBeenCalledWith(-500);
    });

    test('should stop player', () => {
        playerPhysics = new PlayerPhysics(mockPlayer);
        playerPhysics.stop();

        expect(mockPlayer.body.setVelocity).toHaveBeenCalledWith(0, 0);
        expect(mockPlayer.body.setAcceleration).toHaveBeenCalledWith(0, 0);
    });
});
