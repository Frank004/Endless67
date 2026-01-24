
import { Player } from '../../src/Entities/Player/Player.js';
import EventBus, { Events } from '../../src/Core/EventBus.js';

describe('Player', () => {
    let scene;
    let player;

    beforeEach(() => {
        // Mock Phaser Sprite methods that are called in constructor via Visuals/Physics
        Phaser.Physics.Arcade.Sprite.prototype.setTexture = jest.fn();
        Phaser.Physics.Arcade.Sprite.prototype.setFrame = jest.fn();
        Phaser.Physics.Arcade.Sprite.prototype.setBounce = jest.fn();
        Phaser.Physics.Arcade.Sprite.prototype.setDragX = jest.fn();
        Phaser.Physics.Arcade.Sprite.prototype.setMaxVelocity = jest.fn();
        Phaser.Physics.Arcade.Sprite.prototype.setCollideWorldBounds = jest.fn();
        Phaser.Physics.Arcade.Sprite.prototype.setDepth = jest.fn();
        // Body mocks are tricky because body is usually a property. 
        // Logic will assume this.body is set by super() or manually in test env.
        // But in real Phaser, super() sets this.body.
        // We might need to mock Body property on the prototype or instance if super doesn't do it.

        scene = new PhaserMock.Scene('TestScene');
        scene.registry.get.mockReturnValue(false); // Default: no PNG

        // Mock physics system to attach body
        scene.physics = {
            add: {
                existing: jest.fn((obj) => {
                    obj.body = {
                        setGravityY: jest.fn(),
                        setBounce: jest.fn(),
                        setSize: jest.fn(),
                        setOffset: jest.fn(),
                        setDragX: jest.fn(),
                        setMaxVelocity: jest.fn(),
                        onWorldBounds: false,
                        velocity: { x: 0, y: 0 },
                        setAcceleration: jest.fn(),
                        setVelocity: jest.fn(),
                        setVelocityY: jest.fn()
                    };
                })
            }
        };

        scene.add = {
            existing: jest.fn()
        };

        // Mock textures
        scene.textures = {
            exists: jest.fn(() => false),
            get: jest.fn(() => ({
                has: jest.fn(() => true)
            }))
        };

        // Add anims mock
        scene.anims = {
            exists: jest.fn(() => false),
            play: jest.fn()
        };

        // Mock make factory for Placeholder generation
        scene.make = {
            graphics: jest.fn(() => ({
                fillStyle: jest.fn(),
                fillRect: jest.fn(),
                generateTexture: jest.fn(),
                destroy: jest.fn()
            }))
        };

        // Ensure body exists on instance after construction if super doesn't do it perfectly in mock
        // We can't easily intercept 'this' inside constructor.
        // But Jest prototypes might handle methods.
        // For 'this.body.setGravityY', 'this.body' must exist.
        // Let's rely on PhaserMock to create body, or we patch it.

        player = new Player(scene, 100, 100);

        // Patch body if missing (though PlayerPhysics init might have failed if body was missing)
        // This block is no longer needed as scene.physics.add.existing mock handles body creation.
    });

    afterEach(() => {
        if (player && player.destroy) {
            player.destroy();
        }
        EventBus.removeAllListeners();
    });

    test('should be created correctly', () => {
        expect(player).toBeDefined();
        expect(player.x).toBe(100);
        expect(player.y).toBe(100);
        // Gravity is now inherited from world (1200), not set on individual sprites
        expect(player.controller).toBeDefined();
        expect(player.visuals).toBeDefined();
        expect(player.physics).toBeDefined();
    });

    // Logic tests for jump/wallJump removed as they are now handled by PlayerController (FSM)

    test('move and stop should delegate acceleration changes', () => {
        player.setAccelerationX = jest.fn();

        player.move(1);
        player.stop();

        // 828 is baseMoveForce
        expect(player.setAccelerationX).toHaveBeenCalledWith(828);
        expect(player.setAccelerationX).toHaveBeenCalledWith(0);
    });

    // handleWallTouch tests removed as logic moved to FSM

    test('destroy should remove EventBus listeners', () => {
        const moveListenersBefore = EventBus.events[Events.PLAYER_MOVE]?.length || 0;

        player.destroy();
        player = null;

        expect(EventBus.events[Events.PLAYER_MOVE] || []).toHaveLength(0);
        expect(EventBus.events[Events.PLAYER_STOP] || []).toHaveLength(0);
        expect(EventBus.events[Events.PLAYER_JUMP_REQUESTED] || []).toHaveLength(0);
        expect(moveListenersBefore).toBeGreaterThan(0);
    });
});
