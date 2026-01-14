import { ASSETS } from '../config/AssetKeys.js';
/**

 * Registro centralizado de animaciones.
 * Define animaciones solo si no existen para evitar duplicados.
 */

export function registerCoinAnimation(scene) {
    const anims = scene.anims;
    if (!anims || anims.exists('coin_spin')) return;
    if (!scene.textures.exists(ASSETS.COINS)) return;

    const frames = anims.generateFrameNames(ASSETS.COINS, {
        start: 1,
        end: 8,
        zeroPad: 2,
        prefix: 'coin-',
        suffix: '.png'
    });
    if (!frames?.length) return;

    anims.create({
        key: 'coin_spin',
        frames,
        frameRate: 12,
        repeat: -1
    });
}

export function registerBasketballAnimation(scene) {
    const anims = scene.anims;
    if (!anims || anims.exists('basketball_spin')) return;
    if (!scene.textures.exists(ASSETS.BASKETBALL)) return;

    const frameOrder = ['basketball 1.png', 'basketball 2.png', 'basketball 3.png'];
    const texture = scene.textures.get(ASSETS.BASKETBALL);
    const frames = frameOrder
        .filter(name => texture?.has(name))
        .map(frame => ({ key: ASSETS.BASKETBALL, frame }));
    if (!frames.length) return;

    anims.create({
        key: 'basketball_spin',
        frames,
        frameRate: 8,
        repeat: -1
    });
}

export function registerTrashcanAnimation(scene) {
    const anims = scene.anims;
    if (!anims || anims.exists('trashcan_hit')) return;
    if (!scene.textures.exists(ASSETS.PROPS)) return;

    // Frame order from props.json: transcan_animation-01.png to transcan_animation-10.png
    const frameOrder = [
        'transcan_animation-01.png',
        'transcan_animation-02.png',
        'transcan_animation-03.png',
        'transcan_animation-04.png',
        'transcan_animation-05.png',
        'transcan_animation-06.png',
        'transcan_animation-07.png',
        'transcan_animation-08.png',
        'transcan_animation-09.png',
        'transcan_animation-10.png'
    ];
    const texture = scene.textures.get(ASSETS.PROPS);
    const frames = frameOrder
        .filter(name => texture?.has(name))
        .map(frame => ({ key: ASSETS.PROPS, frame }));
    if (!frames.length) return;

    anims.create({
        key: 'trashcan_hit',
        frames,
        frameRate: 15,
        repeat: 0 // Play once
    });
}

export function registerTireAnimation(scene) {
    const anims = scene.anims;
    if (!anims || anims.exists('tire_bounce')) return;
    if (!scene.textures.exists(ASSETS.PROPS)) return;

    // Frames from props.json (bounce sequence + regreso a idle)
    const frameOrder = [
        'tire-bounce1.png',
        'tire-bounce2.png',
        'tire-bounce3.png',
        'tire-bounce4.png',
        'tire-bounce5.png',
        'tire-bounce6.png',
        'tires.png'
    ];
    const texture = scene.textures.get(ASSETS.PROPS);
    const frames = frameOrder
        .filter(name => texture?.has(name))
        .map(frame => ({ key: ASSETS.PROPS, frame }));
    if (!frames.length) return;

    anims.create({
        key: 'tire_bounce',
        frames,
        frameRate: 20,
        repeat: 0
    });
}


export function registerEnemyAnimations(scene) {
    const anims = scene.anims;
    if (!anims) return;
    if (anims.exists('enemy_idle')) return;
    if (!scene.textures.exists(ASSETS.ENEMY_ATLAS)) return;

    anims.create({
        key: 'enemy_idle',
        frames: anims.generateFrameNames(ASSETS.ENEMY_ATLAS, {
            prefix: 'patrol-idle',
            start: 1,
            end: 4,
            suffix: '.png'
        }),
        frameRate: 8,
        repeat: -1
    });

    // Run
    anims.create({
        key: 'enemy_run',
        frames: anims.generateFrameNames(ASSETS.ENEMY_ATLAS, {
            prefix: 'patrol-run',
            start: 1,
            end: 6,
            suffix: '.png'
        }),
        frameRate: 10,
        repeat: -1
    });

    // Attack
    anims.create({
        key: 'enemy_attack',
        frames: anims.generateFrameNames(ASSETS.ENEMY_ATLAS, {
            prefix: 'patrol-attack',
            start: 1,
            end: 4,
            suffix: '.png'
        }),
        frameRate: 12,
        repeat: 0
    });

    // Die
    anims.create({
        key: 'enemy_die',
        frames: anims.generateFrameNames(ASSETS.ENEMY_ATLAS, {
            prefix: 'patrol-die',
            start: 1,
            end: 5,
            suffix: '.png'
        }),
        frameRate: 12,
        repeat: 0
    });

    // Jump
    anims.create({
        key: 'enemy_jump',
        frames: anims.generateFrameNames(ASSETS.ENEMY_ATLAS, {
            prefix: 'patrol-jump',
            start: 1,
            end: 8,
            suffix: '.png'
        }),
        frameRate: 12,
        repeat: 0
    });

    // Jumper Animations
    anims.create({
        key: 'jumper_idle',
        frames: anims.generateFrameNames(ASSETS.ENEMY_ATLAS, {
            prefix: 'jumper-idle',
            start: 1,
            end: 4,
            suffix: '.png'
        }),
        frameRate: 8,
        repeat: -1
    });

    anims.create({
        key: 'jumper_jump',
        frames: anims.generateFrameNames(ASSETS.ENEMY_ATLAS, {
            prefix: 'jumper-jump',
            start: 1,
            end: 7,
            suffix: '.png'
        }),
        frameRate: 12,
        repeat: 0
    });

    anims.create({
        key: 'jumper_attack',
        frames: anims.generateFrameNames(ASSETS.ENEMY_ATLAS, {
            prefix: 'jumper-attack',
            start: 1,
            end: 6,
            suffix: '.png'
        }),
        frameRate: 12,
        repeat: 0
    });
}

