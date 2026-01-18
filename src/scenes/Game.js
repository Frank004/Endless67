import EventBus, { Events } from '../core/EventBus.js';
import { Player } from '../entities/player/Player.js';
import { GameInitializer } from '../core/GameInitializer.js';
import { updatePlatformRider } from '../utils/platformRider.js';
import GameState from '../core/GameState.js';
import { PLATFORM_WIDTH, PLATFORM_HEIGHT } from '../prefabs/Platform.js';
import { SLOT_CONFIG } from '../config/SlotConfig.js';
import { PowerupOverlay } from '../prefabs/PowerupOverlay.js';
import { registerCoinAnimation, registerBasketballAnimation, registerTrashcanAnimation, registerTireAnimation } from '../utils/animations.js';
import { REGISTRY_KEYS } from '../config/RegistryKeys.js';
import { LAYOUT_CONFIG, calculateLayout } from '../config/LayoutConfig.js';
import { StageFloor } from '../prefabs/StageFloor.js';
import { AdBanner } from '../prefabs/AdBanner.js';
import { StageProps } from '../managers/ui/StageProps.js';
import CurrencyRunService from '../managers/gameplay/CurrencyRunService.js';


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
        this.cleanupPreviousGame();

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

        // --- DEV DIAGNOSTICS ---
        if (typeof window !== 'undefined') {
            window.__slotDiag = () => {
                const cam = this.cameras.main;
                const stats = this.platformPool?.getStats?.();
                const slots = this.slotGenerator?.slots || [];
                const activePlatforms = this.platformPool?.getActive?.() || [];
                const inView = activePlatforms.filter(p => p.y <= cam.scrollY + cam.height + 200 && p.y >= cam.scrollY - 200);
                const nearestAbove = activePlatforms
                    .filter(p => p.y < this.player?.y)
                    .map(p => ({ y: p.y, dy: this.player.y - p.y }))
                    .sort((a, b) => a.dy - b.dy)[0];
                const nearestBelow = activePlatforms
                    .filter(p => p.y >= this.player?.y)
                    .map(p => ({ y: p.y, dy: p.y - this.player.y }))
                    .sort((a, b) => a.dy - b.dy)[0];
                const platformInfo = activePlatforms
                    .map(p => ({
                        x: p.x,
                        y: p.y,
                        initX: p.initialX ?? null,
                        initY: p.initialY ?? null
                    }))
                    .sort((a, b) => a.y - b.y);
                console.log('[slotDiag] playerY=', this.player?.y, 'cameraTop=', cam.scrollY, 'height=', cam.height);
                console.log('[slotDiag] slots count=', slots.length, 'last=', slots[slots.length - 1]);
                console.log('[slotDiag] platformPool stats=', stats);
                console.log('[slotDiag] active platforms:', activePlatforms.length, 'inView:', inView.length, 'nearestAbove:', nearestAbove, 'nearestBelow:', nearestBelow);
                console.table(platformInfo);

                // Visual overlay for platform positions (outline colliders)
                if (!this._slotDiagGfx) {
                    this._slotDiagGfx = this.add.graphics().setDepth(9999).setScrollFactor(0);
                }
                const g = this._slotDiagGfx;
                g.clear();
                g.lineStyle(2, 0x00ff00, 0.6);
                activePlatforms.forEach(p => {
                    const halfW = p?.body?.width ? p.body.width / 2 : 64;
                    const halfH = p?.body?.height ? p.body.height / 2 : 16;
                    g.strokeRect(p.x - halfW - cam.scrollX, p.y - halfH - cam.scrollY, halfW * 2, halfH * 2);
                    g.strokeCircle((p.x - cam.scrollX), (p.y - cam.scrollY), 4);
                });
            };
        }
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
        // Check if mobile once for all optimizations
        const isMobile = this.isMobile || false;

        // Update Difficulty Manager (Source of Truth for progression)
        if (this.difficultyManager) {
            // Note: currentHeight is updated at the end of this method, so this uses previous frame's height
            // which is fine. passing absolute height (meters)
            this.difficultyManager.update(this.currentHeight);
        }

        if (this.slotGenerator) this.slotGenerator.update();
        if (this.riserManager) this.riserManager.update(this.player.y, this.currentHeight, false);
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

    /**
     * Clean up any residual objects from a previous game session
     * This is critical when using scene.restart() to prevent memory leaks and performance issues
     */
    cleanupPreviousGame() {
        // Clean up pools (despawn all active objects) - only if they exist
        try {
            if (this.platformPool && typeof this.platformPool.despawnAll === 'function') {
                this.platformPool.despawnAll();
            }
            if (this.coinPool && typeof this.coinPool.despawnAll === 'function') {
                this.coinPool.despawnAll();
            }
            if (this.powerupPool && typeof this.powerupPool.despawnAll === 'function') {
                this.powerupPool.despawnAll();
            }
            if (this.patrolEnemyPool && typeof this.patrolEnemyPool.despawnAll === 'function') {
                this.patrolEnemyPool.despawnAll();
            }
            if (this.shooterEnemyPool && typeof this.shooterEnemyPool.despawnAll === 'function') {
                this.shooterEnemyPool.despawnAll();
            }
            if (this.jumperShooterEnemyPool && typeof this.jumperShooterEnemyPool.despawnAll === 'function') {
                this.jumperShooterEnemyPool.despawnAll();
            }
            if (this.projectilePool && typeof this.projectilePool.despawnAll === 'function') {
                this.projectilePool.despawnAll();
            }
        } catch (e) {
            // Silently ignore pool cleanup errors (pools may not exist on first run)
        }

        // Clean up Phaser groups (destroy all children) - only if they exist and have children
        try {
            if (this.platforms && typeof this.platforms.clear === 'function') {
                this.platforms.clear(true, true);
            }
            if (this.coins && typeof this.coins.clear === 'function') {
                this.coins.clear(true, true);
            }
            if (this.powerups && typeof this.powerups.clear === 'function') {
                this.powerups.clear(true, true);
            }
            if (this.patrolEnemies && typeof this.patrolEnemies.clear === 'function') {
                this.patrolEnemies.clear(true, true);
            }
            if (this.shooterEnemies && typeof this.shooterEnemies.clear === 'function') {
                this.shooterEnemies.clear(true, true);
            }
            if (this.jumperShooterEnemies && typeof this.jumperShooterEnemies.clear === 'function') {
                this.jumperShooterEnemies.clear(true, true);
            }
            if (this.projectiles && typeof this.projectiles.clear === 'function') {
                this.projectiles.clear(true, true);
            }
            if (this.mazeWalls && typeof this.mazeWalls.clear === 'function') {
                this.mazeWalls.clear(true, true);
            }
        } catch (e) {
            // Silently ignore group cleanup errors (groups may not exist on first run)
        }

        // Clean up particle emitters (stop and kill all particles) - only if they exist
        try {
            if (this.dustEmitter && typeof this.dustEmitter.stop === 'function') {
                this.dustEmitter.stop();
                if (typeof this.dustEmitter.killAll === 'function') {
                    this.dustEmitter.killAll();
                }
            }
            if (this.sparkEmitter && typeof this.sparkEmitter.stop === 'function') {
                this.sparkEmitter.stop();
                if (typeof this.sparkEmitter.killAll === 'function') {
                    this.sparkEmitter.killAll();
                }
            }
            if (this.burnEmitter && typeof this.burnEmitter.stop === 'function') {
                this.burnEmitter.stop();
                if (typeof this.burnEmitter.killAll === 'function') {
                    this.burnEmitter.killAll();
                }
            }
            if (this.auraEmitter && typeof this.auraEmitter.stop === 'function') {
                this.auraEmitter.stop();
                if (typeof this.auraEmitter.killAll === 'function') {
                    this.auraEmitter.killAll();
                }
            }
            if (this.confettiEmitter && typeof this.confettiEmitter.stop === 'function') {
                this.confettiEmitter.stop();
                if (typeof this.confettiEmitter.killAll === 'function') {
                    this.confettiEmitter.killAll();
                }
            }
        } catch (e) {
            // Silently ignore emitter cleanup errors (emitters may not exist on first run)
        }

        // Reset slot generator
        this.slotGenerator?.reset?.();

        // Reset riser manager
        if (this.riserManager) {
            this.riserManager.setEnabled?.(false);
            if (this.riserManager.riser?.destroy) {
                this.riserManager.riser.destroy();
                this.riserManager.riser = null;
            }
            this.riserManager.hasStartedRising = false;
            this.riserManager.initialPlayerY = undefined;
        }

        // Clean up timers
        this.powerupTimer?.remove?.();
        this.powerupTimer = null;

        // Stop all tweens
        this.tweens?.killAll?.();

        // Reset camera
        if (this.cameras?.main) {
            this.cameras.main.stopFollow?.();
            this.cameras.main.scrollX = 0;
            this.cameras.main.scrollY = 0;
        }

        // Clean up UI Manager listeners
        this.uiManager?.gameOverMenu?.reset?.();
        this.uiManager?.destroy?.();

        // Clean up Audio Manager listeners
        this.audioManager?.stopAudio?.();

        // Clean up stage props
        this.stageProps?.destroy?.();

        // Clean up fog effect
        this.fogEffect?.destroy?.();
    }
}
