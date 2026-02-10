import AudioSystem from '../../Core/AudioSystem.js';
import { Coin, COIN_BASE_SIZE } from '../../../Entities/Coin.js';
import { POWERUP_BASE_SIZE } from '../../../Entities/Powerup.js';
import { clampToPlayableBounds } from '../../../Utils/playableBounds.js';
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

        // Spawn item towards the center to avoid wall clipping
        const baseX = trashcan.body?.center?.x ?? trashcan.x;
        const isLeft = baseX < this.scene.scale.width / 2;
        const spawnOffset = 0;
        const itemSize = Math.max(COIN_BASE_SIZE, POWERUP_BASE_SIZE);
        const spawnX = clampToPlayableBounds(this.scene, baseX + spawnOffset, itemSize, 0);
        const spawnY = trashcan.y - 35;

        let item;
        let group;

        if (Math.random() < 0.05) {
            // 5% Powerup
            item = this.scene.powerupPool.spawn(spawnX, spawnY);
            group = this.scene.powerups;

            // Fallback: If powerup fails to spawn (pool empty?), spawn a Coin instead
            if (!item) {
                item = this.scene.coinPool.spawn(spawnX, spawnY);
                group = this.scene.coins;
            }
        } else {
            // 95% Coin
            item = this.scene.coinPool.spawn(spawnX, spawnY);
            group = this.scene.coins;
        }

        // Final fallback: ensure a coin is spawned if pools fail unexpectedly
        if (!item && this.scene.coins) {
            item = new Coin(this.scene);
            item.spawn(spawnX, spawnY);
            group = this.scene.coins;
        }

        if (item) {
            if (group && !group.contains(item)) {
                group.add(item, true);
            }

            item.setData('ignoreCollection', true);

            const obstacles = [this.scene.stageFloor, this.scene.leftWall, this.scene.rightWall];

            // Fix: Always launch towards the CENTER of the screen (Safe Zone)
            // Instead of aiming at player (who might be near a wall), aim at the middle.
            const launchOffset = isLeft ? 120 : -120;
            const targetX = clampToPlayableBounds(this.scene, baseX + launchOffset, itemSize, 0);

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
