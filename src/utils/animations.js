/**
 * Registro centralizado de animaciones.
 * Define animaciones solo si no existen para evitar duplicados.
 */

export function registerCoinAnimation(scene) {
    const anims = scene.anims;
    if (!anims || anims.exists('coin_spin')) return;
    if (!scene.textures.exists('coins')) return;

    const frames = anims.generateFrameNames('coins', {
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
    if (!scene.textures.exists('basketball')) return;

    const frameOrder = ['basketball 1.png', 'basketball 2.png', 'basketball 3.png'];
    const texture = scene.textures.get('basketball');
    const frames = frameOrder
        .filter(name => texture?.has(name))
        .map(frame => ({ key: 'basketball', frame }));
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
    if (!scene.textures.exists('props')) return;

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
    const texture = scene.textures.get('props');
    const frames = frameOrder
        .filter(name => texture?.has(name))
        .map(frame => ({ key: 'props', frame }));
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
    if (!scene.textures.exists('props')) return;

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
    const texture = scene.textures.get('props');
    const frames = frameOrder
        .filter(name => texture?.has(name))
        .map(frame => ({ key: 'props', frame }));
    if (!frames.length) return;

    anims.create({
        key: 'tire_bounce',
        frames,
        frameRate: 20,
        repeat: 0
    });
}
