export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setGravityY(1200);
        this.setMaxVelocity(300, 1000); // Reduced from 400
        this.setDragX(1200);
        this.setCollideWorldBounds(false);
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
        // Clamp position
        this.x = Phaser.Math.Clamp(this.x, 14, 386);

        if (!this.body.touching.down) {
            this.currentPlatform = null;
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
            // Touch movement
            // Calculate diff from anchor
            // This part needs the anchor from the scene or passed in. 
            // To keep it simple, let's assume the scene handles the anchor logic and passes the diff or acceleration.
            // Actually, let's refactor this. The scene handles input, Player just handles physics.
        } else {
            this.setAccelerationX(0);
            if (this.currentPlatform && this.currentPlatform.getData('isMoving')) {
                this.setVelocityX(this.currentPlatform.body.velocity.x);
            }
        }
    }

    move(direction) {
        const force = 900; // Reduced from 1200
        this.setAccelerationX(direction * force);
    }

    stop() {
        this.setAccelerationX(0);
        if (this.currentPlatform && this.currentPlatform.getData('isMoving')) {
            this.setVelocityX(this.currentPlatform.body.velocity.x);
        }
    }

    jump(boost = 1.0) {
        // Wall Jump Left
        if (this.body.touching.left) {
            if (this.checkWallStamina('left')) {
                this.setVelocity(400 * boost, -580 * boost);
                this.jumps = 1;
                return { type: 'wall_jump', x: this.x - 10, y: this.y };
            }
            return null;
        }

        // Wall Jump Right
        if (this.body.touching.right) {
            if (this.checkWallStamina('right')) {
                this.setVelocity(-400 * boost, -580 * boost);
                this.jumps = 1;
                return { type: 'wall_jump', x: this.x + 10, y: this.y };
            }
            return null;
        }

        // Normal / Double Jump
        if (this.jumps < this.maxJumps) {
            let type = this.jumps === 0 ? 'jump' : 'double_jump';
            if (this.jumps > 0) this.doFrontFlip();

            this.setVelocityY(-550 * boost);
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
        if (this.lastWallTouched === wallSide && this.wallJumpConsecutive >= 5) {
            if (this.body.velocity.y > 0) this.setVelocityY(400);
            this.setTint(0x555555);
            return;
        }
        if (this.body.velocity.y > 0) this.setVelocityY(80);

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
