import AdsManager from '../Core/AdsManager.js';
import GameState from '../../Core/GameState.js';

/**
 * ReviveService
 * Handles the logic for reviving the player, including:
 * - Tracking revive status
 * - Interacting with AdsManager
 * - Finding safe spawn positions
 * - Resurrecting the player entity
 */
export class ReviveService {
    constructor(scene) {
        this.scene = scene;
        this.hasRevived = false;
        this._isReviving = false;
    }

    /**
     * Checks if the player is eligible for a revive.
     * @returns {boolean}
     */
    canRevive() {
        return !this.hasRevived && !this._isReviving;
    }

    /**
     * Initiates the revive flow.
     * Shows ad, then revives player on success.
     */
    async initiateRevive() {
        if (!this.canRevive()) return;

        this._isReviving = true;
        console.log('[ReviveService] Initiating revive flow...');

        try {
            const success = await AdsManager.showReviveReward();
            this._isReviving = false; // Reset guard

            if (success) {
                console.log('[ReviveService] Ad complete. Reviving player.');
                this.executeRevive();
            } else {
                console.log('[ReviveService] Revive skipped or failed.');
                // Proceed to game over logic (usually handled by UIManager callback flow)
            }
        } catch (error) {
            console.error('[ReviveService] Error during revive flow:', error);
            this._isReviving = false;
        }
    }

    /**
     * Executes the revive action: restores physics, positions player, etc.
     */
    executeRevive() {
        console.log('[ReviveService] Executing Revive...');
        this.hasRevived = true;
        this.scene.hasRevived = true; // Sync with Scene for legacy checks (if any)

        // 1. UNPAUSE SCENE FIRST
        if (this.scene.isPaused('Game')) {
            console.log('[Revive] Resuming scene...');
            this.scene.scene.resume('Game');
        }

        // 2. UNPAUSE PHYSICS
        if (this.scene.physics && !this.scene.physics.world.isPaused) {
            // Already running
        } else if (this.scene.physics) {
            console.log('[Revive] Resuming physics...');
            this.scene.physics.resume();
        }

        // 3. RESET GAME STATE
        // CRITICAL: Reset GameState flags (pause button checks these)
        GameState._isGameOver = false;
        GameState._isPaused = false;
        console.log('[Revive] GameState flags reset');

        // 4. FIND SPAWN POSITION
        const spawnPos = this.findBestSpawnPosition();

        // 5. RESTORE PLAYER
        this.restorePlayer(spawnPos);

        // 6. RESUME GAMEPLAY AUDIO
        if (this.scene.audioManager) {
            // Restore volume if it was dimmed
            this.scene.tweens.add({
                targets: this.scene.audioManager.music,
                volume: 0.5, // Standard volume
                duration: 500
            });
            this.scene.audioManager.resumeAll();
        }

        // 7. NOTIFY UI
        if (this.scene.uiManager) {
            this.scene.uiManager.hideExtraLifeModal();
            // Ensure Score/HUD is visible
            this.scene.uiManager.showHUD();
        }
    }

    /**
     * Finds the best position to respawn the player.
     * Prioritizes existing platforms near death position.
     * Fallback to death position with invincibility.
     * @returns {Object} { x, y }
     */
    findBestSpawnPosition() {
        const cam = this.scene.cameras.main;
        const riserY = this.scene.riserManager?.riser?.y || Infinity;

        // Use DEATH POSITION (captured immediately on death) 
        const deathY = this.scene.deathPosition?.y || cam.scrollY;
        const deathX = this.scene.deathPosition?.x || cam.centerX;

        const platforms = this.scene.platformPool ? this.scene.platformPool.getActive() : [];
        let bestPlatform = null;
        let minDistance = Infinity;
        const MAX_DISTANCE = 500; // 50m

        platforms.forEach(platform => {
            if (!platform.body || !platform.active) return;

            const aboveLava = platform.y < riserY - 150;

            if (aboveLava) {
                const dist = Math.abs(platform.y - deathY);

                if (dist <= MAX_DISTANCE && dist < minDistance) {
                    minDistance = dist;
                    bestPlatform = platform;
                }
            }
        });

        if (bestPlatform) {
            console.log(`[ReviveService] Found platform at Y=${bestPlatform.y} (${minDistance}px from death)`);
            return { x: bestPlatform.x, y: bestPlatform.y - 70 };
        } else {
            console.warn(`[ReviveService] No safe platform. Spawning at death pos: (${deathX}, ${deathY})`);
            return { x: deathX, y: deathY - 50 };
        }
    }

    /**
     * Restores player state, position, and invincibility.
     * @param {Object} position {x, y}
     */
    restorePlayer(position) {
        const player = this.scene.player;
        if (!player || !player.body) return;

        player.active = true;
        player.visible = true;
        player.setVelocity(0, 0);
        player.setAcceleration(0, 0);
        player.clearTint();
        player.play('player_idle', true);

        // Reset Controller State
        if (player.controller) {
            const ctx = player.controller.context;
            ctx.resetState();
            ctx.flags.inputLocked = false;
            ctx.flags.dead = false;

            if (player.controller.unlockInput) {
                player.controller.unlockInput();
            }
        }

        // Set Position
        player.setPosition(position.x, position.y);

        // Enable Physics
        player.body.allowGravity = true;

        // Activate Invincibility
        if (player.activateInvincibility) {
            player.activateInvincibility();
        }
    }
}
