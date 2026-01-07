import { EnemyHandler } from '../../src/managers/collision/EnemyHandler.js';
import EventBus, { Events } from '../../src/core/EventBus.js';

describe('EnemyHandler', () => {
    let scene;
    let handler;
    let player;
    let enemy;

    beforeEach(() => {
        player = {
            setTint: jest.fn(),
            setVelocity: jest.fn(),
            clearTint: jest.fn(),
            isInvincible: false
        };
        enemy = {
            x: 10,
            y: 20,
            destroy: jest.fn()
        };
        scene = {
            isInvincible: false,
            particleManager: { emitSpark: jest.fn() },
            cameras: { main: { shake: jest.fn() } },
            time: { delayedCall: jest.fn((_, __, ___, context) => context && context()) }
        };
        handler = new EnemyHandler(scene);
        jest.spyOn(EventBus, 'emit');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('hitEnemy should destroy enemy and play destroy sound when invincible', () => {
        player.isInvincible = true;

        handler.hitEnemy(player, enemy);

        expect(enemy.destroy).toHaveBeenCalled();
        expect(enemy.destroy).toHaveBeenCalled();
        expect(scene.particleManager.emitSpark).toHaveBeenCalledWith(enemy.x, enemy.y);
        expect(EventBus.emit).toHaveBeenCalledWith(Events.ENEMY_DESTROYED);
        expect(EventBus.emit).not.toHaveBeenCalledWith(Events.PLAYER_HIT);
    });

    test('hitEnemy should damage player when not invincible', () => {
        handler.hitEnemy(player, enemy);

        handler.hitEnemy(player, enemy);

        expect(EventBus.emit).toHaveBeenCalledWith(Events.PLAYER_HIT);
        expect(player.setTint).toHaveBeenCalledWith(0xff0000);
        expect(scene.cameras.main.shake).toHaveBeenCalledWith(100, 0.01);
        expect(player.setVelocity).toHaveBeenCalledWith(expect.any(Number), 520);
    });
});
