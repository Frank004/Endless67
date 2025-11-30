export class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        // Constructor sin posición inicial (se establecerá en spawn)
        super(scene, 0, 0, 'projectile');
        
        // Agregar a la escena y al physics world
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Inicialmente inactivo
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Método llamado cuando el objeto es spawneado del pool
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} direction - Dirección (-1 izquierda, 1 derecha)
     */
    spawn(x, y, direction) {
        if (!this.body) return; // Safety check
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setVelocityX(300 * direction);
        this.setDepth(21);
        this.setData('processed', false);
    }

    /**
     * Método legacy para compatibilidad (delega a spawn)
     * @deprecated Usar spawn() en su lugar
     */
    fire(x, y, direction) {
        this.spawn(x, y, direction);
    }

    /**
     * Método llamado cuando el objeto es devuelto al pool
     */
    despawn() {
        this.kill();
        
        // Remover del grupo legacy si existe
        if (this.scene && this.scene.projectiles) {
            this.scene.projectiles.remove(this);
        }
    }

    preUpdate(time, delta) {
        // Stop if not active or scene is gone
        if (!this.active || !this.scene) return;

        super.preUpdate(time, delta);

        // Out of bounds check - usar despawn si hay pool, sino kill()
        if (this.y > this.scene.player.y + 900 || this.x < -50 || this.x > 450) {
            if (this.scene.projectilePool) {
                this.scene.projectilePool.despawn(this);
            } else {
            this.kill();
            }
        }
    }

    kill() {
        this.setActive(false);
        this.setVisible(false);
        if (this.body) this.body.stop();
    }
}
