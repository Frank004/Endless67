import { Player } from '../prefabs/Player.js';
import { GameInitializer } from '../core/GameInitializer.js';
import { updatePlatformRider } from '../utils/platformRider.js';
import GameState from '../core/GameState.js';
import { PLATFORM_WIDTH, PLATFORM_HEIGHT } from '../prefabs/Platform.js';
import { SLOT_CONFIG } from '../config/SlotConfig.js';
import { PowerupOverlay } from '../prefabs/PowerupOverlay.js';
import { registerCoinAnimation, registerBasketballAnimation } from '../utils/animations.js';
import { REGISTRY_KEYS } from '../config/RegistryKeys.js';
import { LAYOUT_CONFIG, calculateLayout } from '../config/LayoutConfig.js';
import { StageFloor } from '../prefabs/StageFloor.js';
import { AdBanner } from '../prefabs/AdBanner.js';

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
        // CONFIRM UPDATE
        // CONFIRM UPDATE
        console.log('🚀 GAME VERSION: LOOKAHEAD-FIX-' + Date.now());
        // alert('CODE UPDATED: ' + new Date().toTimeString()); // Uncomment if desperate for visual confirmation

        // --- INITIALIZER ---
        // Handles setup of camera, devices, groups, pools, managers, and events
        this.initializer = new GameInitializer(this);
        this.initializer.init();

        // --- GAME STATE VARIABLES ---
        this.gameStarted = false;
        this.isGameOver = false;
        this.isPausedEvent = false;
        this.isPaused = false;
        this.isDevMenuOpen = false;
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

        // --- LAYOUT & STAGE ---
        const screenHeight = this.scale.height;
        const layout = calculateLayout(screenHeight);
        this.layout = layout;

        // Internal Internal Ad Banner (Bottom 50px)
        this.adBanner = new AdBanner(this);

        // Stage Floor (Static ground at the start, 32px)
        // Positioned at the bottom of the GAMEPLAY viewport (screenHeight - 50)
        this.stageFloor = new StageFloor(this, screenHeight);

        // --- PLAYER ---
        // Spawn precisely on the StageFloor
        this.player = new Player(this, this.cameras.main.centerX, layout.playerSpawnY);

        this.powerupOverlay = new PowerupOverlay(this, this.player);
        this.player.powerupOverlay = this.powerupOverlay;

        // --- DEBUG SETTINGS ---
        this.debugManager.applyDebugSettings();

        // --- INITIAL LEVEL GENERATION ---
        // Usamos StageFloor como base inicial

        // --- ANIMATIONS ---
        registerCoinAnimation(this);
        registerBasketballAnimation(this);

        // --- SLOT GENERATOR ---
        // Slots comienzan sobre el StageFloor
        this.slotGenerator.init(layout.firstSlotY);

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

        // Height Calculation: 0m starts at the initial spawn point
        const referenceHeight = this.layout.playerSpawnY;
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
    }

    /**
     * Activates invincibility powerup.
     */
    activateInvincibility() {
        if (this.player && this.player.activateInvincibility) {
            this.player.activateInvincibility();
        }
    }

    /**
     * Deactivates invincibility powerup.
     */
    deactivatePowerup() {
        if (this.player && this.player.deactivatePowerup) {
            this.player.deactivatePowerup();
        }
    }

    // Proxy for isInvincible property to maintain compatibility
    get isInvincible() {
        return this.player?.isInvincible || false;
    }

    set isInvincible(value) {
        if (this.player) {
            this.player.isInvincible = value;
        }
    }

    /**
     * Triggers the "67" celebration effect.
     */
    trigger67Celebration() {
        this.uiManager.trigger67Celebration();
    }
}
