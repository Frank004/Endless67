import { ItemHandler } from '../../src/managers/collision/ItemHandler.js';
import AudioManager from '../../src/managers/AudioManager.js';

describe('ItemHandler', () => {
    let scene;
    let handler;
    let player;

    beforeEach(() => {
        player = { x: 10, y: 20, setTint: jest.fn() };
        scene = {
            totalScore: 0,
            uiManager: { updateScore: jest.fn() },
            trigger67Celebration: jest.fn(),
            add: {
                text: jest.fn(() => ({
                    setOrigin: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                }))
            },
            tweens: {
                add: jest.fn(({ onComplete }) => {
                    if (onComplete) onComplete();
                })
            },
            cameras: { main: { centerX: 200, scrollY: 0, shake: jest.fn() } },
            physics: { pause: jest.fn(), resume: jest.fn() },
            auraEmitter: { start: jest.fn() },
            time: { delayedCall: jest.fn() }
        };
        handler = new ItemHandler(scene);

        jest.spyOn(AudioManager, 'playCoinSound').mockImplementation(() => {});
        jest.spyOn(AudioManager, 'playCelebrationSound').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('collectCoin should increment score, update UI, and play sound', () => {
        scene.totalScore = 66;
        const coin = { destroy: jest.fn() };

        handler.collectCoin(player, coin);

        expect(coin.destroy).toHaveBeenCalled();
        expect(scene.uiManager.updateScore).toHaveBeenCalledWith(67);
        expect(AudioManager.playCoinSound).toHaveBeenCalled();
        expect(scene.trigger67Celebration).toHaveBeenCalled();
    });

    test('collectPowerup should pause game, tint player, and play celebration sound', () => {
        const powerup = { destroy: jest.fn() };

        handler.collectPowerup(player, powerup);

        expect(powerup.destroy).toHaveBeenCalled();
        expect(scene.physics.pause).toHaveBeenCalled();
        expect(player.setTint).toHaveBeenCalledWith(0xffff00);
        expect(scene.auraEmitter.start).toHaveBeenCalled();
        expect(AudioManager.playCelebrationSound).toHaveBeenCalled();
        expect(scene.isPausedEvent).toBe(true);
    });
});
