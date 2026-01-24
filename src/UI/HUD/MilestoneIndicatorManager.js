import MilestoneIndicator from '../../Entities/UI/MilestoneIndicator.js';
import ScoreManager from '../../Systems/Gameplay/ScoreManager.js';
import { MILESTONE_CONFIG } from '../../Config/MilestoneConfig.js';

/**
 * MilestoneIndicatorManager
 * 
 * Manages all milestone indicators showing top 10 leaderboard positions.
 * Updates their positions based on player height and triggers celebration effects.
 */
export class MilestoneIndicatorManager {
    constructor(scene) {
        this.scene = scene;
        this.indicators = [];
        this.milestones = [];
        this.lastPlayerHeight = 0;

        this.createParticleEmitter();
        this.loadMilestones();
    }

    /**
     * Create particle emitter for celebration effects
     */
    createParticleEmitter() {
        try {
            // Check if particle texture exists
            if (!this.scene.textures.exists('particle')) {
                console.warn('[MilestoneIndicatorManager] Particle texture not found, skipping particle emitter creation');
                return;
            }

            // Create a simple particle emitter for dust effects
            this.scene.milestoneParticles = this.scene.add.particles(0, 0, 'particle', {
                speed: { min: 50, max: 150 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: MILESTONE_CONFIG.particleDuration,
                gravityY: 100,
                quantity: MILESTONE_CONFIG.particleCount,
                emitting: false
            });
            this.scene.milestoneParticles.setDepth(99);
        } catch (error) {
            console.error('[MilestoneIndicatorManager] Error creating particle emitter:', error);
        }
    }

    /**
     * Load top 10 scores and create milestone indicators
     */
    loadMilestones() {
        try {
            const topScores = ScoreManager.getTopScores();
            console.log('[Milestone] 📋 Loading milestones from scores:', topScores);

            // Clear existing indicators
            this.indicators.forEach(indicator => indicator.destroy());
            this.indicators = [];
            this.milestones = [];

            // Create indicators for each score
            topScores.forEach((score, index) => {
                const position = index + 1;

                // Store milestone data
                this.milestones.push({
                    position,
                    height: score.height,
                    coins: score.coins,
                    name: score.name,
                    passed: false
                });

                // Create visual indicator
                const indicator = new MilestoneIndicator(
                    this.scene,
                    position,
                    score.height,
                    score.coins,
                    score.name
                );

                this.indicators.push(indicator);
            });
        } catch (error) {
            console.error('[MilestoneIndicatorManager] Error loading milestones:', error);
            this.indicators = [];
            this.milestones = [];
        }
    }

    /**
     * Update milestone positions based on player height
     * @param {number} playerHeight - Current player height in world coordinates
     */
    /**
     * Update milestone positions based on player height
     * @param {number} playerHeight - Current player height in world coordinates
     */
    update(playerHeight) {
        if (this.indicators.length === 0) return;

        // Ensure layout is available
        if (!this.scene.layout) return;

        this.lastPlayerHeight = playerHeight;
        const camera = this.scene.cameras.main;
        const screenTop = camera.scrollY;
        const screenBottom = camera.scrollY + camera.height;
        const playerSpawnY = this.scene.layout.playerSpawnY;
        const METERS_TO_PIXELS = 10;

        this.indicators.forEach((indicator, index) => {
            const milestone = this.milestones[index];

            // Convert Height (Meters) to World Y (Pixels)
            // Ideally use stored worldY if available, otherwise calculate
            let milestoneWorldY;
            if (milestone.worldY !== undefined) {
                milestoneWorldY = milestone.worldY;
            } else {
                milestoneWorldY = playerSpawnY - (milestone.height * METERS_TO_PIXELS);
            }

            const distanceToMilestone = playerHeight - milestoneWorldY; // Píxeles de distancia

            // DEBUG: Rate limited log
            if (index === 0 && this.scene.time.now % 1000 < 20) {
                console.log(`[Milestone] Upd: P=${Math.floor(playerHeight)}, M=${Math.floor(milestoneWorldY)}, D=${Math.floor(distanceToMilestone)}, Vis=${indicator.visible}`);
            }


            let screenY;

            // Check if player has passed this milestone (Player Y is LESS than Milestone Y because going up)
            // Note: In Phaser coordinates, smaller Y is "higher" up.
            // So if playerY <= milestoneWorldY, we are above (passed) it.
            if (playerHeight <= milestoneWorldY) {
                // Player has passed - lock indicator at milestone height
                if (!milestone.passed) {
                    milestone.passed = true;
                    indicator.playPassEffect();
                    indicator.setLocked(true);
                }

                // Position relative to camera
                screenY = milestoneWorldY - camera.scrollY;

                // Hide if it's far below the screen (passed and gone)
                // screenBottom is larger Y. If milestone Y is larger than screenBottom, it's below.
                if (milestoneWorldY > screenBottom + 200) {
                    indicator.setVisible(false);
                } else {
                    indicator.setVisible(true);
                    indicator.updatePosition(screenY);
                }
            } else {
                // Player hasn't reached it yet (current Y > milestone target Y)
                // Distance in pixels
                const distancePixels = Math.abs(playerHeight - milestoneWorldY);

                // Convert showDistance config (pixels? or meters?)
                // Assuming Config showDistance is in PIXELS for simplicity, or we convert.
                // If the user wants to see it "approaching", 600px is about one screen height.
                const SHOW_DISTANCE_PIXELS = MILESTONE_CONFIG.showDistance || 800;

                if (distancePixels > SHOW_DISTANCE_PIXELS) {
                    // Too far away - sticky at top
                    // We stack them at the top if multiple are waiting?
                    // For now, simple stacking or just fixed top.
                    // Milestone 1 (Top Score) is furthest away. Milestone 10 is closest.

                    // To avoid overlapping all at 50, let's offset them slightly or just hide them if too far
                    // But the requirement is "approach".
                    // Let's stick them to the top 
                    screenY = MILESTONE_CONFIG.edgeOffset + (index * 5); // Slight stack effect

                    // Option: Don't show if REALLY far?
                    // "Appear as player approaches"
                    // If we stick to top, they are always visible.
                    // Let's stick to top only if within range?

                    // Use a visual clamp
                    if (distancePixels < 50000) { // DEBUG: Always show if < 5000m equivalent
                        screenY = MILESTONE_CONFIG.edgeOffset;
                        indicator.setVisible(true);
                        // Force alpha to indicate distance?
                        indicator.setAlpha(0.5);
                    } else {
                        indicator.setVisible(false);
                        return; // Skip update
                    }
                } else {
                    // Approaching (within 800px) - scroll naturally
                    screenY = milestoneWorldY - camera.scrollY;

                    // If screenY < edgeOffset, clamp to top?
                    if (screenY < MILESTONE_CONFIG.edgeOffset) {
                        screenY = MILESTONE_CONFIG.edgeOffset;
                    }

                    indicator.setVisible(true);
                    indicator.setAlpha(1);
                }
                indicator.updatePosition(screenY);
            }
        });
    }


    /**
     * Refresh milestones (call when leaderboard changes)
     */
    refresh() {
        this.loadMilestones();
    }

    /**
     * Clean up
     */
    destroy() {
        this.indicators.forEach(indicator => indicator.destroy());
        this.indicators = [];
        this.milestones = [];

        if (this.scene.milestoneParticles) {
            this.scene.milestoneParticles.destroy();
            this.scene.milestoneParticles = null;
        }
    }
}
