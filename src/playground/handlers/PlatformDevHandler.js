import { DevHandler } from './DevHandler.js';

export class PlatformDevHandler extends DevHandler {
    getCategoryLabel() {
        return 'Platforms';
    }

    getIcon() {
        return 'masonry';
    }

    getItems() {
        return [
            { icon: 'masonry', label: 'Static', callback: (mode) => this.spawnPlatform('static', mode), type: 'dual' },
            { icon: 'arrow-left', label: 'Moving (Slow)', callback: (mode) => this.spawnPlatform('moving-slow', mode), type: 'dual' },
            { icon: 'flashlight', label: 'Moving (Fast)', callback: (mode) => this.spawnPlatform('moving-fast', mode), type: 'dual' },
            { icon: 'route', label: 'Zigzag', callback: (mode) => this.spawnPlatform('zigzag', mode), type: 'dual' }
        ];
    }

    spawnPlatform(type, mode = 'clean') {
        const scene = this.scene;
        const startY = scene.player.y - 100;
        const centerX = scene.cameras.main.centerX;

        // Note: In Playground.js, it invoked `this.levelManager.spawnPlatform`
        // But since we disabled levelManager updates, we might want to manually create them
        // OR rely on levelManager helpers if they are stateless. 
        // `levelManager.spawnPlatform` creates logic like tweens.
        // Let's assume LevelManager helper methods work fine even if `update` is disabled.

        if (type === 'static') {
            scene.levelManager.spawnPlatform(centerX, startY, 140, false);
            if (mode === 'prepopulate') {
                this.spawnRandomOnPlatform(centerX, startY);
            }
        } else if (type === 'moving-slow') {
            scene.levelManager.spawnPlatform(centerX, startY, 140, true, 80);
            if (mode === 'prepopulate') {
                this.spawnRandomOnPlatform(centerX, startY);
            }
        } else if (type === 'moving-fast') {
            scene.levelManager.spawnPlatform(centerX, startY, 140, true, 150);
            if (mode === 'prepopulate') {
                this.spawnRandomOnPlatform(centerX, startY);
            }
        } else if (type === 'zigzag') {
            const gameWidth = scene.cameras.main.width;
            const wallWidth = 32;
            const minX = wallWidth + 28;
            const maxX = gameWidth - wallWidth - 28;

            const leftX = minX + (centerX - minX) * 0.5;
            const rightX = centerX + (maxX - centerX) * 0.5;
            for (let i = 0; i < 6; i++) {
                const x = (i % 2 === 0) ? leftX : rightX;
                const y = startY - (i * 100);
                scene.levelManager.spawnPlatform(x, y, 100, false);
                if (mode === 'prepopulate') {
                    this.spawnRandomOnPlatform(x, y);
                }
            }
        }
    }

    spawnRandomOnPlatform(x, y) {
        // Quick helper to spawn something on the platform
        const scene = this.scene;
        if (Math.random() > 0.5) {
            scene.coins.create(x, y - 40, 'coin').setDepth(20).body.setAllowGravity(false);
        } else {
            // Patrol enemy
            const enemy = scene.patrolEnemies.get(x, y - 40);
            if (enemy) {
                enemy.spawn(x, y - 40);
                enemy.setCollideWorldBounds(true);
            }
        }
    }
}
