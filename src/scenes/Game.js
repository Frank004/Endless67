import { Player } from '../prefabs/Player.js';
import { GameInitializer } from '../core/GameInitializer.js';
import { updatePlatformRider } from '../utils/platformRider.js';
import GameState from '../core/GameState.js';
import { PLATFORM_WIDTH, PLATFORM_HEIGHT } from '../prefabs/Platform.js';
import { SLOT_CONFIG } from '../config/SlotConfig.js';
import { PowerupOverlay } from '../prefabs/PowerupOverlay.js';
import { registerCoinAnimation, registerBasketballAnimation } from '../utils/animations.js';
import { REGISTRY_KEYS } from '../config/RegistryKeys.js';

/**
 * @phasereditor
 * @scene Game
 * @width 400
 * @height 600
 * @backgroundColor 0x050505
 */
export class Game extends Phaser.Scene {
    constructor(key = 'Game') {
        super(key);
    }

    /**
     * Initialize the game scene.
     */
    create() {
        // --- INITIALIZER ---
        // Handles setup of camera, devices, groups, pools, managers, and events
        this.initializer = new GameInitializer(this);
        this.initializer.init();

        // --- GAME STATE VARIABLES ---
        this.gameStarted = false;
        this.isGameOver = false;
        this.isPausedEvent = false;
        this.isPaused = false;
        this.totalScore = 0;
        this.heightOffset = 0;
        this.currentHeight = 0;

        // Powerup State
        this.isInvincible = false;
        this.powerupTimer = null;
        this.lastPowerupSpawnHeight = -1000;
        this.lastPowerupTime = -15000;

        // --- VISUAL REFRESH ---
        GameInitializer.updateWalls(this);

        // --- DEBUG SETUP ---
        this.registry.set(REGISTRY_KEYS.USE_PLAYER_PNG, this.debugManager.usePlayerPNG);

        // --- PLAYER ---
        const startPlatformY = SLOT_CONFIG.rules.startPlatformY || 450;
        const startPlatformHeight = PLATFORM_HEIGHT;
        this.player = new Player(this, this.cameras.main.centerX, startPlatformY - startPlatformHeight - 5);
        this.powerupOverlay = new PowerupOverlay(this, this.player);
        this.player.powerupOverlay = this.powerupOverlay;

        // --- DEBUG SETTINGS ---
        this.debugManager.applyDebugSettings();

        // --- INITIAL LEVEL GENERATION ---
        this.startPlatform = this.levelManager.spawnPlatform(this.cameras.main.centerX, SLOT_CONFIG.rules.startPlatformY, PLATFORM_WIDTH, false);

        // --- ANIMATIONS ---
        registerCoinAnimation(this);
        registerBasketballAnimation(this);

        // --- SLOT GENERATOR ---
        this.slotGenerator.init(SLOT_CONFIG.rules.startPlatformY);

        // --- LAVA & PARTICLES ---
        this.riserManager.createRiser();
        this.riserManager.setEnabled(false);
        // ParticleManager initialized in GameInitializer

        // --- SETUP COMPLETION ---
        this.uiManager.createUI();
        this.uiManager.setupEventListeners();
        this.inputManager.setupInputs();
        this.collisionManager.setupCollisions();

        // --- CAMERA FOLLOW ---
        this.cameras.main.startFollow(this.player, true, 0, 0.1);
    }

    /**
     * Main game loop.
     */
    update() {
        if (!this.player || !this.player.active || !this.player.scene) {
            return;
        }

        // Game Over Logic
        if (this.isGameOver) {
            if (this.riserManager) {
                this.riserManager.update(this.player.y, this.currentHeight, true);
            }
            return;
        }

        // Pause Logic
        if (this.isPausedEvent || this.isPaused) return;
        if (!this.gameStarted) return;

        // Player Update
        if (this.player && this.player.update) {
            this.player.update();
        }

        // Manager Updates
        if (this.inputManager) this.inputManager.update();
        if (this.slotGenerator) this.slotGenerator.update();
        if (this.riserManager) this.riserManager.update(this.player.y, this.currentHeight, false);
        if (this.audioManager) this.audioManager.updateAudio(this.player.y, this.riserManager?.riser?.y ?? this.player.y);
        if (this.debugManager) {
            this.debugManager.updateHitboxVisual();
            this.debugManager.updateRuler();
        }

        // Platform Riders (Coins/Powerups)
        if (this.coins && this.coins.children) {
            this.coins.children.iterate(coin => {
                if (coin && coin.active && coin.body) updatePlatformRider(coin);
            });
        }
        if (this.powerups && this.powerups.children) {
            this.powerups.children.iterate(powerup => {
                if (powerup && powerup.active && powerup.body) updatePlatformRider(powerup);
            });
        }

        // Walls
        GameInitializer.updateWalls(this);

        // Height Calculation
        const referenceHeight = 400;
        let h = Math.floor((referenceHeight - this.player.y) / 10) + this.heightOffset;
        if (h > this.currentHeight) {
            this.currentHeight = h;
            GameState.updateHeight(this.currentHeight);
        }
    }

    /**
     * Starts the game.
     */
    startGame() {
        this.gameStarted = true;

        this.uiManager.setGameStartUI();
        this.audioManager.startMusic();

        if (this.player?.controller?.resetState) {
            this.player.controller.resetState();
        }
        if (this.player?.body) {
            this.player.setVelocity(0, 0);
            this.player.setAcceleration(0, 0);
        }
    }

    /**
     * Toggles sound.
     */
    toggleSound() {
        GameState.toggleSound();
        this.audioManager.toggleSound();
    }

    /**
     * Activates invincibility powerup.
     */
    activateInvincibility() {
        this.isInvincible = true;
        if (this.powerupTimer) this.powerupTimer.remove();
        this.powerupTimer = this.time.delayedCall(12000, () => {
            this.deactivatePowerup();
        });
    }

    /**
     * Deactivates invincibility powerup.
     */
    deactivatePowerup() {
        this.isInvincible = false;
        if (this.particleManager) this.particleManager.stopAura();

        this.player.setTint(0xaaaaaa);
        this.time.delayedCall(200, () => this.player.clearTint());

        if (this.powerupOverlay) {
            this.powerupOverlay.stop();
        }
    }

    /**
     * Triggers the "67" celebration effect.
     */
    trigger67Celebration() {
        this.uiManager.trigger67Celebration();
    }
}
