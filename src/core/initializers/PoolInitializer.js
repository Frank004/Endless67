import PoolManager, { poolRegistry } from '../PoolManager.js';
import { Platform } from '../../prefabs/Platform.js';
import { Coin } from '../../prefabs/Coin.js';
import { Powerup } from '../../prefabs/Powerup.js';
import { PatrolEnemy, ShooterEnemy, JumperShooterEnemy } from '../../prefabs/Enemy.js';
import { Projectile } from '../../prefabs/Projectile.js';
import { POOL } from '../../config/GameConstants.js';

export class PoolInitializer {
    /**
     * Initializes object pools and physics groups.
     * @param {Phaser.Scene} scene 
     */
    static init(scene) {
        // --- POOLS ---
        scene.platformPool = new PoolManager(scene, 'platforms', Platform, POOL.INITIAL_SIZE.PLATFORMS || 20, POOL.GROW_SIZE || 5);
        poolRegistry.register('platforms', scene.platformPool);

        scene.coinPool = new PoolManager(scene, 'coins', Coin, POOL.INITIAL_SIZE.COINS || 20, POOL.GROW_SIZE || 5);
        poolRegistry.register('coins', scene.coinPool);

        scene.powerupPool = new PoolManager(scene, 'powerups', Powerup, 10, POOL.GROW_SIZE || 3);
        poolRegistry.register('powerups', scene.powerupPool);

        scene.patrolEnemyPool = new PoolManager(scene, 'patrolEnemies', PatrolEnemy, POOL.INITIAL_SIZE.ENEMIES || 10, POOL.GROW_SIZE || 5);
        poolRegistry.register('patrolEnemies', scene.patrolEnemyPool);

        scene.shooterEnemyPool = new PoolManager(scene, 'shooterEnemies', ShooterEnemy, POOL.INITIAL_SIZE.ENEMIES || 10, POOL.GROW_SIZE || 5);
        poolRegistry.register('shooterEnemies', scene.shooterEnemyPool);

        scene.jumperShooterEnemyPool = new PoolManager(scene, 'jumperShooterEnemies', JumperShooterEnemy, POOL.INITIAL_SIZE.ENEMIES || 10, POOL.GROW_SIZE || 5);
        poolRegistry.register('jumperShooterEnemies', scene.jumperShooterEnemyPool);

        scene.projectilePool = new PoolManager(scene, 'projectiles', Projectile, POOL.INITIAL_SIZE.PROJECTILES || 15, POOL.GROW_SIZE || 5);
        poolRegistry.register('projectiles', scene.projectilePool);

        // --- GROUPS ---
        scene.platforms = scene.physics.add.group({ allowGravity: false, immovable: true });
        scene.coins = scene.physics.add.group({ allowGravity: false, immovable: true, runChildUpdate: true, classType: Coin });
        scene.powerups = scene.physics.add.group({ allowGravity: false, immovable: true, runChildUpdate: true, classType: Powerup });

        scene.patrolEnemies = scene.physics.add.group({ classType: PatrolEnemy, allowGravity: true, immovable: false, runChildUpdate: true });
        scene.shooterEnemies = scene.physics.add.group({ classType: ShooterEnemy, allowGravity: false, immovable: true, runChildUpdate: true });
        scene.jumperShooterEnemies = scene.physics.add.group({ classType: JumperShooterEnemy, allowGravity: true, immovable: false, runChildUpdate: true });

        scene.projectiles = scene.physics.add.group({
            classType: Projectile,
            allowGravity: false,
            runChildUpdate: true,
            maxSize: 50
        });

        scene.mazeWalls = scene.physics.add.staticGroup();
    }
}
