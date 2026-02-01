/**
 * SafetyPlatform
 * A temporary platform that spawns during player revive to ensure safe landing.
 * Features teleport-in effect and auto-destruction after a set duration.
 */
export class SafetyPlatform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Create texture if it doesn't exist
        if (!scene.textures.exists('safety_platform_tex')) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0x00ffff, 1);
            graphics.fillRect(0, 0, 32, 5); // 32px wide x 5px height
            graphics.generateTexture('safety_platform_tex', 32, 5);
        }

        // CLAMP POSITION TO GAME BOUNDS
        const WALL_WIDTH = 32; // from WALLS.WIDTH
        const screenWidth = scene.scale.width;
        const minX = WALL_WIDTH + 16; // Half platform width
        const maxX = screenWidth - WALL_WIDTH - 16;
        const clampedX = Phaser.Math.Clamp(x, minX, maxX);

        super(scene, clampedX, y, 'safety_platform_tex');

        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Setup physics
        this.body.allowGravity = false;
        this.body.immovable = true;

        // Visual setup
        this.setOrigin(0.5, 0); // Top-center origin
        this.setAlpha(0); // Start invisible
        this.setScale(0); // Start scaled down

        // Lifecycle: Countdown (3.5s) + 1.5s after GO
        this.totalLife = 3500 + 1500; // Updated to 1.5s grace period
        this.collider = null;
    }

    /**
     * Spawns the platform with teleport effect
     * @param {Phaser.GameObjects.GameObject} player - Player to create collider with
     * @param {number} playerDepth - Player depth for z-ordering
     */
    spawn(player, playerDepth) {
        this.setDepth(playerDepth - 1); // Behind player

        // Add collider with player
        this.collider = this.scene.physics.add.collider(player, this);

        console.log(`🛡️ [SafetyPlatform] Created at ${this.x},${this.y}`);

        // TELEPORT EFFECT - Platform materializes
        this.scene.tweens.add({
            targets: this,
            alpha: 0.25, // Semi-transparent
            scale: 1,
            duration: 300,
            ease: 'Back.out'
        });

        // Schedule destruction
        this.scene.time.delayedCall(this.totalLife, () => {
            this.destroy();
        });
    }

    /**
     * Cleanup on destroy
     */
    destroy() {
        if (this.active) {
            // Fade out
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    console.log('🛡️ [SafetyPlatform] Destroyed');
                    if (this.collider) {
                        this.scene.physics.world.removeCollider(this.collider);
                    }
                    super.destroy();
                }
            });
        }
    }
}
