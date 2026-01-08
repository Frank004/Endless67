
import { MILESTONE_CONFIG } from '../../config/MilestoneConfig.js';
import { ASSETS } from '../../config/AssetKeys.js';

/**
 * MilestoneIndicator
 * 
 * Visual representation of a single milestone (leaderboard position).
 * Shows on both left and right sides of the screen with a horizontal line.
 */
export default class MilestoneIndicator extends Phaser.GameObjects.Container {
    constructor(scene, position, height, coins, name) {
        super(scene, 0, 0);

        this.scene = scene;
        this.position = position; // 1-10
        this.milestoneHeight = height;
        this.coins = coins;
        this.playerName = name;
        this.passed = false;
        this.locked = false;

        this.color = MILESTONE_CONFIG.colors[position - 1];

        this.createVisuals();

        scene.add.existing(this);
        this.setDepth(100);
        this.setScrollFactor(0);
    }

    createVisuals() {
        const { indicatorWidth, indicatorHeight, lineAlpha, edgeOffset } = MILESTONE_CONFIG;
        const gameWidth = this.scene.scale.width;

        // Left indicator background (colored rectangle)
        this.leftBg = this.scene.add.rectangle(
            edgeOffset + indicatorWidth / 2,
            0,
            indicatorWidth,
            indicatorHeight,
            this.color
        );
        this.leftBg.setOrigin(0.5);
        this.add(this.leftBg);

        // Right indicator background (colored rectangle)
        this.rightBg = this.scene.add.rectangle(
            gameWidth - edgeOffset - indicatorWidth / 2,
            0,
            indicatorWidth,
            indicatorHeight,
            this.color
        );
        this.rightBg.setOrigin(0.5);
        this.add(this.rightBg);

        // Position text (left side)
        const posText = this.position.toString().padStart(2, '0');
        this.leftText = this.scene.add.text(
            edgeOffset + indicatorWidth / 2,
            0,
            posText,
            {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#000000',
                fontStyle: 'bold'
            }
        );
        this.leftText.setOrigin(0.5);
        this.add(this.leftText);

        // Position text (right side)
        this.rightText = this.scene.add.text(
            gameWidth - edgeOffset - indicatorWidth / 2,
            0,
            posText,
            {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#000000',
                fontStyle: 'bold'
            }
        );
        this.rightText.setOrigin(0.5);
        this.add(this.rightText);

        // Horizontal line across screen
        this.line = this.scene.add.line(
            0, 0,
            edgeOffset + indicatorWidth,
            0,
            gameWidth - edgeOffset - indicatorWidth,
            0,
            this.color
        );
        this.line.setOrigin(0, 0.5);
        this.line.setAlpha(lineAlpha);
        this.line.setLineWidth(1);
        this.add(this.line);
    }

    /**
     * Update the screen position of this indicator
     * @param {number} screenY - Y position on screen
     */
    updatePosition(screenY) {
        this.y = screenY;
    }

    /**
     * Lock the indicator at its milestone height (player has passed it)
     */
    setLocked(locked) {
        this.locked = locked;
        if (locked) {
            // Reduce opacity when locked to show it's been passed
            this.setAlpha(0.6);
        }
    }

