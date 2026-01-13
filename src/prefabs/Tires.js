import { ASSETS } from '../config/AssetKeys.js';

export class Tires extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        const textureKey = scene.textures.exists(ASSETS.PROPS) ? ASSETS.PROPS : null;
        super(scene, x, y, textureKey || undefined, textureKey ? 'tires.png' : undefined);
        this.scene = scene;

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static body

        this.setOrigin(0.5, 1);
        this.setDepth(30); // Foreground (Above Player 20)

        // Body tuned to the top surface to make bounce detection easier
        if (this.body) {
            this.body.setSize(36, 18);  // ancho más generoso para captar al jugador
            // Posicionar el hitbox en la parte superior de la llanta
            this.body.setOffset(-18, -18);
        }

        this.lastBounceTime = 0;
        this.bounceCooldown = 200; // ms
    }

    canBounce(now) {
        return (now - this.lastBounceTime) >= this.bounceCooldown;
    }

    onBounce(now) {
        this.lastBounceTime = now;
        this.playBounceAnim();
    }

    playBounceAnim() {
        const animKey = 'tire_bounce';
        if (this.scene.anims.exists(animKey)) {
            this.play(animKey);
        } else {
            this.setTexture(ASSETS.PROPS, 'tires.png');
        }
    }
}
