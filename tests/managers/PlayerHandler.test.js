import { PlayerHandler } from '../../src/managers/collision/PlayerHandler.js';
import ScoreManager from '../../src/managers/gameplay/ScoreManager.js';
import AudioSystem from '../../src/core/systems/AudioSystem.js';

const createMockText = () => ({
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    destroy: jest.fn()
});

describe('PlayerHandler', () => {
    let scene;
    let player;
    let handler;

    beforeEach(() => {
        player = {
            x: 10,
            y: 20,
            setVelocity: jest.fn(),
            setVelocityY: jest.fn(),
            setTint: jest.fn(),
            setVisible: jest.fn(),
            setActive: jest.fn(),
            handleLand: jest.fn(),
            handleWallTouch: jest.fn()
        };

        scene = {
            gameStarted: true,
            isGameOver: false,
            isInvincible: false,
            deactivatePowerup: jest.fn(),
            powerupTimer: { remove: jest.fn() },
            riserManager: {
                config: { displayName: 'Lava', color: '#ff0000', dropSoundKey: 'lava_drop' },
                triggerRising: jest.fn()
            },
            uiText: {
                setText: jest.fn(),
                setVisible: jest.fn(),
                setDepth: jest.fn(),
                scene: {
                    add: {
                        text: jest.fn(() => createMockText())
                    }
                }
            },
            scoreText: { setDepth: jest.fn() },
            burnEmitter: { emitParticleAt: jest.fn() },
            physics: { pause: jest.fn() },
            time: { delayedCall: jest.fn((_, cb) => cb && cb()) },
            tweens: { add: jest.fn() },
            cameras: { main: { shake: jest.fn() } },
            totalScore: 67,
            currentHeight: 120,
            uiManager: {
                showNameInput: jest.fn(),
                showPostGameOptions: jest.fn()
            }
        };

        handler = new PlayerHandler(scene);
        jest.spyOn(AudioSystem, 'playRiserDrop').mockImplementation(() => { });
        jest.spyOn(ScoreManager, 'isHighScore').mockReturnValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('touchRiser with invincibility should boost and show jump text', () => {
        scene.isInvincible = true;

        handler.touchRiser(player, {});

        expect(scene.deactivatePowerup).toHaveBeenCalled();
        expect(scene.powerupTimer.remove).toHaveBeenCalled();
        expect(player.setVelocityY).toHaveBeenCalledWith(-900);
        expect(scene.uiText.scene.add.text).toHaveBeenCalled();
        expect(scene.isGameOver).toBe(false);
        expect(AudioSystem.playRiserDrop).not.toHaveBeenCalled();
    });

    test('touchRiser without invincibility should trigger game over flow and high score input', () => {
        ScoreManager.isHighScore.mockReturnValue(true);

        handler.touchRiser(player, {});

        expect(AudioSystem.playRiserDrop).toHaveBeenCalled();
        expect(scene.isGameOver).toBe(true);
        expect(scene.burnEmitter.emitParticleAt).toHaveBeenCalledWith(player.x, player.y, 50);
        expect(player.setVelocity).toHaveBeenCalledWith(0, 0);
        expect(player.setTint).toHaveBeenCalledWith(0x000000);
        expect(scene.physics.pause).toHaveBeenCalled();
        expect(scene.uiText.setText).toHaveBeenCalledWith(expect.stringContaining('GAME OVER'));
        expect(scene.uiText.setText).toHaveBeenCalledWith(expect.stringContaining('GAME OVER'));
    });
});
