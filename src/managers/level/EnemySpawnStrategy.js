import { ENEMY_CONFIG } from '../../config/EnemyConfig.js';
import { SLOT_CONFIG } from '../../config/SlotConfig.js';

/**
 * Strategy responsible for determining if and which enemy to spawn on a platform.
 */
export class EnemySpawnStrategy {
    /**
     * @param {Phaser.Scene} scene - The game scene.
     */
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Attempts to spawn an enemy on the given platform based on probabilities.
     * @param {Phaser.GameObjects.Sprite} platform - The target platform.
     * @param {Object} options - Options including isMoving and spawnChances.
     * @returns {boolean} True if an enemy was spawned, false otherwise.
     */
    trySpawn(platform, options = {}) {
        const { isMoving = false, spawnChances = {} } = options;

        // Rule 1: Enemies never spawn on moving platforms
        if (isMoving) return false;

        // Rule 2: Platform must be valid and active
        if (!platform || !platform.active) return false;

        const enemyChancePatrol = spawnChances.patrol || 0;
        const enemyChanceShooter = spawnChances.shooter || 0;
        const enemyChanceJumper = spawnChances.jumper || 0;

        const rand = Math.random();

        // Check Patrol
        if (enemyChancePatrol > 0 && rand < enemyChancePatrol) {
            this._spawnPatrol(platform);
            return true;
        }

        // Check Shooter
        const thresholdShooter = enemyChancePatrol + enemyChanceShooter;
        if (enemyChanceShooter > 0 && rand >= enemyChancePatrol && rand < thresholdShooter) {
            this._spawnShooter(platform);
            return true;
        }

        // Check Jumper
        const thresholdJumper = thresholdShooter + enemyChanceJumper;
        if (enemyChanceJumper > 0 && rand >= thresholdShooter && rand < thresholdJumper) {
            this._spawnJumper(platform);
            return true;
        }

        return false;
    }

    /**
     * Internal helper to spawn a patrol enemy.
     * @private
     */
    _spawnPatrol(platform) {
        this.scene.time.delayedCall(200, () => {
            const enemy = this.scene.levelManager.spawnPatrol(platform);
            if (enemy && enemy.active) {
                const platformHalfWidth = (SLOT_CONFIG.platformWidth || 128) / 2;
                const enemyHalfWidth = ENEMY_CONFIG.PATROL.SIZE / 2;
                const margin = ENEMY_CONFIG.PATROL.BOUNDS_MARGIN;

                const minX = platform.x - platformHalfWidth + enemyHalfWidth + margin;
                const maxX = platform.x + platformHalfWidth - enemyHalfWidth - margin;
                const patrolSpeed = ENEMY_CONFIG.PATROL.SPEED;

                if (minX >= maxX) return;

                // Slightly delayed patrol init to ensure physics sync
                this.scene.time.delayedCall(300, () => {
                    if (enemy && enemy.active && enemy.body) {
                        if (enemy.setPatrolBounds) enemy.setPatrolBounds(minX, maxX, patrolSpeed);
                        if (enemy.patrol) enemy.patrol(minX, maxX, patrolSpeed);
                    }
                });
            }
        });
    }

    /**
     * Internal helper to spawn a shooter enemy.
     * @private
     */
    _spawnShooter(platform) {
        this.scene.time.delayedCall(200, () => {
            this.scene.levelManager.spawnShooter(platform);
        });
    }

    /**
     * Internal helper to spawn a jumper enemy.
     * @private
     */
    _spawnJumper(platform) {
        this.scene.time.delayedCall(200, () => {
            this.scene.levelManager.spawnJumperShooter(platform);
        });
    }
}
