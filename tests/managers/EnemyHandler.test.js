import { EnemyHandler } from '../../src/managers/collision/EnemyHandler.js';
import AudioManager from '../../src/managers/AudioManager.js';

describe('EnemyHandler', () => {
    let scene;
    let handler;
    let player;
    let enemy;

    beforeEach(() => {
        player = {
            setTint: jest.fn(),
            setVelocity: jest.fn(),
            clearTint: jest.fn()
        };
        enemy = {
            x: 10,
            y: 20,
            destroy: jest.fn()
        };
        scene = {
            isInvincible: false,
            sparkEmitter: { emitParticleAt: jest.fn() },
            cameras: { main: { shake: jest.fn() } },
            time: { delayedCall: jest.fn((_, __, ___, context) => context && context()) }
        };
        handler = new EnemyHandler(scene);
        jest.spyOn(AudioManager, 'playDestroySound').mockImplementation(() => {});
        jest.spyOn(AudioManager, 'playDamageSound').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('hitEnemy should destroy enemy and play destroy sound when invincible', () => {
        scene.isInvincible = true;

        handler.hitEnemy(player, enemy);

        expect(enemy.destroy).toHaveBeenCalled();
        expect(scene.sparkEmitter.emitParticleAt).toHaveBeenCalledWith(enemy.x, enemy.y, 20);
        expect(AudioManager.playDestroySound).toHaveBeenCalled();
        expect(AudioManager.playDamageSound).not.toHaveBeenCalled();
    });

    test('hitEnemy should damage player when not invincible', () => {
        handler.hitEnemy(player, enemy);

        expect(AudioManager.playDamageSound).toHaveBeenCalled();
        expect(player.setTint).toHaveBeenCalledWith(0xff0000);
        expect(scene.cameras.main.shake).toHaveBeenCalledWith(100, 0.01);
        expect(player.setVelocity).toHaveBeenCalledWith(expect.any(Number), 300);
    });
});
