import AudioSystem from '../../Core/AudioSystem.js';
import { launchItem } from '../../../Utils/physicsUtils.js';

/**
 * TrashcanInteractable
 * 
 * Maneja la interacción del player con el trashcan
 */
export class TrashcanInteractable {
    constructor(scene, trashcan) {
        this.scene = scene;
        this.trashcan = trashcan;
        this.active = true;
        this.hasTriggered = false;
    }

    /**
     * Callback cuando el player colisiona con el trashcan
     * @param {Phaser.GameObjects.Sprite} player 
     * @param {Phaser.GameObjects.Sprite} trashcan 
     */
    onCollision(player, trashcan) {
        if (this.hasTriggered) return;
        if (!trashcan.isCollisionEnabled || !trashcan.isCollisionEnabled()) return;
        if (trashcan.getData && !trashcan.getData('collisionEnabled')) return;

        this.hasTriggered = true;

        // Disable collision immediately
        if (trashcan.enableCollision) {
            trashcan.enableCollision(false);
        } else {
            trashcan.setData('collisionEnabled', false);
        }

        // Increase depth
        trashcan.setDepth(25);

        // Play animation
        if (trashcan.playHit) {
            trashcan.playHit();
        } else if (this.scene.anims.exists('trashcan_hit')) {
            trashcan.play('trashcan_hit');
        }

        // Play SFX
        AudioSystem.playTrashcanHit();

        // Spawn item (Coin or Powerup)
        const spawnX = trashcan.x - 25;
        const spawnY = trashcan.y - 35;

        let item;
        let group;

        if (Math.random() < 0.05) {
            // 5% Powerup
            item = this.scene.powerupPool.spawn(spawnX, spawnY);
            group = this.scene.powerups;
        } else {
            // 95% Coin
            item = this.scene.coinPool.spawn(spawnX, spawnY);
            group = this.scene.coins;
        }

        if (item) {
            if (group && !group.contains(item)) {
                group.add(item, true);
            }

            item.setData('ignoreCollection', true);

            const obstacles = [this.scene.stageFloor, this.scene.leftWall, this.scene.rightWall];
            let targetX = player.x;
            if (Math.abs(player.x - trashcan.x) < 50) {
                targetX = this.scene.scale.width / 2;
            }

            launchItem(this.scene, item, targetX, obstacles);

            this.scene.time.delayedCall(600, () => {
                if (item.active) {
                    item.setData('ignoreCollection', false);
                }
            });
        }

        // Apply knockback
        const playerVX = player.body?.velocity?.x || 0;
        const dir = playerVX >= 0 ? -1 : 1;
        const knockbackX = dir * Phaser.Math.Between(600, 700);
        const knockbackY = -250;
        player.setVelocity(knockbackX, knockbackY);

        // Enter hit state
        const controller = player?.controller;
        if (controller?.enterHit) {
            controller.enterHit(200);
        }

        // Visual feedback
        player.setTint(0xff8800);
        this.scene.time.delayedCall(200, () => player.clearTint());
        this.scene.cameras.main.shake(100, 0.01);
    }

    onDestroy() {
        this.active = false;
    }
}
