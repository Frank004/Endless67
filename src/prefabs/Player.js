export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setGravityY(1200);
        this.setMaxVelocity(300, 1000);
        this.setDragX(1200);
        this.setCollideWorldBounds(true); // Use Arcade Physics for bounds
        this.body.onWorldBounds = true;
        this.setDepth(20);

        // State
        this.jumps = 0;
        this.maxJumps = 3;
        this.lastWallTouched = null;
        this.wallJumpConsecutive = 0;
        this.currentPlatform = null;
        this.isInvincible = false;
    }

    update(cursors, movePointer, splitX, isMobile) {
        // World bounds now handled by Arcade Physics
        if (!this.body.touching.down) {
            this.currentPlatform = null;
        }

        // Check for wall interaction via World Bounds (blocked)
        if (this.body.blocked.left) {
            this.handleWallTouch('left');
        } else if (this.body.blocked.right) {
            this.handleWallTouch('right');
        }

        // Movement Logic
        let keyboardMove = 0;
        if (cursors.left.isDown) {
            keyboardMove = -1;
        } else if (cursors.right.isDown) {
            keyboardMove = 1;
        }

        const force = 900; // Reduced from 1200

        if (keyboardMove !== 0) {
            this.setAccelerationX(keyboardMove * force);
            return null; // Return null for joystick visual update
        } else if (movePointer) {
            // Touch movement logic handled by InputManager/Scene
        } else {
            this.setAccelerationX(0);
        }
    }

    move(direction) {
        const force = 900;
        this.setAccelerationX(direction * force);
    }

    stop() {
        this.setAccelerationX(0);
    }

    jump(boost = 1.0) {
        // Wall Jump Left (Touching wall on left or blocked by world bound on left)
        if (this.body.touching.left || this.body.blocked.left) {
            if (this.checkWallStamina('left')) {
                this.setVelocity(400 * boost, -600 * boost); // Increased Y
                this.jumps = 1;
                return { type: 'wall_jump', x: this.x - 10, y: this.y };
            }
            return null;
        }

        // Wall Jump Right (Touching wall on right or blocked by world bound on right)
        if (this.body.touching.right || this.body.blocked.right) {
            if (this.checkWallStamina('right')) {
                this.setVelocity(-400 * boost, -600 * boost); // Increased Y
                this.jumps = 1;
                return { type: 'wall_jump', x: this.x + 10, y: this.y };
            }
            return null;
        }

        // Normal / Double Jump
        if (this.jumps < this.maxJumps) {
            let type = this.jumps === 0 ? 'jump' : 'double_jump';
            if (this.jumps > 0) this.doFrontFlip();

            this.setVelocityY(-600 * boost); // Increased from -550 to reach 140px spacing
            this.jumps++;
            return { type: type, x: this.x, y: this.y + 12 };
        }

        return null;
    }

    checkWallStamina(side) {
        if (this.lastWallTouched !== side) {
            this.wallJumpConsecutive = 0;
            this.clearTint();
        }
        if (this.wallJumpConsecutive >= 5) return false;
        this.lastWallTouched = side;
        this.wallJumpConsecutive++;
        return true;
    }

    handleWallTouch(wallSide) {
        // If we are moving up, don't apply wall slide friction yet, let momentum carry us
        // unless we want to limit upward velocity? No, usually wall slide affects downward movement.

        if (this.lastWallTouched === wallSide && this.wallJumpConsecutive >= 5) {
            // Stamina depleted, slide down fast? Or just normal gravity?
            // If we want to punish, maybe no friction.
            // But let's keep the existing logic: if stamina depleted, maybe we slip?
            // The original code applied friction even if stamina depleted?
            // "if (this.body.velocity.y > 0) this.setVelocityY(400);" -> This limits falling speed (friction)

            // Wait, the original code said:
            // if (this.lastWallTouched === wallSide && this.wallJumpConsecutive >= 5) {
            //    if (this.body.velocity.y > 0) this.setVelocityY(400); 
            //    this.setTint(0x555555);
            //    return;
            // }
            // This means even with depleted stamina, we still slide but maybe faster (400 vs 80)?

            if (this.body.velocity.y > 0) this.setVelocityY(400); // Faster slide (less friction)
            this.setTint(0x555555);
            return;
        }

        // Normal Wall Slide Friction
        if (this.body.velocity.y > 0) this.setVelocityY(80); // Slow slide (high friction)

        if (this.lastWallTouched !== wallSide) {
            this.jumps = 0;
            this.clearTint();
            this.scene.tweens.killTweensOf(this);
            this.angle = 0;
        }
    }

    doFrontFlip() {
        this.scene.tweens.killTweensOf(this);
        this.angle = 0;
        this.scene.tweens.add({
            targets: this,
            angle: 360,
            duration: 400,
            ease: 'Cubic.easeOut'
        });
    }

    handleLand(floor) {
        if (this.body.touching.down) {
            this.jumps = 0;
            this.lastWallTouched = null;
            this.wallJumpConsecutive = 0;
            this.clearTint();
            this.angle = 0;
            this.currentPlatform = floor;
        }
    }
}
