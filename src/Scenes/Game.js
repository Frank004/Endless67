import EventBus, { Events } from '../Core/EventBus.js';
import { Player } from '../Entities/Player/Player.js';
import { GameInitializer } from '../Core/GameInitializer.js';
import { updatePlatformRider } from '../Utils/platformRider.js';
import GameState from '../Core/GameState.js';
import { PLATFORM_WIDTH, PLATFORM_HEIGHT } from '../Entities/Platform.js';
import { SLOT_CONFIG } from '../Config/SlotConfig.js';
import { PowerupOverlay } from '../Entities/PowerupOverlay.js';
import { registerCoinAnimation, registerBasketballAnimation, registerTrashcanAnimation, registerTireAnimation } from '../Utils/animations.js';
import { REGISTRY_KEYS } from '../Config/RegistryKeys.js';
import { LAYOUT_CONFIG, calculateLayout } from '../Config/LayoutConfig.js';
import { StageFloor } from '../Entities/StageFloor.js';
import { AdBanner } from '../Entities/AdBanner.js';
import { StageProps } from '../UI/Visuals/StageProps.js';
import CurrencyRunService from '../Systems/Gameplay/CurrencyRunService.js';


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
        // Version Logging
        if (this.registry?.get('showSlotLogs') === true) {
            console.log('🚀 GAME VERSION: ROCKET-ITEMS-REFACTOR-' + Date.now());
        }

        // --- CLEANUP FROM PREVIOUS GAME (if restarting) ---
        // Ensure clean state before initializing new game
        if (this.cleanupSystem) {
            this.cleanupSystem.resetGame();
        }

        // Reset Global State
        GameState.reset();
        CurrencyRunService.resetRunCoins();

        // --- INITIALIZER ---
        // Handles setup of camera, devices, groups, pools, managers, and events
        this.initializer = new GameInitializer(this);
        this.initializer.init();

        // Ensure listeners are cleaned up on shutdown
        this.events.once('shutdown', () => {
            if (this.uiManager) {
                this.uiManager.destroy();
            }
            if (this.fogEffect) {
                this.fogEffect.destroy();
                this.fogEffect = null;
            }
        });

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
        // OPTIMIZATION: Pre-initialize walls immediately for instant rendering
        if (this.wallDecorator && this.textures.exists('walls')) {
            const initialScrollY = this.cameras.main.scrollY || 0;
            this.wallDecorator.preInitialize(initialScrollY);
        }
        GameInitializer.updateWalls(this);

        // --- DEBUG SETUP ---
        // Cleanup activado por defecto (solo se desactiva explícitamente con disableCleanup flag)

        // --- LAYOUT & STAGE ---
        const screenHeight = this.scale.height;
        const layout = calculateLayout(screenHeight);
        this.layout = layout;

        // Internal Ad Banner (Top 50px)
        this.adBanner = new AdBanner(this);

        // Stage Floor (Static ground at the start, 32px)
        // Positioned at the bottom of the screen (screenHeight - 32)
        this.stageFloor = new StageFloor(this, screenHeight);

        // Decorative props on the stage floor (left and right)
        this.stageProps = new StageProps(this);
        this.stageProps.create(screenHeight);

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
        registerTrashcanAnimation(this);
        registerTireAnimation(this);

        // --- SLOT GENERATOR ---
        // Slots comienzan sobre el StageFloor
        this.slotGenerator.init(layout.firstSlotY);

        // --- LAVA & PARTICLES ---
        this.riserManager.createRiser();
        this.riserManager.setEnabled(true); // ✅ Lava activada
        // ParticleManager initialized in GameInitializer

        // --- SETUP COMPLETION ---
        this.uiManager.createUI();
        this.uiManager.setupEventListeners();
        this.inputManager.setupInputs();
        this.collisionManager.setupCollisions();

        // Setup Diagnostics tool
        if (this.debugManager) {
            this.debugManager.setupDiagnosticTool();
        }

        // Listen for Pause Toggle
        const onPauseToggle = () => {
            if (this.uiManager && this.uiManager.pauseMenu) {
                this.uiManager.pauseMenu.toggle();
            }
        };
        EventBus.on(Events.PAUSE_TOGGLE, onPauseToggle, this);
        this.events.once('shutdown', () => {
            EventBus.off(Events.PAUSE_TOGGLE, onPauseToggle, this);
        });

        // --- CAMERA FOLLOW ---
        // Offset the camera to keep the player in the lower half and reveal upcoming platforms
        this.cameras.main.startFollow(this.player, true, 0, 0.25, 0, 140);
    }

    /**
     * Main game loop.
     */
    update() {
        // --- INPUT UPDATE ---
        // CRITICAL: Must be updated FIRST, even if player is inactive, to handle menu navigation in Game Over
        if (this.inputManager) {
            this.inputManager.update(this.time.now, this.game.loop.delta);
        }

        if (!this.player || !this.player.active || !this.player.scene) {
            return;
        }

        // Game Over Logic
        if (this.isGameOver) {
            // FIX: Ensure Riser triggers on ANY game over (Enemy, Projectile, etc.)
            if (this.riserManager && !this.riserManager.isRising) {
                this.riserManager.triggerRising();
            }

            if (this.riserManager) {
                this.riserManager.update(this.player.y, this.currentHeight, true, this.game.loop.delta);
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
        // Check if mobile once for all optimizations
        const isMobile = this.isMobile || false;

        // Update Difficulty Manager (Source of Truth for progression)
        if (this.difficultyManager) {
            // Note: currentHeight is updated at the end of this method, so this uses previous frame's height
            // which is fine. passing absolute height (meters)
            this.difficultyManager.update(this.currentHeight);
        }

        if (this.slotGenerator) this.slotGenerator.update();
        if (this.riserManager) this.riserManager.update(this.player.y, this.currentHeight, false, this.game.loop.delta);
        if (this.backgroundManager) this.backgroundManager.update(this.cameras.main.scrollY);

        // Update milestone indicators with current player height
        if (this.uiManager) {
            this.uiManager.updateMilestones(this.player.y);
        }

        // Throttle audio updates on mobile (every 3 frames = ~20fps updates)
        if (this.audioManager) {
            if (!isMobile || (this._audioUpdateFrame = (this._audioUpdateFrame || 0) + 1) % 3 === 0) {
                this.audioManager.updateAudio(this.player.y, this.riserManager?.riser?.y ?? this.player.y);
            }
        }

        // 🚀 OPTIMIZATION: Only update debug visuals if actually enabled
        if (this.debugManager) {
            // Skip if debug features are disabled (most common case)
            if (this.debugManager.showPlayerHitbox) {
                this.debugManager.updateHitboxVisual();
            }
            if (this.debugManager.rulerEnabled) {
                this.debugManager.updateRuler();
            }
        }

        // Platform Riders (Coins/Powerups)
        // OPTIMIZED: Only update riders that are near the camera, with throttling for mobile
        // Throttle updates on mobile to every other frame for better performance
        const shouldUpdateRiders = !isMobile || (this._riderUpdateFrame = (this._riderUpdateFrame || 0) + 1) % 2 === 0;

        if (shouldUpdateRiders) {
            const camera = this.cameras.main;
            const cameraTop = camera.scrollY;
            const cameraBottom = cameraTop + camera.height;
            const updateRange = isMobile ? 150 : 200; // Smaller range on mobile

            // 🚀 OPTIMIZATION: Cache range calculations and use simple iteration
            const minY = cameraTop - updateRange;
            const maxY = cameraBottom + updateRange;

            if (this.coins && this.coins.children) {
                const coinsList = this.coins.children.entries;
                for (let i = 0; i < coinsList.length; i++) {
                    const coin = coinsList[i];
                    if (coin && coin.active && coin.body) {
                        // Only update if coin is near camera (within update range)
                        if (coin.y >= minY && coin.y <= maxY) {
                            updatePlatformRider(coin);
                        }
                    }
                }
            }
            if (this.powerups && this.powerups.children) {
                const powerupsList = this.powerups.children.entries;
                for (let i = 0; i < powerupsList.length; i++) {
                    const powerup = powerupsList[i];
                    if (powerup && powerup.active && powerup.body) {
                        // Only update if powerup is near camera (within update range)
                        if (powerup.y >= minY && powerup.y <= maxY) {
                            updatePlatformRider(powerup);
                        }
                    }
                }
            }
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
        // Marcar que el juego acaba de iniciar para forzar renderizado de paredes
        this._wallJustStarted = true;

        this.uiManager.setGameStartUI();
        this.audioManager.startMusic();

        // Activar lava cuando el juego comienza


        if (this.player?.controller?.resetState) {
            this.player.controller.resetState();
        }
        if (this.player?.body) {
            this.player.setVelocity(0, 0);
            this.player.setAcceleration(0, 0);
        }

        // Asegurar que las paredes se rendericen al iniciar el juego
        GameInitializer.updateWalls(this);
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
