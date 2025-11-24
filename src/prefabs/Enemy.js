import { enablePlatformRider, updatePlatformRider } from '../utils/platformRider.js';

export class PatrolEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_spike');
        this.setDepth(20);

        // Use 'bound' mode: platformRider only provides bounds, we handle movement
        enablePlatformRider(this, { mode: 'bound', marginX: 5 });

        this.patrolSpeed = 60;
        this.patrolDir = 1; // 1 = right, -1 = left
    }

    spawn(x, y) {
        this.body.reset(x, y);
        this.body.allowGravity = true;
        this.setGravityY(1200);
        this.body.immovable = false;
        this.setActive(true);
        this.setVisible(true);
        this.setDepth(20);
        this.setVelocityX(0);

        // Pop-in effect
        this.setScale(0);
        this.scene.tweens.add({ targets: this, scale: 1, duration: 400, ease: 'Back.out' });
    }

    patrol(minX, maxX, speed = 60) {
        this.minX = minX;
        this.maxX = maxX;
        this.patrolSpeed = speed;
        this.setVelocityX(speed);
    }

    stopMoving() {
        this.setVelocityX(0);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // 1) Update platform info and bounds (minX/maxX)
        updatePlatformRider(this);

        // 2) Patrol logic ONLY if on a platform
        if (this.body.blocked.down && this.ridingPlatform) {
            const pBody = this.ridingPlatform.body || { velocity: { x: 0 } };
            const platformVel = pBody.velocity ? pBody.velocity.x : 0;

            // Calculate velocity: platform velocity + patrol velocity
            const base = this.patrolSpeed * this.patrolDir;
            this.setVelocityX(platformVel + base);

            // Respect bounds
            if (this.x >= this.maxX) {
                this.x = this.maxX;
                this.patrolDir = -1;
                this.setFlipX(true);
            } else if (this.x <= this.minX) {
                this.x = this.minX;
                this.patrolDir = 1;
                this.setFlipX(false);
            }

            // Check for wall collisions
            if (this.body.blocked.left) {
                this.patrolDir = 1;
                this.setFlipX(false);
            } else if (this.body.blocked.right) {
                this.patrolDir = -1;
                this.setFlipX(true);
            }
        } else {
            // In air or no platform: STOP running to prevent falling off
            this.setVelocityX(0);
        }

        // 3) Cleanup offscreen enemies
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
        this.setDepth(20);

        this.shootEvent = null;
        this.recoilTween = null;

        // Use 'carry' mode: only follow platform, no movement
        enablePlatformRider(this, { mode: 'carry', marginX: 5 });
    }

    spawn(x, y) {
        this.body.reset(x, y);
        this.body.allowGravity = true;
        this.setGravityY(1200);
        this.body.immovable = false;
        this.setActive(true);
        this.setVisible(true);
        this.setDepth(20);

        // 6. Tweens for Dynamic Enemies: Pop-in effect
        this.setScale(0);
        this.scene.tweens.add({ targets: this, scale: 1, duration: 400, ease: 'Back.out' });
    }

    startShooting(projectilesGroup, currentHeight = 0) {
        if (this.shootEvent) this.shootEvent.remove();

        // Difficulty Progression (Issue 6)
        let minDelay = 1500;
        let maxDelay = 3000;

        if (currentHeight > 6000) { minDelay = 800; maxDelay = 1500; }
        else if (currentHeight > 4000) { minDelay = 1000; maxDelay = 2000; }

        let delay = Phaser.Math.Between(minDelay, maxDelay);
        this.shootEvent = this.scene.time.addEvent({
            delay: delay,
            callback: () => {
                try {
                    if (!this.active) {
                        if (this.shootEvent) this.shootEvent.remove();
                        return;
                    }
                    this.shoot(projectilesGroup, currentHeight);

                    // Update delay for next shot
                    let nextMin = minDelay;
                    let nextMax = maxDelay;
                    if (this.scene.currentHeight > 6000) { nextMin = 800; nextMax = 1500; }
                    else if (this.scene.currentHeight > 4000) { nextMin = 1000; nextMax = 2000; }

                    if (this.shootEvent) this.shootEvent.delay = Phaser.Math.Between(nextMin, nextMax);
                } catch (e) {
                    console.warn('Error in shooter callback:', e);
                }
            },
            loop: true
        });
    }

    shoot(projectilesGroup, currentHeight = 0) {
        if (!this.scene.player.active || !this.active) return;

        try {
            let direction = (this.scene.player.x < this.x) ? -1 : 1;

            // Determine shot count based on height (Issue 6)
            let shotCount = 1;
            if (currentHeight > 5000) shotCount = 3;
            else if (currentHeight > 4000) shotCount = 2;

            const fireShot = (offsetY = 0, angleOffset = 0) => {
                let proj = projectilesGroup.get(this.x + (15 * direction), this.y + offsetY);
                if (proj) {
                    // We might need to adjust Projectile.fire to accept angle if we want spread
                    // For now, just vertical offset or rapid fire
                    proj.fire(this.x + (15 * direction), this.y + offsetY, direction);
                }
            };

            // Fire shots
            fireShot(0);

            if (shotCount >= 2) {
                this.scene.time.delayedCall(150, () => {
                    if (this.active) fireShot(0);
                });
            }

            if (shotCount >= 3) {
                this.scene.time.delayedCall(300, () => {
                    if (this.active) fireShot(0);
                });
            }

            if (this.recoilTween) this.recoilTween.remove();
            // Use scaleX for recoil effect instead of moving position
            this.recoilTween = this.scene.tweens.add({
                targets: this,
                scaleX: 0.9,
                duration: 50,
                yoyo: true,
                onComplete: () => this.setScale(1)
            });

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

        // Update platform rider behavior
        updatePlatformRider(this);

        // Cleanup offscreen
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

        // Use 'carry' mode: only follow platform, jumping is handled separately
        enablePlatformRider(this, { mode: 'carry', marginX: 5 });
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

        // 6. Tweens for Dynamic Enemies: Pop-in effect
        this.setScale(0);
        this.scene.tweens.add({ targets: this, scale: 1, duration: 400, ease: 'Back.out' });
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

        // Update platform rider behavior
        updatePlatformRider(this);

        // Cleanup offscreen
        if (this.y > this.scene.player.y + 900) {
            this.stopBehavior();
            this.setActive(false);
            this.setVisible(false);
        }
    }
}
