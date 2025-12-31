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
