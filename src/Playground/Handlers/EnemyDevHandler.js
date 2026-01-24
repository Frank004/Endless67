import { DevHandler } from './DevHandler.js';

export class EnemyDevHandler extends DevHandler {
    getCategoryLabel() {
        return 'Enemies';
    }

    getIcon() {
        return 'alien';
    }

    getItems() {
        return [
            { icon: 'alien', label: 'Patrol', callback: () => this.spawnEnemy('patrol'), type: 'single' },
            { icon: 'sword', label: 'Shooter (2-Shot)', callback: () => this.spawnEnemy('shooter', 2), type: 'single' },
            { icon: 'crosshair', label: 'Shooter (3-Shot)', callback: () => this.spawnEnemy('shooter', 3), type: 'single' },
            { icon: 'flashlight', label: 'Fast Shooter', callback: () => this.spawnEnemy('shooter-fast'), type: 'single' },
            { icon: 'arrow-up', label: 'Jumper', callback: () => this.spawnEnemy('jumper'), type: 'single' }
        ];
    }

    spawnEnemy(type, shots = 2) {
        const scene = this.scene;
        console.log(`[Dev] spawnEnemy requested: ${type}, shots: ${shots}`);

        const y = scene.player.y - 200;
        const gameWidth = scene.cameras.main.width;
        const wallWidth = 32;
        const minX = wallWidth + 40;
        const maxX = gameWidth - wallWidth - 40;
        const x = Phaser.Math.Between(minX, maxX);

        // ALWAYS CREATE PLATFORM
        const platformY = y + 50;
        const platform = scene.platforms.create(x, platformY, 'platform');
        platform.setDisplaySize(120, 32);
        platform.refreshBody();
        platform.setImmovable(true);
        platform.setData('isPermanentFloor', false);
        console.log(`[Dev] Spawned platform at ${x}, ${platformY}`);

        const spawnY = platformY - 40;

        if (type === 'patrol') {
            const enemy = scene.patrolEnemies.get(x, spawnY);
            if (enemy) {
                enemy.spawn(x, spawnY);
                if (enemy.body) enemy.setCollideWorldBounds(true);
            }
        } else if (type === 'shooter') {
            const enemy = scene.shooterEnemies.get(x, spawnY);
            if (enemy) {
                enemy.spawn(x, spawnY);
                enemy.projectileCount = shots;
                if (enemy.body) {
                    enemy.body.setAllowGravity(true);
                    enemy.setCollideWorldBounds(true);
                }
                if (typeof enemy.startShooting === 'function') {
                    enemy.startShooting(scene.projectiles, scene.currentHeight);
                } else if (!enemy.shootTimer) {
                    // Manual logic fallback
                    enemy.shootTimer = scene.time.addEvent({
                        delay: 2000,
                        callback: () => {
                            if (!enemy.active) return;
                            console.log('[Dev] Shooter firing (fallback)');
                        },
                        loop: true
                    });
                }
            }
        } else if (type === 'shooter-fast') {
            const enemy = scene.shooterEnemies.get(x, spawnY);
            if (enemy) {
                enemy.spawn(x, spawnY);
                enemy.setTint(0xff0000);
                enemy.projectileCount = 2;
                enemy.shootInterval = 1000;
                if (enemy.body) {
                    enemy.body.setAllowGravity(true);
                    enemy.setCollideWorldBounds(true);
                }
                if (typeof enemy.startShooting === 'function') {
                    enemy.startShooting(scene.projectiles, scene.currentHeight);
                }
            }
        } else if (type === 'jumper') {
            const enemy = scene.jumperShooterEnemies.get(x, spawnY);
            if (enemy) {
                enemy.spawn(x, spawnY);
                if (enemy.body) {
                    enemy.body.setAllowGravity(true);
                    enemy.setCollideWorldBounds(true);
                }
                if (typeof enemy.startBehavior === 'function') {
                    enemy.startBehavior(scene.projectiles);
                }
            }
        }
    }
}
