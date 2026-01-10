import { DevHandler } from './DevHandler.js';
import { enablePlatformRider } from '../../utils/platformRider.js';
import { WALLS } from '../../config/GameConstants.js';

export class ItemDevHandler extends DevHandler {
    getCategoryLabel() {
        return 'Items';
    }

    getIcon() {
        return 'stack';
    }

    getItems() {
        return [
            { icon: 'shield', label: 'Powerup', callback: () => this.spawnPowerup('shield'), type: 'single' },
            { icon: 'money', label: 'Coin', callback: () => this.spawnPowerup('coin'), type: 'single' }
        ];
    }

    spawnPowerup(type) {
        const scene = this.scene;
        console.log('[Dev] spawnPowerup called:', type);

        const y = scene.player.y - 200;
        const gameWidth = scene.cameras.main.width;

        // Ensure platform is spawned strictly within walls with a visual gap
        // Platform width is 80, so half-width is 40.
        // Wall width is WALLS.WIDTH.
        // We want a safe buffer (e.g. 50px - drastic increase)
        const halfPlat = 40;
        const buffer = 50;
        const wallW = WALLS.WIDTH || 32;
        const minX = wallW + halfPlat + buffer;
        const maxX = gameWidth - wallW - halfPlat - buffer;

        console.log(`[DevDebug] gameW:${gameWidth}, wallW:${wallW}, minX:${minX}, maxX:${maxX}`);

        const x = Phaser.Math.Between(minX, maxX);

        // CREATE PLATFORM
        const platformY = y + 50;
        const platform = scene.platforms.create(x, platformY, 'platform');
        platform.setDisplaySize(80, 24);
        platform.refreshBody();
        platform.setImmovable(true);
        if (platform.body) {
            platform.body.setAllowGravity(false);
            platform.body.setVelocity(0, 0);
            platform.body.moves = false; // Force truly static behavior
        }
        platform.setData('isPermanentFloor', false);
        console.log(`[Dev] Spawned Item Platform at ${x}, ${platformY}`);

        const spawnY = platformY - 30;

        let item = null;
        if (type === 'shield') {
            item = scene.powerups.create(x, spawnY, 'powerup_ball');
        } else if (type === 'coin') {
            item = scene.coins.create(x, spawnY, 'coin');
        }

        if (item) {
            console.log('[Dev] spawnPowerup created item:', item, 'at', x, spawnY);
            item.setDepth(20);
            item.setVisible(true);

            if (item.body) {
                item.body.setAllowGravity(true);
                item.body.setCollideWorldBounds(true);
                scene.physics.add.collider(item, scene.platforms);
            }
        } else {
            console.error('[Dev] spawnPowerup FAILED to create item for type:', type);
        }
    }
}
