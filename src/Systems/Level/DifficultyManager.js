import { LEVEL_CONFIG, getLevelConfig } from '../../Data/LevelConfig.js';

/**
 * DifficultyManager.js
 * 
 * Manages the game's difficulty progression based on player height.
 * Acts as the Source of Truth for:
 * - Current "Tier" or "Level"
 * - Platform parameters (speed, width, type)
 * - Enemy span configurations
 * - Maze/Safe Zone availability
 * - Riser (Lava) speed targets
 * 
 * Follows Single Responsibility Principle: Only manages difficulty state.
 */
export class DifficultyManager {
    constructor(scene) {
        this.scene = scene;
        this.currentHeight = 0;
        this.currentTier = null;

        // Initial state update
        this.update(0);
    }

    /**
     * Update the manager with current player height.
     * Should be called in the game update loop.
     * @param {number} playerY - Current player Y position (absolute).
     */
    update(playerY) {
        // height in game terms is often inverted or absolute
        // We assume input is the "score height" (positive number increasing upwards)
        // If the game uses negative Y, convert it before passing or handle here.
        // Assuming Game.js passes Math.abs(player.y) or similar "Distance Traveled"
        this.currentHeight = Math.abs(playerY);

        const newTier = getLevelConfig(this.currentHeight);

        if (this.currentTier !== newTier) {
            this.currentTier = newTier;
            this._onTierChange(newTier);
        }
    }

    _onTierChange(newTier) {
        const verbose = this.scene?.registry?.get('isDevMode');
        if (verbose) {
            console.log(`🌟 Difficulty Escalation: Entering "${newTier.description}" at ${this.currentHeight.toFixed(0)}m`);
        }
        // Emit event if needed: this.scene.events.emit('difficulty-changed', newTier);
    }

    // ─────────────────────────────────────────────────────────────
    // PUBLIC QUERIES
    // ─────────────────────────────────────────────────────────────

    getCurrentTier() {
        return this.currentTier;
    }

    /**
     * Gets platform configuration for the next slot.
     */
    getPlatformConfig() {
        return this.currentTier?.platforms || LEVEL_CONFIG.world1.baseSettings.platforms;
    }

    /**
     * Gets enemy spawn configuration.
     * @returns {Object} { spawnChance, types, distribution, projectiles }
     */
    getEnemyConfig() {
        return this.currentTier?.enemies || { spawnChance: 0, types: [] };
    }

    /**
     * Gets Maze configuration.
     */
    getMazeConfig() {
        return this.currentTier?.maze || { enabled: false, chance: 0 };
    }

    /**
     * Gets targeted Lava/Riser speed.
     * Note: RiserManager might apply its own smoothing/multipliers (e.g. slowing down in mazes).
     */
    getLavaSpeed() {
        return this.currentTier?.lava?.speed || LEVEL_CONFIG.world1.baseSettings.lava.speed;
    }

    /**
     * Gets mechanics configuration (wall jump, powerups).
     */
    getMechanicsConfig() {
        return this.currentTier?.mechanics || { wallJump: false, powerups: false };
    }
}
