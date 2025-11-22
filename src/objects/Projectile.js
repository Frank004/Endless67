export class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'projectile');
    }

    fire(x, y, direction) {
        if (!this.body) return; // Safety check
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setVelocityX(300 * direction);
        this.setDepth(21);
        this.setData('processed', false);
    }

    preUpdate(time, delta) {
        // Stop if not active or scene is gone
        if (!this.active || !this.scene) return;

        super.preUpdate(time, delta);

        // Out of bounds check
        if (this.y > this.scene.player.y + 900 || this.x < -50 || this.x > 450) {
            this.kill();
        }
    }

    kill() {
        this.setActive(false);
        this.setVisible(false);
        if (this.body) this.body.stop();
    }
}
