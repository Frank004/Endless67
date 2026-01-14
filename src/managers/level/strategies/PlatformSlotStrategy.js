import { SlotStrategy } from './SlotStrategy.js';
import { SLOT_CONFIG, getPlatformBounds } from '../../../config/SlotConfig.js';
import { ItemSpawnStrategy } from '../ItemSpawnStrategy.js';
import { WallDecorManager } from '../../visuals/WallDecorManager.js';
import { EnemySpawnStrategy } from '../EnemySpawnStrategy.js';

/**
 * Strategy for generating Platform slots (Standard & Safe Zones).
 * Handles the creation of platforms, items (coins/powerups), and enemy spawning.
 * @extends SlotStrategy
 */
export class PlatformSlotStrategy extends SlotStrategy {
    constructor(scene) {
        super(scene);
        this.itemSpawnStrategy = new ItemSpawnStrategy(scene);

        // Use existing WallDecorManager or create new if not passed (though SlotGenerator usually manages it)
        // Ideally, WallDecorManager logic might be kept in SlotGenerator OR passed here.
        // For now, let's look it up or create a lightweight handle.
        // Actually, SlotGenerator has the single instance of WallDecorManager. 
        // We should probably rely on the scene's managers or pass it in context.
        // But to keep it simple self-contained:
        this.wallDecorManager = scene.wallDecorManager;
        if (!this.wallDecorManager) {
            console.warn('⚠️ PlatformSlotStrategy: wallDecorManager missing in scene! Creating fallback (no update loop).');
            this.wallDecorManager = new WallDecorManager(scene);
        }

        this.enemySpawnStrategy = new EnemySpawnStrategy(scene);
    }