    /**
     * Play celebration effect when player passes this milestone
     */
    playPassEffect() {
        if (this.passed) return;

        this.passed = true;

        // Flash effect
        this.scene.tweens.add({
            targets: [this.leftBg, this.rightBg],
            alpha: { from: 1, to: 0.3 },
            duration: 200,
            yoyo: true,
            repeat: 2
        });

        // Emit particles at milestone position (Explosion Effect)
        // Helper to safe emit
        const emitExplosion = (emitter, x, y, count) => {
            if (emitter) {
                // Force depth high to ensure visibility over UI/Background
                emitter.setDepth(200);
                emitter.emitParticleAt(x, y, count);
            }
        };

        const leftX = this.leftBg.x;
        const rightX = this.rightBg.x;

        // 0. Hide the line immediately
        if (this.line) this.line.setVisible(false);

        // SOUND 1: Snap/Break (Metallic High Pitch)
        // Simulate a cable/bar snapping
        this.scene.sound.play(ASSETS.TRASHCAN_HIT, { volume: 0.25, detune: 1200, rate: 1.5 });

        // 1. SPRITE EXPLOSIONS (New Asset)
        // Create explosions at the junction points (where line meets indicator)
        const leftJunctionX = leftX + (MILESTONE_CONFIG.indicatorWidth / 2);
        const rightJunctionX = rightX - (MILESTONE_CONFIG.indicatorWidth / 2);

        // SOUND 2: Explosion (Deep impact)
        this.scene.sound.play(ASSETS.DESTROY_SFX, { volume: 0.4, detune: -200 });

        // Check if Effects Texture exists
        if (this.scene.textures.exists('effects')) {
            console.log('[Milestone] 💥 Creating explosion sprites at ScreenY:', this.y);

            // Align with wall center (assumed 32px width based on indicatorWidth)
            // Moving them OUTWARDS from the game zone.
            const wallWidth = MILESTONE_CONFIG.indicatorWidth; // 32
            const wallCenterX = wallWidth / 2; // 16
            const gameWidth = this.scene.scale.width;

            // Left Side (Mirror)
            const expLeft = this.scene.add.sprite(wallCenterX, this.y, 'effects', 'explotion1.png');
            expLeft.setScrollFactor(0);
            expLeft.setDepth(300);
            expLeft.setFlipX(true);
            expLeft.setScale(2);
            expLeft.setTint(this.color); // Apply indicator color
            expLeft.play('explosion');
            expLeft.once('animationcomplete', () => expLeft.destroy());

            // Right Side (Normal)
            const expRight = this.scene.add.sprite(gameWidth - wallCenterX, this.y, 'effects', 'explotion1.png');
            expRight.setScrollFactor(0);
            expRight.setDepth(300);
            expRight.setScale(2);
            expRight.setTint(this.color); // Apply indicator color
            expRight.play('explosion');
            expRight.once('animationcomplete', () => expRight.destroy());
        } else {
            console.error('[Milestone] ❌ Effects texture MISSING');
        }

        // Secondary particles (Sparks/Dust/Line)
        const centerLeft = leftX + (MILESTONE_CONFIG.indicatorWidth / 2);
        const centerRight = rightX - (MILESTONE_CONFIG.indicatorWidth / 2);
        const steps = 6;
        const stepSize = (centerRight - centerLeft) / steps;

        if (this.scene.sparkEmitter) {
            this.scene.sparkEmitter.setDepth(200);
            for (let i = 0; i <= steps; i++) {
                this.scene.sparkEmitter.emitParticleAt(centerLeft + (stepSize * i), this.y + (Math.random() * 10 - 5), 2);
            }
        }

        // 2. GENTLE FLY-OUT (Soft Jump & Spin)
        const flyDuration = 1200;

        // LEFT INDICATOR
        // 1. Move Out
        this.scene.tweens.add({
            targets: [this.leftBg, this.leftText],
            x: '-=120',
            duration: flyDuration,
            ease: 'Quad.out'
        });
        // 2. Gentle Spin
        this.scene.tweens.add({
            targets: [this.leftBg, this.leftText],
            angle: -45, // Just a tilt
            duration: flyDuration,
            ease: 'Quad.out'
        });
        // 3. Jump Arc (Up then Down)
        this.scene.tweens.add({
            targets: [this.leftBg, this.leftText],
            y: '-=40', // Little jump up
            duration: flyDuration * 0.4,
            ease: 'Quad.out',
            yoyo: true, // Comes back down
            onComplete: () => {
                // Fall away
                if (this.scene && this.leftBg) {
                    this.scene.tweens.add({
                        targets: [this.leftBg, this.leftText],
                        y: '+=150',
                        alpha: 0,
                        duration: flyDuration * 0.6,
                        ease: 'Quad.in'
                    });
                }
            }
        });

        // RIGHT INDICATOR (Symmetric)
        this.scene.tweens.add({
            targets: [this.rightBg, this.rightText],
            x: '+=120',
            duration: flyDuration,
            ease: 'Quad.out'
        });
        this.scene.tweens.add({
            targets: [this.rightBg, this.rightText],
            angle: 45,
            duration: flyDuration,
            ease: 'Quad.out'
        });
        this.scene.tweens.add({
            targets: [this.rightBg, this.rightText],
            y: '-=40',
            duration: flyDuration * 0.4,
            ease: 'Quad.out',
            yoyo: true,
            onComplete: () => {
                if (this.scene && this.rightBg) {
                    this.scene.tweens.add({
                        targets: [this.rightBg, this.rightText],
                        y: '+=150',
                        alpha: 0,
                        duration: flyDuration * 0.6,
                        ease: 'Quad.in',
                        onComplete: () => this.setVisible(false)
                    });
                }
            }
        });
    }

    destroy() {
        super.destroy();
    }
}
