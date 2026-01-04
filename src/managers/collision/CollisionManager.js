import { PlayerHandler } from './PlayerHandler.js';
import { EnemyHandler } from './EnemyHandler.js';
import { ItemHandler } from './ItemHandler.js';
import { ProjectileHandler } from './ProjectileHandler.js';

export class CollisionManager {
    constructor(scene) {
        this.scene = scene;
        this.playerHandler = new PlayerHandler(scene);
        this.enemyHandler = new EnemyHandler(scene);
        this.itemHandler = new ItemHandler(scene);
        this.projectileHandler = new ProjectileHandler(scene);
    }

    setupCollisions() {
        const { player, platforms, stageFloor, mazeWalls, leftWall, rightWall, patrolEnemies, shooterEnemies, jumperShooterEnemies, coins, powerups, riser, projectiles } = this.scene;

        // --- PLAYER COLLISIONS ---
        this.scene.physics.add.collider(player, platforms, this.playerHandler.handlePlatformCollision, null, this.playerHandler);
        this.scene.physics.add.collider(player, mazeWalls, this.playerHandler.handleLand, null, this.playerHandler);
        this.scene.physics.add.collider(player, stageFloor, this.playerHandler.handleLand, null, this.playerHandler);
        this.scene.physics.add.collider(player, leftWall, () => this.playerHandler.handleWallTouch(player, leftWall, 'left'));
        this.scene.physics.add.collider(player, rightWall, () => this.playerHandler.handleWallTouch(player, rightWall, 'right'));

        // --- ENEMY COLLISIONS ---
        const enemyGroups = [patrolEnemies, shooterEnemies, jumperShooterEnemies];

        enemyGroups.forEach(group => {
            // Player vs Enemy
            this.scene.physics.add.overlap(player, group, this.enemyHandler.hitEnemy, null, this.enemyHandler);

            if (group === patrolEnemies) {
                // Patrol: use platformRider for both platforms AND mazeWalls
                this.scene.physics.add.collider(
                    group,
                    mazeWalls,
                    this.enemyHandler.handleEnemyPlatformCollision,
                    null,
                    this.enemyHandler
                );
                this.scene.physics.add.collider(
                    group,
                    platforms,
                    this.enemyHandler.handleEnemyPlatformCollision,
                    null,
                    this.enemyHandler
                );
            } else {
                // Shooter and Jumper: normal collision (simple gravity-based)
                this.scene.physics.add.collider(group, mazeWalls);
                this.scene.physics.add.collider(group, platforms);
            }

            // Side walls - only for patrol enemies and jumpers
            // ShooterEnemies don't need wall collision (they're static on platforms)
            if (group === patrolEnemies || group === jumperShooterEnemies) {
                this.scene.physics.add.collider(group, leftWall);
                this.scene.physics.add.collider(group, rightWall);
            }
        });

        // --- ITEMS & OBJECTS ---
        this.scene.physics.add.overlap(player, coins, this.itemHandler.collectCoin, null, this.itemHandler);
        this.scene.physics.add.overlap(player, powerups, this.itemHandler.collectPowerup, null, this.itemHandler);
        this.scene.physics.add.overlap(player, riser, this.playerHandler.touchRiser, null, this.playerHandler);

        // Coins and powerups use platformRider to stay on moving platforms
        this.scene.physics.add.collider(coins, platforms, this.itemHandler.handleItemPlatformCollision, null, this.itemHandler);
        this.scene.physics.add.collider(powerups, platforms, this.itemHandler.handleItemPlatformCollision, null, this.itemHandler);

        // --- PROJECTILES ---
        this.scene.physics.add.overlap(
            player,
            projectiles,
            this.projectileHandler.hitByProjectile,
            (player, projectile) => projectile && projectile.active && !projectile.getData('processed'),
            this.projectileHandler
        );

        [leftWall, rightWall].forEach(wall => {
            this.scene.physics.add.overlap(
                projectiles,
                wall,
                this.projectileHandler.projectileHitWall,
                (obj1, obj2) => {
                    let proj = (obj1.texture && obj1.texture.key === 'projectile') ? obj1 : (obj2.texture && obj2.texture.key === 'projectile' ? obj2 : null);
                    return proj && proj.active && !proj.getData('processed');
                },
                this.projectileHandler
            );
        });
    }
}
