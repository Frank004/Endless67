import EventBus, { Events } from '../../Core/EventBus.js';
import AdsManager from '../Core/AdsManager.js';
import GameState from '../../Core/GameState.js';

export class ReviveSystem {
    constructor(scene) {
        this.scene = scene;
        this.hasRevived = false;
        this._isReviving = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.onGameOver = this.handleGameOver.bind(this);
        EventBus.on(Events.GAME_OVER, this.onGameOver);

        // Cleanup on scene shutdown
        this.scene.events.once('shutdown', () => {
            EventBus.off(Events.GAME_OVER, this.onGameOver);
        });
    }

    handleGameOver(data) {
        // If already revived, let the Game Over flow proceed normally (handled elsewhere or by UIManager fallback)
        // But UIManager logic is being moved here, so WE must trigger the post-game flow if we don't revive.

        // Wait a bit for the death animation/impact
        this.scene.time.delayedCall(1000, () => {
            if (!this.hasRevived) {
                this.offerRevive(data);
            } else {
                console.log('💀 [ReviveSystem] Already revived once. Proceeding to Post Game.');
                this.proceedToPostGame(data);
            }
        });
    }

    offerRevive(data) {
        console.log('💖 [ReviveSystem] Offering Extra Life...');

        if (!this.scene.uiManager) {
            console.warn('[ReviveSystem] UI Manager not found!');
            this.proceedToPostGame(data);
            return;
        }

        // Inform Game/UI that we are in a "Revive Offer" state (freeze logic if needed)
        // We can use a flag on the scene or just manage it via the modal interaction

        this.scene.uiManager.showExtraLifeModal(
            // On Revive (User clicked Revive)
            () => {
                this.startReviveProcess(data);
            },
            // On Skip/Close
            () => {
                console.log('❌ [ReviveSystem] User skipped revive.');
                // Ensure physics is paused (it might not be if we were waiting for input)
                if (this.scene.physics) {
                    this.scene.physics.pause();
                }
                this.proceedToPostGame(data);
            }
        );
    }

    async startReviveProcess(data) {
        if (this._isReviving) return;
        this._isReviving = true;

        if (this.scene.uiManager) {
            this.scene.uiManager.extraLifeModal.startCloseAnimation();
        }

        try {
            const success = await AdsManager.showReviveReward();
            this._isReviving = false;

            if (success) {
                this.executeRevive();
            } else {
                console.log('[ReviveSystem] Ad skipped or failed.');
                this.proceedToPostGame(data);
            }
        } catch (e) {
            console.error('[ReviveSystem] Error during revive process:', e);
            this.proceedToPostGame(data);
        }
    }

    executeRevive() {
        console.log('[ReviveSystem] Executing Revive... 💫');
        this.hasRevived = true;

        // Delegate the physical respawn to the Game Scene
        if (this.scene.respawnPlayer) {
            this.scene.respawnPlayer();
        } else {
            console.error('[ReviveSystem] scene.respawnPlayer method missing!');
        }
    }

    proceedToPostGame(data) {
        if (this.scene.uiManager) {
            this.scene.uiManager.proceedToPostGame(data);
        }
    }
}
