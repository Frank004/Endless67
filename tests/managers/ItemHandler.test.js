import { ItemHandler } from '../../src/managers/collision/ItemHandler.js';
import EventBus, { Events } from '../../src/core/EventBus.js';

describe('ItemHandler', () => {
    let scene;
    let handler;
    let player;

    beforeEach(() => {
        player = { x: 10, y: 20, setTint: jest.fn(), clearTint: jest.fn(), controller: { anim: { play: jest.fn() } }, setFlipX: jest.fn(), setVisible: jest.fn() };
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
            physics: { pause: jest.fn(), resume: jest.fn() },
            particleManager: { startAura: jest.fn() },
            time: { delayedCall: jest.fn() },
            activateInvincibility: jest.fn()
        };
        handler = new ItemHandler(scene);

        jest.spyOn(EventBus, 'emit');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('collectCoin should increment score, update UI, and play sound', () => {
        scene.totalScore = 66;
        const coin = { active: true, destroy: jest.fn(), body: { setEnable: jest.fn() }, setActive: jest.fn(), setVisible: jest.fn() };

        handler.collectCoin(player, coin);

        expect(coin.destroy).toHaveBeenCalled();
        expect(scene.uiManager.updateScore).toHaveBeenCalledWith(67);
        expect(EventBus.emit).toHaveBeenCalledWith(Events.COIN_COLLECTED);
        expect(scene.trigger67Celebration).toHaveBeenCalled();
    });

    test('collectPowerup should pause game, tint player, and play celebration sound', () => {
        const powerup = { active: true, destroy: jest.fn(), body: { setEnable: jest.fn() }, setActive: jest.fn(), setVisible: jest.fn() };

        handler.collectPowerup(player, powerup);

        expect(powerup.destroy).toHaveBeenCalled();
        expect(scene.physics.pause).toHaveBeenCalled();
        // The delayed call callback triggers the aura, so we test that flow
        expect(EventBus.emit).toHaveBeenCalledWith(Events.POWERUP_COLLECTED);
        expect(scene.isPausedEvent).toBe(true);

        // Simulate delayed call callback to check aura start
        // Add mock method to player
        player.activateInvincibility = jest.fn();

        const callback = scene.time.delayedCall.mock.calls[0][1];
        callback();
        expect(player.activateInvincibility).toHaveBeenCalled();
    });
});
