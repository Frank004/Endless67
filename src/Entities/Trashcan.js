import { ASSETS } from '../Config/AssetKeys.js';

export class Trashcan extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        const textureKey = scene.textures.exists(ASSETS.PROPS) ? ASSETS.PROPS : null;
        super(scene, x, y, textureKey || undefined, textureKey ? 'transcan.png' : undefined);
        this.scene = scene;

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // static body

        this.setOrigin(0.5, 1);
        this.setDepth(30); // Foreground (Above Player 20)

        if (this.body) {
            this.body.setSize(23, 32);
            this.body.setOffset(-1, 0);
        }

        this.setData('collisionEnabled', true);
    }

    enableCollision(enabled = true) {
        this.setData('collisionEnabled', enabled);
    }

    isCollisionEnabled() {
        return this.getData('collisionEnabled') === true;
    }

    playHit() {
        this.enableCollision(false);
        if (this.scene.anims.exists('trashcan_hit')) {
            this.play('trashcan_hit');
        }
    }
}
