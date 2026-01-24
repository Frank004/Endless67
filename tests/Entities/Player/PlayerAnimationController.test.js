import { PlayerAnimationController } from '../../../src/Entities/Player/PlayerAnimationController.js';
import { ANIM_MANIFEST } from '../../../src/Entities/Player/animationManifest.js';

// Mock Phaser
global.Phaser = {
    Animations: {
        Events: {
            ANIMATION_COMPLETE: 'animationcomplete',
        },
    },
};

describe('PlayerAnimationController', () => {
    let controller;
    let mockSprite;
    let mockAnimationManager;

    beforeEach(() => {
        // Mock animation manager
        mockAnimationManager = {
            exists: jest.fn().mockReturnValue(true),
        };

        // Mock sprite with anims
        mockSprite = {
            anims: {
                play: jest.fn(),
                stop: jest.fn(),
                isPlaying: false,
                currentAnim: null,
                animationManager: mockAnimationManager,
                once: jest.fn(),
            },
            setFlipX: jest.fn(),
            texture: {
                has: jest.fn().mockReturnValue(true),
            },
            setFrame: jest.fn(),
            off: jest.fn(),
            once: jest.fn(),
            scene: {
                anims: {
                    get: jest.fn(),
                },
            },
        };

        controller = new PlayerAnimationController(mockSprite);
    });

    describe('play()', () => {
        test('should play animation when key is valid', () => {
            controller.play('player_run');

            expect(mockSprite.anims.play).toHaveBeenCalledWith('player_run', true);
            expect(controller.currentKey).toBe('player_run');
        });

        test('should not play if sprite is null', () => {
            controller.sprite = null;
            controller.play('player_run');

            expect(mockSprite.anims.play).not.toHaveBeenCalled();
        });

        test('should not play if key is null', () => {
            controller.play(null);

            expect(mockSprite.anims.play).not.toHaveBeenCalled();
        });

        test('should not play if same animation is already playing', () => {
            mockSprite.anims.currentAnim = { key: 'player_run' };
            mockSprite.anims.isPlaying = true;

            controller.play('player_run');

            expect(mockSprite.anims.play).not.toHaveBeenCalled();
        });

        test('should play different animation even if another is playing', () => {
            mockSprite.anims.currentAnim = { key: 'player_run' };
            mockSprite.anims.isPlaying = true;

            controller.play('player_run_stop');

            expect(mockSprite.anims.play).toHaveBeenCalledWith('player_run_stop', true);
        });

        test('should not play if animation does not exist', () => {
            mockAnimationManager.exists.mockReturnValue(false);

            controller.play('invalid_anim');

            expect(mockSprite.anims.play).not.toHaveBeenCalled();
        });

        test('should allow transition from run to stop-running', () => {
            // First play run
            mockSprite.anims.currentAnim = { key: 'player_run' };
            mockSprite.anims.isPlaying = true;
            controller.currentKey = 'player_run';

            // Then try to play stop-running
            controller.play('player_run_stop');

            expect(mockSprite.anims.play).toHaveBeenCalledWith('player_run_stop', true);
            expect(controller.currentKey).toBe('player_run_stop');
        });
    });

    describe('resolve()', () => {
        test('should resolve GROUND idle', () => {
            const key = controller.resolve('GROUND');
            expect(key).toBe(ANIM_MANIFEST.GROUND.idle);
        });

        test('should resolve GROUND run', () => {
            const key = controller.resolve('GROUND', 'run');
            expect(key).toBe(ANIM_MANIFEST.GROUND.run);
        });

        test('should resolve GROUND runStop', () => {
            const key = controller.resolve('GROUND', 'run_stop');
            expect(key).toBe(ANIM_MANIFEST.GROUND.runStop);
        });

        test('should resolve AIR_RISE up', () => {
            const key = controller.resolve('AIR_RISE');
            expect(key).toBe(ANIM_MANIFEST.AIR_RISE.up);
        });

        test('should resolve AIR_RISE double', () => {
            const key = controller.resolve('AIR_RISE', 'double');
            expect(key).toBe(ANIM_MANIFEST.AIR_RISE.double);
        });

        test('should resolve AIR_FALL loop', () => {
            const key = controller.resolve('AIR_FALL', 'loop');
            expect(key).toBe(ANIM_MANIFEST.AIR_FALL.loop);
        });

        test('should resolve WALL_SLIDE start', () => {
            const key = controller.resolve('WALL_SLIDE', 'start');
            expect(key).toBe(ANIM_MANIFEST.WALL_SLIDE.start);
        });

        test('should resolve HIT', () => {
            const key = controller.resolve('HIT');
            expect(key).toBe(ANIM_MANIFEST.HIT);
        });
    });

    describe('setFacing()', () => {
        test('should flip sprite when direction is negative', () => {
            controller.setFacing(-1);
            expect(mockSprite.setFlipX).toHaveBeenCalledWith(true);
        });

        test('should not flip sprite when direction is positive', () => {
            controller.setFacing(1);
            expect(mockSprite.setFlipX).toHaveBeenCalledWith(false);
        });

        test('should not flip when direction is zero (no call)', () => {
            controller.setFacing(0);
            // setFacing only calls setFlipX if dir !== 0
            expect(mockSprite.setFlipX).not.toHaveBeenCalled();
        });
    });

    describe('playOnceHoldLast()', () => {
        test('should play animation and hold last frame', () => {
            const mockAnim = {
                frames: [
                    { frame: { name: 'frame1' } },
                    { frame: { name: 'frame2' } },
                    { frame: { name: 'frame3' } },
                ],
            };
            mockSprite.scene.anims.get.mockReturnValue(mockAnim);

            controller.playOnceHoldLast('player_jump_up', 'jump-03.png');

            expect(mockSprite.off).toHaveBeenCalled();
            expect(mockSprite.anims.play).toHaveBeenCalledWith('player_jump_up');
        });

        test('should use provided holdFrameName if texture has it', () => {
            const mockAnim = {
                frames: [
                    { frame: { name: 'frame1' } },
                    { frame: { name: 'frame2' } },
                ],
            };
            mockSprite.scene.anims.get.mockReturnValue(mockAnim);
            mockSprite.texture.has.mockReturnValue(true);

            controller.playOnceHoldLast('player_jump_up', 'jump-03.png');

            // Verify off was called to remove previous listener
            expect(mockSprite.off).toHaveBeenCalled();
            expect(mockSprite.anims.play).toHaveBeenCalledWith('player_jump_up');
        });
    });

    describe('Stop-Running Animation Flow', () => {
        test('should transition from run to stop-running correctly', () => {
            // Start with run animation
            mockSprite.anims.currentAnim = { key: 'player_run' };
            mockSprite.anims.isPlaying = true;
            controller.currentKey = 'player_run';

            // Transition to stop-running
            controller.play('player_run_stop');

            expect(mockSprite.anims.play).toHaveBeenCalledWith('player_run_stop', true);
            expect(controller.currentKey).toBe('player_run_stop');
        });

        test('should not restart stop-running if already playing', () => {
            mockSprite.anims.currentAnim = { key: 'player_run_stop' };
            mockSprite.anims.isPlaying = true;

            controller.play('player_run_stop');

            expect(mockSprite.anims.play).not.toHaveBeenCalled();
        });

        test('should allow transition from stop-running to idle', () => {
            mockSprite.anims.currentAnim = { key: 'player_run_stop' };
            mockSprite.anims.isPlaying = false;

            controller.play('player_idle');

            expect(mockSprite.anims.play).toHaveBeenCalledWith('player_idle', true);
        });
    });
});