    /**
     * Generates a platform slot based on the provided layout data.
     * @param {Object} layoutData - The layout data calculated by GridGenerator.
     * @param {number} layoutData.yStart - The starting Y coordinate of the slot.
     * @param {number} layoutData.height - The height of the slot.
     * @param {Object} layoutData.data - Internal data containing platforms and transforms.
     * @returns {Object} Result of generation (platformCount, movingPlatforms, etc.).
     */
    generate(layoutData) {
        const { yStart, type, yEnd, height } = layoutData;
        const internalData = layoutData.data;
        const platforms = internalData.platforms;
        const basePatternName = internalData.sourcePattern;
        const transform = internalData.transform;

        // --- DIFFICULTY MANAGER INTEGRATION ---
        const difficulty = this.scene.difficultyManager;
        const platformConfig = difficulty ? difficulty.getPlatformConfig() : SLOT_CONFIG.types.PLATFORM_BATCH;
        const enemyConfig = difficulty ? difficulty.getEnemyConfig() : { spawnChance: 0 };
        // -------------------------------------

        const verbose = this.scene?.registry?.get('showSlotLogs') === true;

        // 4) Sistema de SWAP para plataformas móviles
        const MOVING_PLATFORM_CHANCE = (platformConfig.movingChance ?? 35) / 100;
        const MOVING_PLATFORM_SPEED = platformConfig.movingSpeed ?? 100;
        const platformCount = platforms.length;

        // Determinar cuántas plataformas móviles tendrá este slot (0, 1 o 2)
        let numMovingPlatforms = 0;
        if (Math.random() < MOVING_PLATFORM_CHANCE && platformCount > 0) {
            numMovingPlatforms = Phaser.Math.Between(1, 2);
        }
        if (this.scene.registry?.get('disableMovingPlatforms')) {
            numMovingPlatforms = 0;
            if (verbose) console.log('⚪ Moving platforms disabled via debug flag');
        }

        // Seleccionar índices aleatorios de plataformas que serán móviles
        const movingPlatformIndices = new Set();
        if (numMovingPlatforms > 0) {
            const availableIndices = Array.from({ length: platformCount }, (_, i) => i);
            const shuffled = Phaser.Utils.Array.Shuffle([...availableIndices]);
            for (let i = 0; i < Math.min(numMovingPlatforms, shuffled.length); i++) {
                movingPlatformIndices.add(shuffled[i]);
            }
        }

        const minX = getPlatformBounds(layoutData.gameWidth || this.scene.scale.width).minX;
        const maxX = getPlatformBounds(layoutData.gameWidth || this.scene.scale.width).maxX;

        if (verbose) {
            console.log(`  🎨 Patrón: ${basePatternName} | Transform: ${transform}`);
            if (numMovingPlatforms > 0) {
                console.log(`  🔵 Plataformas móviles: ${numMovingPlatforms}`);
            }
        }

        // ─────────────────────────────────────────────────────────────
        // PASO 1: Generar TODAS las plataformas primero
        // ─────────────────────────────────────────────────────────────
        const gap = SLOT_CONFIG.minVerticalGap;
        const spawnedPlatforms = [];

        if (!platforms || platforms.length === 0) {
            console.error(`❌ SLOT ERROR (PlatformBatch): No se generaron plataformas para el patrón '${basePatternName}' en Y=${yStart}`);
            return {
                type: type,
                yStart: yStart,
                yEnd: yEnd,
                height: height,
                contentHeight: height,
                platformCount: 0
            };
        }

        for (let i = 0; i < platforms.length; i++) {
            const dataPlatform = platforms[i];
            const spawnX = dataPlatform.x;
            const currentY = dataPlatform.y;

            let isMoving = movingPlatformIndices.has(i);
            if (this.scene.registry?.get('disableMovingPlatforms')) {
                isMoving = false;
            }

            let platform = this.scene.levelManager.spawnPlatform(
                spawnX,
                currentY,
                SLOT_CONFIG.platformWidth,
                isMoving,
                MOVING_PLATFORM_SPEED
            );

            if (!platform) {
                if (verbose) {
                    console.warn(`⚠️ SlotGenerator: Platform Spawn FAILED at ${spawnX},${currentY}. Creating fallback static.`);
                }
                platform = this.scene.physics.add.staticSprite(spawnX, currentY, 'platform');
                platform.setDisplaySize(SLOT_CONFIG.platformWidth, SLOT_CONFIG.platformHeight).refreshBody();
            }

            if (platform && this.scene.platforms) {
                if (!this.scene.platforms.contains(platform)) {
                    this.scene.platforms.add(platform, true);
                }
            }

            spawnedPlatforms.push({
                x: spawnX,
                y: currentY,
                width: SLOT_CONFIG.platformWidth,
                height: SLOT_CONFIG.platformHeight
            });

            // SPAWN ENEMIES
            const enemySpawned = this.enemySpawnStrategy.trySpawn(platform, {
                isMoving: isMoving,
                spawnChances: {
                    enemies: enemyConfig.spawnChance / 100,
                    types: enemyConfig.types,
                    distribution: enemyConfig.distribution
                }
            });

            if (enemySpawned && verbose) {
                console.log(`      👹 Enemy Spawned on platform ${i + 1}`);
            }
        }

        // Fallback for 0 platforms
        if (spawnedPlatforms.length === 0) {
            const gameWidth = this.scene.cameras.main.width;
            const centerSafe = Phaser.Math.Clamp(getPlatformBounds(gameWidth).centerX, minX, maxX);
            let fbY = layoutData.yStart;
            const fbCount = platformCount;
            for (let i = 0; i < fbCount; i++) {
                let platform = this.scene.levelManager.spawnPlatform(
                    centerSafe,
                    fbY,
                    SLOT_CONFIG.platformWidth,
                    false,
                    0
                );
                if (!platform) {
                    platform = this.scene.physics.add.staticSprite(centerSafe, fbY, 'platform');
                    platform.setDisplaySize(SLOT_CONFIG.platformWidth, SLOT_CONFIG.platformHeight).refreshBody();
                    this.scene.platforms?.add(platform, true);
                }
                if (platform && platform.active) {
                    spawnedPlatforms.push({
                        x: centerSafe,
                        y: fbY,
                        width: SLOT_CONFIG.platformWidth,
                        height: SLOT_CONFIG.platformHeight
                    });
                }
                fbY -= gap;
            }
            console.error(`🚨 FALLBACK TRIGGERED in Slot ${layoutData.index}: Generated 0 platforms!`);
        }

        // ─────────────────────────────────────────────────────────────
        // PASO 2: Generar ITEMS (Coins + Powerups)
        // ─────────────────────────────────────────────────────────────
        const generatedItems = this.itemSpawnStrategy.generateItems(
            { yStart, yEnd, index: layoutData.index || 0 }, // fallback index
            spawnedPlatforms
        );

        if (verbose && generatedItems.length > 0) {
            console.log(`    💰 Generated ${generatedItems.length} items`);
        }

        // ─────────────────────────────────────────────────────────────
        // PASO 3: Generar WALL DECOR
        // ─────────────────────────────────────────────────────────────
        this.wallDecorManager.generateForSlot(yStart, height);

        return {
            patternName: basePatternName,
            transform,
            platformCount: spawnedPlatforms.length,
            movingPlatforms: numMovingPlatforms,
            contentHeight: height,
            platforms: spawnedPlatforms
        };
    }
}
