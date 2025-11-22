export class SpikeEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_spike');
        // scene.add.existing(this); // Group handles this
        // scene.physics.add.existing(this); // Group handles this
        this.setDepth(20);
        this.moveTween = null;
    }

    spawn(x, y) {
        this.body.reset(x, y);
        this.body.allowGravity = true;
        this.setGravityY(1200);
        this.body.immovable = false;
        this.setActive(true);
        this.setVisible(true);
        this.setDepth(20);
    }

    startMoving(targetX, duration) {
        if (this.moveTween) this.moveTween.remove();
        this.moveTween = this.scene.tweens.add({
            targets: this,
            x: targetX,
            duration: duration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    stopMoving() {
        if (this.moveTween) {
            this.moveTween.remove();
            this.moveTween = null;
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.y > this.scene.player.y + 900) {
            this.stopMoving();
            this.setActive(false);
            this.setVisible(false);
        }
    }
}

export class ShooterEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_shooter');
        // scene.add.existing(this);
        // scene.physics.add.existing(this);
        this.setDepth(20);

        this.shootEvent = null;
        this.recoilTween = null;
    }

    spawn(x, y) {
        this.body.reset(x, y);
        this.body.allowGravity = true;
        this.setGravityY(1200);
        this.body.immovable = false;
        this.setActive(true);
        this.setVisible(true);
        this.setDepth(20);
    }

    startShooting(projectilesGroup) {
        if (this.shootEvent) this.shootEvent.remove();

        // Timer interno
        let delay = Phaser.Math.Between(1500, 3000);
        this.shootEvent = this.scene.time.addEvent({
            delay: delay,
            callback: () => {
                try {
                    if (!this.active) {
                        if (this.shootEvent) this.shootEvent.remove();
                        return;
                    }
                    this.shoot(projectilesGroup);
                    if (this.shootEvent) this.shootEvent.delay = Phaser.Math.Between(1500, 3000);
                } catch (e) {
                    console.warn('Error in shooter callback:', e);
                }
            },
            loop: true
        });
    }

    shoot(projectilesGroup) {
        if (!this.scene.player.active || !this.active) return;

        try {
            let direction = (this.scene.player.x < this.x) ? -1 : 1;

            // Use pooling
            let proj = projectilesGroup.get(this.x + (15 * direction), this.y);

            if (proj) {
                proj.fire(this.x + (15 * direction), this.y, direction);

                if (this.recoilTween) this.recoilTween.remove();
                this.recoilTween = this.scene.tweens.add({ targets: this, x: this.x - (5 * direction), duration: 50, yoyo: true });
            }
        } catch (error) {
            console.warn('Error shooting projectile:', error);
        }
    }

    stopShooting() {
        try {
            if (this.shootEvent) {
                this.shootEvent.remove();
                this.shootEvent = null;
            }
            if (this.recoilTween) {
                this.recoilTween.remove();
                this.recoilTween = null;
            }
        } catch (e) {
            console.warn('Error stopping shooter:', e);
            // Force nullify to prevent further errors
            this.shootEvent = null;
            this.recoilTween = null;
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.y > this.scene.player.y + 900) {
            this.stopShooting();
            this.setActive(false);
            this.setVisible(false);
        }
    }
}

export class JumperShooterEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_jumper_shooter');
        this.setDepth(20);

        this.jumpEvent = null;
        this.shootEvent = null;
    }

    spawn(x, y) {
        this.body.reset(x, y);
        this.body.allowGravity = true; // Needs gravity to jump
        this.setGravityY(1200); // Apply gravity since world gravity is 0
        this.body.immovable = false;   // Needs to move
        this.setCollideWorldBounds(false);
        this.setActive(true);
        this.setVisible(true);
        this.setDepth(20);
        this.setVelocityX(0);
    }

    startBehavior(projectilesGroup) {
        this.stopBehavior();

        // Jump Timer
        this.jumpEvent = this.scene.time.addEvent({
            delay: Phaser.Math.Between(1000, 2000),
            callback: () => {
                try {
                    if (!this.active) return;
                    // Debug log
                    // console.log('Jumper check:', this.body.touching.down, this.body.velocity.y);

                    // Check if touching down OR if velocity is near zero (stuck)
                    if (this.body && (this.body.touching.down || (Math.abs(this.body.velocity.y) < 10 && this.y < 800))) {
                        this.setVelocityY(-400); // Smaller jump
                    }
                } catch (e) {
                    console.warn('Error in jumper jump callback:', e);
                }
            },
            loop: true
        });

        // Shoot Timer
        this.shootEvent = this.scene.time.addEvent({
            delay: Phaser.Math.Between(1500, 2500), // More frequent
            callback: () => {
                try {
                    if (!this.active) return;
                    this.shoot(projectilesGroup);
                } catch (e) {
                    console.warn('Error in jumper shoot callback:', e);
                }
            },
            loop: true
        });
    }

    shoot(projectilesGroup) {
        if (!this.scene.player.active || !this.active) return;

        try {
            let direction = (this.scene.player.x < this.x) ? -1 : 1;
            let proj = projectilesGroup.get(this.x + (15 * direction), this.y);

            if (proj) {
                proj.fire(this.x + (15 * direction), this.y, direction);
            }
        } catch (error) {
            console.warn('Error shooting projectile:', error);
        }
    }

    stopBehavior() {
        try {
            if (this.jumpEvent) { this.jumpEvent.remove(); this.jumpEvent = null; }
            if (this.shootEvent) { this.shootEvent.remove(); this.shootEvent = null; }
        } catch (e) {
            console.warn('Error stopping jumper behavior:', e);
            this.jumpEvent = null;
            this.shootEvent = null;
        }
    }

    destroy(fromScene) {
        this.stopBehavior();
        super.destroy(fromScene);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.y > this.scene.player.y + 900) {
            this.stopBehavior();
            this.setActive(false);
            this.setVisible(false);
        }
    }
}
