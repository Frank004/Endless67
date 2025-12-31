/**
 * ShootBehavior - simple scheduler + disparo básico
 */
export class ShootBehavior {
    constructor(enemy) {
        this.enemy = enemy;
        this.timer = null;
        this.projectilesGroup = null;
        this.minDelay = Math.floor(1200 * 0.85); // +15% velocidad
        this.maxDelay = Math.floor(2200 * 0.85);
        this.shotCount = 1; // configurable
    }

    startShooting(projectilesGroup, currentHeight = 0) {
        this.stopShooting();
        this.projectilesGroup = projectilesGroup;
        this.updateDifficulty(currentHeight);
        this.fireOnce();
        this.scheduleNext();
    }

    updateDifficulty(currentHeight = 0) {
        if (currentHeight > 6000) {
            this.minDelay = Math.floor(800 * 0.85);
            this.maxDelay = Math.floor(1400 * 0.85);
            this.shotCount = 3;
        } else if (currentHeight > 4000) {
            this.minDelay = Math.floor(1000 * 0.85);
            this.maxDelay = Math.floor(1800 * 0.85);
            this.shotCount = 2;
        } else {
            this.minDelay = Math.floor(1200 * 0.85);
            this.maxDelay = Math.floor(2200 * 0.85);
            this.shotCount = 1;
        }
    }

    scheduleNext() {
        if (this.timer) {
            this.timer.remove();
            this.timer = null;
        }
        if (!this.enemy.scene || !this.enemy.active) return;

        // Disparo anticipado: usar un delay más corto al entrar en escena
        const leadTime = Math.floor(this.minDelay * 0.5);
        const delay = Phaser.Math.Between(leadTime, this.maxDelay);
        this.timer = this.enemy.scene.time.addEvent({
            delay,
            loop: false,
            callback: () => {
                this.fireOnce();
                this.scheduleNext();
            }
        });
    }

    fireOnce() {
        if (!this.enemy.scene || !this.enemy.active || !this.enemy.scene.player || !this.enemy.scene.player.active) return;
        if (!this.projectilesGroup) return;

        const direction = (this.enemy.scene.player.x < this.enemy.x) ? -1 : 1;
        const x = this.enemy.x + (15 * direction);
        const y = this.enemy.y;

        let proj = null;
        if (typeof this.projectilesGroup.spawn === 'function') {
            proj = this.projectilesGroup.spawn(x, y, direction);
            if (!proj && this.projectilesGroup.grow) {
                this.projectilesGroup.grow(1);
                proj = this.projectilesGroup.spawn(x, y, direction);
            }
            if (proj && this.enemy.scene.projectiles) {
                this.enemy.scene.projectiles.add(proj, true);
            }
            if (proj?.body) {
                proj.body.setVelocityX(300 * direction);
                proj.body.setVelocityY(0);
            }
        } else if (typeof this.projectilesGroup.get === 'function') {
            proj = this.projectilesGroup.get(x, y);
            if (proj) {
                proj.fire(x, y, direction);
                if (proj.body) {
                    proj.body.setVelocityX(300 * direction);
                    proj.body.setVelocityY(0);
                }
            }
        }

        this.playRecoilEffect();

        // Disparos adicionales con pequeños delays si shotCount > 1
        if (this.shotCount >= 2) {
            this.enemy.scene.time.delayedCall(150, () => {
                if (this.enemy.active) this.fireOnce();
            });
        }
        if (this.shotCount >= 3) {
            this.enemy.scene.time.delayedCall(300, () => {
                if (this.enemy.active) this.fireOnce();
            });
        }
    }

    stopShooting() {
        if (this.timer) {
            this.timer.remove();
            this.timer = null;
        }
    }

    destroy() {
        this.stopShooting();
        this.projectilesGroup = null;
    }

    playRecoilEffect() {
        const scene = this.enemy.scene;
        if (!scene) return;
        scene.tweens.add({
            targets: this.enemy,
            scaleX: 0.9,
            duration: 50,
            yoyo: true,
            onComplete: () => {
                if (this.enemy && this.enemy.setScale) {
                    this.enemy.setScale(1);
                }
            }
        });
    }
}
