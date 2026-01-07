/**
 * SlotGenerator.js
 * 
 * Generador de slots para el sistema de nivel procedural.
 * Cada slot tiene 640px de altura y contiene un tipo específico de contenido.
 */

import { SLOT_CONFIG, getPlatformBounds, getItemBounds } from '../../config/SlotConfig.js';
import { getPlayableBounds } from '../../utils/playableBounds.js';
import { PLATFORM_PATTERNS, getRandomPattern } from '../../data/PlatformPatterns.js';
import { MAZE_PATTERNS_EASY, MAZE_PATTERNS_MEDIUM, MAZE_PATTERNS, MAZE_ROW_HEIGHT } from '../../data/MazePatterns.js';
import { PatternTransformer } from '../../utils/PatternTransformer.js';
import { COIN_BASE_SIZE } from '../../prefabs/Coin.js';
import { POWERUP_BASE_SIZE } from '../../prefabs/Powerup.js';
// Enemy logic delegated to EnemySpawnStrategy
import { EnemySpawnStrategy } from './EnemySpawnStrategy.js';
// Pure layout logic
import { GridGenerator } from './GridGenerator.js';

export class SlotGenerator {
    constructor(scene) {
        this.scene = scene;
        // Obtener gameWidth dinámico desde la escena
        const gameWidth = scene.cameras.main.width;
        this.transformer = new PatternTransformer(gameWidth);

        // Pure layout logic (decoupled from Phaser)
        this.gridGenerator = new GridGenerator(gameWidth);

        // Only log if debug is enabled
        if (scene?.registry?.get('showSlotLogs') === true) {
            console.log(`[SlotGenerator] Init with gameWidth: ${gameWidth} (Camera: ${scene.cameras.main.width})`);
        }

        // Estado
        this.currentSlotIndex = 0;
        this.slots = [];  // Historial de slots generados
        this.consecutiveMazes = 0;
        this.mazeCooldown = 0; // Slots obligatorios sin maze tras generar uno
        // this.colorIndex = 0;  // Comentado: colores debug desactivados

        // Offset inicial: primera plataforma del batch empieza arriba de la plataforma de inicio
        this.startY = 290;  // Y inicial del primer batch (se recalcula en init)

        // Config
        this.slotHeight = SLOT_CONFIG.slotHeight;
        this.spawnBuffer = SLOT_CONFIG.rules.spawnBuffer;
        this.cleanupDistance = SLOT_CONFIG.rules.cleanupDistance;

        // Estrategia de spawn de enemigos
        this.enemySpawnStrategy = new EnemySpawnStrategy(scene);

        // Flag para prevenir múltiples generaciones en el mismo frame
        this.isGenerating = false;
    }

    /**
     * Inicializa el generador y crea el primer batch
     * @param {number} startPlatformY - Y de la plataforma de inicio (se calcula desde layout si no se proporciona)
     */
    init(startPlatformY = null) {
        // Si no se proporciona startPlatformY, calcularlo desde el layout
        if (startPlatformY === null) {
            const screenHeight = this.scene?.scale?.height || 640;
            const floorHeight = 32;
            const floorY = screenHeight - floorHeight; // Floor al fondo (ad banner está arriba)
            startPlatformY = floorY - 160; // 160px arriba del floor (mismo cálculo que firstSlotY)
        }
        const verbose = this.scene?.registry?.get('showSlotLogs') === true;
        if (verbose) {
            console.log('🎮 SlotGenerator: Inicializando... startY=', startPlatformY);
        }

        // Calcular Y inicial del primer batch usando slotGap
        this.startY = startPlatformY - SLOT_CONFIG.slotGap;
        if (verbose) {
            console.log(`  📍 Plataforma inicio: Y=${startPlatformY}, Primer batch: Y=${this.startY}`);
        }

        // Initialize GridGenerator with start position
        try {
            this.gridGenerator.reset(this.startY);
        } catch (e) {
            console.error('❌ SlotGenerator: GridGenerator.reset() FAILED:', e);
        }

        // Generar slots iniciales (tutorial)
        try {
            if (verbose) {
                console.log('  ...Generating tutorial slots...');
            }
            for (let i = 0; i < SLOT_CONFIG.rules.tutorialSlots; i++) {
                this.generateNextSlot({ tutorialIndex: i });
            }
        } catch (e) {
            console.error('❌ SlotGenerator: Tutorial slots FAILED:', e);
        }

        // Garantizar al menos 3 slots iniciales para evitar huecos de arranque
        try {
            if (verbose) {
                console.log('  ...Filling initial buffer...');
            }
            while (this.slots.length < 3) {
                this.generateNextSlot();
            }
        } catch (e) {
            console.error('❌ SlotGenerator: Buffer checking FAILED:', e);
        }

        if (verbose) {
            console.log(`✅ SlotGenerator: Init Done. ${this.slots.length} slots generated.`);
        }
    }

    /**
     * Genera el siguiente slot basado en reglas
     */
    generateNextSlot(options = {}) {
        // Mantener el ancho dinámico para clamps en mobile/resize
        const cam = this.scene?.cameras?.main;
        const currentWidth = cam?.worldView?.width || cam?.width;
        if (currentWidth) {
            this.transformer.setGameWidth(currentWidth);
            this.gridGenerator.gameWidth = currentWidth;
            this.gridGenerator.transformer.setGameWidth(currentWidth);
        }

        // Determine type via DifficultyManager integration
        const requestedType = this.determineSlotType();

        // Get layout from GridGenerator (pure logic) - pass determined type
        let layoutData;
        try {
            // nextSlot(slotIndex, startYOverride, typeOverride, configOverride)
            layoutData = this.gridGenerator.nextSlot(this.currentSlotIndex, null, requestedType);
        } catch (e) {
            console.error('❌ SlotGenerator: GridGenerator.nextSlot() CRASHED:', e);
            throw e; // Rethrow to halt
        }

        // Extract calculated values
        const slotYStart = layoutData.yStart;
        const slotType = layoutData.type;
        const slotHeight = layoutData.height;
        const slotYEnd = layoutData.yEnd;

        // Opciones para tutorial: patrones fijos y sin transform
        const forcePattern = options.forcePattern || null;
        const disableTransform = options.disableTransform || false;
        const tutorialIndex = options.tutorialIndex;

        let result = null;
        const verbose = this.scene?.registry?.get('showSlotLogs') === true;
        if (verbose) {
            console.log(`  ⚙️ Generating Slot ${this.currentSlotIndex} [${slotType}]...`);
        }

        // Render based on type
        try {
            switch (slotType) {
                case 'PLATFORM_BATCH':
                    result = this.generatePlatformBatch(layoutData);
                    break;
                case 'SAFE_ZONE':
                    result = this.generatePlatformBatch(layoutData);
                    break;
                case 'MAZE':
                    result = this.generateMaze(layoutData);
                    break;
                default:
                    console.warn(`⚠️ Tipo de slot desconocido: ${slotType}, usando MAZE`);
                    result = this.generateMaze(layoutData);
            }
        } catch (e) {
            console.error(`❌ SlotGenerator: Failed to render slot type ${slotType}:`, e);
            console.error('Error details:', e.message, e.stack);
            // No re-lanzar el error para evitar loops infinitos, pero loguear todo
            return null;
        }
        if (verbose) {
            console.log(`📦 SLOT ${this.currentSlotIndex}: ${slotType} [Y: ${slotYStart} a ${slotYEnd}] (height=${slotHeight})`);
        }

        // Registrar slot (using GridGenerator's calculated values)
        const slotData = {
            index: this.currentSlotIndex,
            type: slotType,
            yStart: slotYStart,
            yEnd: slotYEnd,
            height: slotHeight,
            contentHeight: slotHeight, // Always use fixed height for consistency
            slotHeight,
            ...result
        };

        // Validar e insertar slot en la lista
        if (slotData) { // Using slotData instead of newSlot for consistency
            // VALIDACIÓN Y AUTO-CORRECCIÓN DE POSICIÓN
            const lastSlot = this.slots[this.slots.length - 1];
            if (lastSlot) {
                // Permitir pequeña tolerancia por float precision
                const gap = Math.abs(slotData.yStart - lastSlot.yEnd);
                if (gap > 0.1) {
                    if (verbose) {
                        console.warn(`⚠️ SLOT GAP: Brecha detectada entre Slot ${this.currentSlotIndex - 1} y ${this.currentSlotIndex}. Diferencia: ${gap.toFixed(2)}px`);
                        console.warn(`   🔧 Auto-corrigiendo: yStart ${slotData.yStart.toFixed(2)} -> ${lastSlot.yEnd.toFixed(2)}`);
                    }

                    // Auto-corregir posición
                    slotData.yStart = lastSlot.yEnd;
                    slotData.yEnd = slotData.yStart - slotData.height;

                    // Actualizar GridGenerator state para mantener consistencia
                    this.gridGenerator.lastSlotYEnd = slotData.yEnd;
                }
            }

            this.slots.push(slotData);
            this.currentSlotIndex++;

            // LOG DE ÉXITO DETALLADO (solo si verbose está activo)
            if (verbose) {
                console.log(`✅ Slot ${this.currentSlotIndex - 1} registrado:`, {
                    type: slotData.type,
                    yStart: slotData.yStart.toFixed(2),
                    yEnd: slotData.yEnd.toFixed(2),
                    height: slotData.height.toFixed(2),
                    contentHeight: slotData.contentHeight.toFixed(2)
                });
            }
        } else {
            // ERROR CRÍTICO: NO SE GENERÓ SLOT
            console.error(`❌ SLOT ERROR: Fallo al generar Slot ${this.currentSlotIndex}. layoutData retornó null/undefined.`);
        }
    }

    /**
     * Determina qué tipo de slot generar (con reglas de variedad)
     * @returns {string} Tipo de slot
     */
    determineSlotType() {
        const difficulty = this.scene.difficultyManager;
        // Fallback if no manager (shouldn't happen)
        if (!difficulty) return 'PLATFORM_BATCH';

        const tier = difficulty.getCurrentTier();

        // 1. Check if tutorial slots are needed (handled by LevelConfig height/tier logic mostly, 
        // but we keep the rigid index check for the absolute start)
        if (this.currentSlotIndex < SLOT_CONFIG.rules.tutorialSlots) {
            return 'PLATFORM_BATCH';
        }

        const mazeConfig = difficulty.getMazeConfig();
        const r = Math.random();

        // 2. Logic:
        // - Safe Zone: ~20% change if enabled (TODO: Add to config if needed, for now standard)
        // - Maze: Uses config.chance (percentage)

        const mazeChance = (mazeConfig.enabled ? mazeConfig.chance : 0) / 100;

        // Priority: Maze > Safe Zone > Platform
        if (mazeConfig.enabled && r < mazeChance) {
            // Check for cooldown if needed, but config handles chance
            return 'MAZE';
        }

        // Safe Zone logic (Hardcoded 20% for now or add to Manager)
        // For now, let's say Safe Zones act as spacers.
        if (Math.random() < 0.15) {
            return 'SAFE_ZONE';
        }

        return 'PLATFORM_BATCH';
    }

    /**
     * Genera un batch de plataformas usando el layout de GridGenerator
     * @param {Object} layoutData - Data completa del slot
     */
    generatePlatformBatch(layoutData) {
        const { yStart, type, yEnd, height } = layoutData;
        const internalData = layoutData.data;
        const platforms = internalData.platforms;
        const basePatternName = internalData.sourcePattern;
        const transform = internalData.transform;

        // --- DIFFICULTY MANAGER INTEGRATION ---
        const difficulty = this.scene.difficultyManager;
        const platformConfig = difficulty ? difficulty.getPlatformConfig() : SLOT_CONFIG.types.PLATFORM_BATCH;
        const mechanicsConfig = difficulty ? difficulty.getMechanicsConfig() : { powerups: true, powerupChance: 25 };
        const enemyConfig = difficulty ? difficulty.getEnemyConfig() : { spawnChance: 0 };
        // -------------------------------------

        const verbose = this.scene?.registry?.get('showSlotLogs') === true;

        // 4) Sistema de SWAP para plataformas móviles
        // Porcentaje de chance de tener plataformas móviles por slot (from DifficultyManager)
        const MOVING_PLATFORM_CHANCE = (platformConfig.movingChance ?? 35) / 100;
        const MOVING_PLATFORM_SPEED = platformConfig.movingSpeed ?? 100;
        const platformCount = platforms.length;

        // Determinar cuántas plataformas móviles tendrá este slot (0, 1 o 2)
        let numMovingPlatforms = 0;
        if (Math.random() < MOVING_PLATFORM_CHANCE && platformCount > 0) {
            // Si aplica, puede tener 1 o 2 plataformas móviles
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

        const minX = getPlatformBounds(this.gridGenerator.gameWidth).minX;
        const maxX = getPlatformBounds(this.gridGenerator.gameWidth).maxX;
        const centerSafe = getPlatformBounds(this.gridGenerator.gameWidth).centerX;

        if (verbose) {
            console.log(`  🎨 Patrón: ${basePatternName} | Transform: ${transform}`);
            if (numMovingPlatforms > 0) {
                console.log(`  🔵 Plataformas móviles: ${numMovingPlatforms}`);
            }
        }

        // ─────────────────────────────────────────────────────────────
        // PASO 1: Generar TODAS las plataformas primero
        // ─────────────────────────────────────────────────────────────
        const gap = SLOT_CONFIG.minVerticalGap;  // Siempre 160px
        const spawnedPlatforms = [];  // Guardar posiciones para evitar colisiones con coins

        // Iterate over PRE-CALCULATED platforms from GridGenerator
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

            // SWAP: Determinar si esta plataforma será móvil o estática
            let isMoving = movingPlatformIndices.has(i);
            if (this.scene.registry?.get('disableMovingPlatforms')) {
                isMoving = false;
            }

            // Spawn platform (estática o móvil según swap)
            let platform = this.scene.levelManager.spawnPlatform(
                spawnX,
                currentY,
                SLOT_CONFIG.platformWidth,
                isMoving,  // isMoving = true si está en movingPlatformIndices
                MOVING_PLATFORM_SPEED
            );

            // Fallback: si el pool está vacío o falla, crear una estática de emergencia
            if (!platform) {
                // OPTIMIZATION: Only warn if debug is enabled (this is a critical error but can spam)
                if (verbose) {
                    console.warn(`⚠️ SlotGenerator: Platform Spawn FAILED at ${spawnX},${currentY}. Creating fallback static.`);
                }
                platform = this.scene.physics.add.staticSprite(spawnX, currentY, 'platform');
                platform.setDisplaySize(SLOT_CONFIG.platformWidth, SLOT_CONFIG.platformHeight).refreshBody();
            }

            // CRITICAL FIX: Ensure platform is added to the scene's physics group for collision
            if (platform && this.scene.platforms) {
                if (!this.scene.platforms.contains(platform)) {
                    this.scene.platforms.add(platform, true);
                }
            }

            // Guardar posición de la plataforma
            spawnedPlatforms.push({
                x: spawnX,
                y: currentY,
                width: SLOT_CONFIG.platformWidth,
                height: SLOT_CONFIG.platformHeight
            });

            const platType = isMoving ? '🔵 MÓVIL' : '🟣 ESTÁTICA';
            if (verbose) {
                console.log(`    ▓ Plat ${i + 1}: x=${spawnX}, y=${currentY}, ${platType}`);
            }


            // ─────────────────────────────────────────────────────────────
            // SPAWN ENEMIGOS: Delegado a EnemySpawnStrategy
            // ─────────────────────────────────────────────────────────────

            // ─────────────────────────────────────────────────────────────
            // SPAWN ENEMIGOS: Delegado a EnemySpawnStrategy
            // ─────────────────────────────────────────────────────────────

            const enemySpawned = this.enemySpawnStrategy.trySpawn(platform, {
                isMoving: isMoving,
                spawnChances: {
                    enemies: enemyConfig.spawnChance / 100, // Normalized to 0-1
                    // Pass the whole config so Strategy can pick types
                    types: enemyConfig.types,
                    distribution: enemyConfig.distribution
                }
            });

            if (enemySpawned && verbose) {
                console.log(`      👹 Enemy Spawned on platform ${i + 1}`);
            }

            // Y already handled by GridGenerator
        }

        // Fallback duro: si no se generó ninguna plataforma (por clamps extremos), crear un set seguro al centro
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
                // Si el pool falla, crear sprite estático de emergencia
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

                    console.error(`🚨 FALLBACK TRIGGERED in Slot ${layoutData.index}: Generated 0 platforms! Creating SAFE platform at x=${centerSafe}, y=${fbY}`);
                }
                fbY -= gap;
            }
        }

        // ─────────────────────────────────────────────────────────────
        // PASO 2: Generar ITEMS (Coins + Powerups con sistema de swap)
        // ─────────────────────────────────────────────────────────────
        const ITEM_SIZE = Math.max(COIN_BASE_SIZE, POWERUP_BASE_SIZE);           // Tamaño base del sprite (32x32px)
        const ITEM_HALF = ITEM_SIZE / 2; // 16px
        const ITEM_DISTANCE = 128;       // Radio de distancia mínima entre items
        const { minX: minItemX, maxX: maxItemX } = getPlayableBounds(this.scene, ITEM_SIZE);

        // Config de POWERUP
        const isDev = this.scene.registry?.get('isDevMode');
        const POWERUP_MIN_DISTANCE = isDev ? 0 : 2000;   // 200 unidades Y (20m) - distancia mínima entre powerups
        const POWERUP_COOLDOWN = isDev ? 0 : 15000;      // 15 segundos - cooldown entre powerups

        // Chance from DifficultyManager
        const POWERUP_CHANCE = (mechanicsConfig.powerups ? mechanicsConfig.powerupChance : 0) / 100;
        const logPowerups = this.scene.registry?.get('logPowerups') === true;
        const logPw = (msg) => { if (logPowerups) console.log(msg); };

        // Lista de TODOS los items generados (coins + powerups)
        const allGeneratedItems = [];

        // Función para verificar distancia con otros items y colisiones con paredes de maze
        const tooCloseToOtherItems = (x, y) => {
            // 1. Check existing items
            for (const existing of allGeneratedItems) {
                const dist = Math.sqrt(Math.pow(x - existing.x, 2) + Math.pow(y - existing.y, 2));
                if (dist < ITEM_DISTANCE) {
                    return true;
                }
            }

            // 2. Check collision with maze walls (New Fix)
            if (this._overlapsMazeWall(x, y, ITEM_HALF)) {
                return true;
            }

            return false;
        };

        // Función para verificar si una posición colisiona con plataformas
        const collidesWithPlatform = (itemX, itemY) => {
            for (const plat of spawnedPlatforms) {
                const platLeft = plat.x - plat.width / 2 - ITEM_HALF;
                const platRight = plat.x + plat.width / 2 + ITEM_HALF;
                const platTop = plat.y - plat.height / 2 - ITEM_HALF;
                const platBottom = plat.y + plat.height / 2 + ITEM_HALF;

                if (itemX >= platLeft && itemX <= platRight &&
                    itemY >= platTop && itemY <= platBottom) {
                    return true;
                }
            }
            return false;
        };

        // ═══════════════════════════════════════════════════════════════
        // POWERUP: Verificar si puede spawnar (distancia + cooldown)
        // ═══════════════════════════════════════════════════════════════
        const canSpawnPowerup = (itemY) => {
            const scene = this.scene;
            const currentHeight = Math.abs(itemY);  // Altura en unidades Y
            const lastHeight = Math.abs(scene.lastPowerupSpawnHeight || -99999);
            const lastTime = scene.lastPowerupTime || -99999;
            const now = Date.now();

            // Condición 1: Distancia mínima entre powerups (200 unidades Y)
            const distanceDelta = currentHeight - lastHeight;
            const distanceOk = distanceDelta >= POWERUP_MIN_DISTANCE;

            // Condición 2: Cooldown de tiempo entre powerups (15 segundos)
            const cooldownDelta = now - lastTime;
            const cooldownOk = cooldownDelta >= POWERUP_COOLDOWN;

            // Condición 3: Random chance (8%)
            const chanceOk = Math.random() < POWERUP_CHANCE;

            const ok = distanceOk && cooldownOk && chanceOk;
            if (ok) {
                logPw(`    ⚡ Powerup eligible (platform slot) dist=${distanceDelta.toFixed?.(0) ?? distanceDelta} cooldown=${cooldownDelta}ms chance=${POWERUP_CHANCE}`);
            }
            return ok;
        };

        // Función para spawnar un POWERUP (usa PoolManager con prefab Powerup)
        const spawnPowerup = (x, y) => {
            // Usar PoolManager para obtener powerup del pool
            const powerup = this.scene.powerupPool.spawn(x, y);

            if (powerup && powerup.active) {
                // Agregar al grupo de física para colisiones
                if (this.scene.powerups) {
                    this.scene.powerups.add(powerup, true);
                }

                allGeneratedItems.push({ x, y, type: 'powerup' });

                // Actualizar tracking
                this.scene.lastPowerupSpawnHeight = y;
                this.scene.lastPowerupTime = Date.now();

                logPw(`    ⚡ Powerup (platform slot) at x=${x.toFixed?.(1) ?? x}, y=${y.toFixed?.(1) ?? y}`);
                return true;
            }
            logPw('    ⚠️ Powerup spawn failed (pool empty or inactive)');
            return false;
        };

        // Función para spawnar un COIN
        // SlotGenerator solo spawnea, el prefab Coin maneja su propia lógica
        const spawnCoin = (x, y) => {
            // Usar PoolManager para obtener coin del pool
            const coin = this.scene.coinPool.spawn(x, y);

            if (coin && coin.active) {
                // Agregar al grupo de física para colisiones
                if (this.scene.coins) {
                    this.scene.coins.add(coin, true);
                }

                allGeneratedItems.push({ x, y, type: 'coin' });
                return true;
            }
            if (!coin) {
                // OPTIMIZATION: Only warn if debug is enabled
                const verbose = this.scene?.registry?.get('showSlotLogs') === true;
                if (verbose) {
                    console.warn('SlotGenerator: no se pudo spawnar coin (pool vacío o maxSize alcanzado)');
                }
            }
            return false;
        };

        // ═══════════════════════════════════════════════════════════════
        // GRUPO 1: Items SOBRE plataformas (con sistema de SWAP)
        // - 40% chance de item
        // - Si puede spawnar powerup → POWERUP (swap)
        // - Si no → COIN
        // ═══════════════════════════════════════════════════════════════
        let platformCoinsCount = 0;
        let platformPowerupsCount = 0;

        for (const plat of spawnedPlatforms) {
            if (Math.random() < 0.4) {  // 40% de chance de item
                const platformTop = plat.y - (SLOT_CONFIG.platformHeight / 2);
                // Separación de 16px desde el borde superior de la plataforma para que el coin no esté pegado
                const itemY = platformTop - ITEM_HALF - 16;
                const itemX = Phaser.Math.Clamp(plat.x, minItemX, maxItemX);

                // Verificar distancia con otros items
                if (!tooCloseToOtherItems(itemX, itemY)) {
                    // SWAP: ¿Powerup o Coin?
                    if (canSpawnPowerup(itemY)) {
                        if (spawnPowerup(itemX, itemY)) {
                            platformPowerupsCount++;
                        }
                    } else {
                        if (spawnCoin(itemX, itemY)) {
                            platformCoinsCount++;
                        }
                    }
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // GRUPO 2: Coins EN EL AIRE (respeta distancia 128px con TODOS)
        // ═══════════════════════════════════════════════════════════════

        // Crear grid de posiciones posibles para coins en el aire
        const airCoinPositions = [];
        const leftWallX = minItemX;
        const rightWallX = maxItemX;

        // Generar posiciones Y cada 128px dentro del slot
        const slotTop = layoutData.yStart - layoutData.height + 60;
        const slotBottom = layoutData.yStart - 60;

        for (let y = slotBottom; y >= slotTop; y -= 128) {
            airCoinPositions.push({ x: leftWallX, y: y });
            airCoinPositions.push({ x: rightWallX, y: y });
        }

        // Filtrar posiciones que colisionan con plataformas
        const validAirPositions = airCoinPositions.filter(pos => !collidesWithPlatform(pos.x, pos.y));

        // Cantidad aleatoria de coins en el aire por slot (1 a 4) (-20%)
        const minAirCoins = 1;
        const maxAirCoins = 4;
        const targetAirCoins = Phaser.Math.Between(minAirCoins, maxAirCoins);

        // Barajar y seleccionar posiciones
        const shuffledPositions = Phaser.Utils.Array.Shuffle([...validAirPositions]);

        // Intentar spawnar coins del aire (verificando distancia con TODOS)
        let airCoinsCount = 0;
        for (const pos of shuffledPositions) {
            if (airCoinsCount >= targetAirCoins) break;

            // Verificar distancia con TODOS los items (plataformas + aire)
            if (!tooCloseToOtherItems(pos.x, pos.y)) {
                if (spawnCoin(pos.x, pos.y)) {
                    airCoinsCount++;
                }
            }
        }

        const totalCoins = platformCoinsCount + airCoinsCount;
        const totalItems = totalCoins + platformPowerupsCount;
        if (totalItems > 0 && verbose) {
            let logMsg = `    🪙 Coins: ${platformCoinsCount} plat + ${airCoinsCount} aire = ${totalCoins}`;
            if (platformPowerupsCount > 0) {
                logMsg += ` | ⚡ Powerups: ${platformPowerupsCount}`;
            }
            console.log(logMsg);
        }

        // Calcular altura real del contenido (basado en plataformas reales)
        let contentHeight = SLOT_CONFIG.slotHeight; // fallback

        // Verificar que las plataformas estén en las posiciones correctas
        if (spawnedPlatforms.length > 0) {
            const highestY = Math.min(...spawnedPlatforms.map(p => p.y)); // Y más pequeño = más arriba
            const lowestY = Math.max(...spawnedPlatforms.map(p => p.y)); // Y más grande = más abajo

            // Calcular altura real usada por las plataformas
            const actualHeight = (layoutData.yStart - highestY) + SLOT_CONFIG.platformHeight;

            // Validar que las plataformas estén dentro del slot esperado
            const expectedHeight = (platformCount - 1) * gap + SLOT_CONFIG.platformHeight;
            const heightDiff = Math.abs(actualHeight - expectedHeight);

            const verbose = this.scene?.registry?.get('showSlotLogs');
            if (heightDiff > 10 && verbose) {
                console.warn(`⚠️ SlotGenerator: Altura de plataformas inesperada. Esperada: ${expectedHeight}, Actual: ${actualHeight.toFixed(2)}, Diff: ${heightDiff.toFixed(2)}`);
            }
            // Usar la altura real (o la esperada si algo falló) para encadenar slots sin gaps extra
            // FIX: Para mantener el estilo "Lego" (bloques fijos), forzamos que el contenido ocupe siempre slotHeight
            // Esto asegura que el gap visual al siguiente slot sea consistente con el gap interno (160px).
            contentHeight = SLOT_CONFIG.slotHeight;

            // Debug warning only
            if (heightDiff > 10 && verbose) {
                // console.warn ... (keep visual warning but ignore logic override)
            }
        }

        return {
            patternName: basePatternName,
            transform,
            platformCount,
            movingPlatforms: numMovingPlatforms,
            contentHeight: contentHeight
        };
    }

    /**
     * Genera un maze dentro del slot usando layout data
     */
    generateMaze(layoutData) {
        const { yStart, height } = layoutData;
        const internalData = layoutData.data || {};
        let pattern = internalData.pattern;

        // 🔴 FALLBACK: Si no hay pattern (ej: slot convertido de PLATFORM_BATCH a MAZE)
        // generar un pattern simple por defecto
        if (!pattern || !Array.isArray(pattern) || pattern.length === 0) {
            console.warn('⚠️ generateMaze: No pattern found, using default simple pattern');
            pattern = [
                [1, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 1, 0, 0, 0, 1, 0, 1],
                [1, 0, 0, 0, 1, 0, 0, 0, 1],
                [1, 0, 1, 0, 0, 0, 1, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 1, 0, 1, 0, 0, 1]
            ];
        }
        const config = SLOT_CONFIG.types.MAZE;

        const rowCount = config.rowCount || 5;
        const rowHeight = config.rowHeight || MAZE_ROW_HEIGHT;
        const rowGap = config.rowGap || 100;

        // Use GridGenerator's height (aligned to 160px)
        const slotYEnd = layoutData.yEnd;

        // Cleanup existing walls in this range
        if (this.scene.mazeWalls) {
            this.scene.mazeWalls.children.each(wall => {
                if (wall.active && wall.y <= yStart + 1 && wall.y >= slotYEnd - 1) {
                    wall.destroy();
                }
            });
        }

        const mazeColors = [0xff7777, 0x77ff77, 0x7777ff, 0xffcc66, 0x66ccff];
        const color = mazeColors[this.currentSlotIndex % mazeColors.length];

        // OPTIMIZATION: Only log maze generation if debug is enabled
        const verbose = this.scene?.registry?.get('showSlotLogs') === true;
        if (verbose) {
            console.log(`  🌀 Generando MAZE [${rowCount} filas] (Y: ${yStart} a ${slotYEnd})`);
        }

        // Presupuesto de enemigos por maze (con chance global por maze)
        const difficulty = this.scene.difficultyManager;
        const mazeConfig = difficulty ? difficulty.getMazeConfig() : { allowEnemies: false, enemyCount: { min: 0, max: 0 } };

        // Override hardcoded config with dynamic config
        const allowEnemies = mazeConfig.allowEnemies;
        const enemyCountCfg = mazeConfig.enemyCount || { min: 1, max: 2 };
        const enemyChance = (mazeConfig.enemyChance ?? 40) / 100;

        const spawnEnemiesThisMaze = allowEnemies && Math.random() < enemyChance;
        const enemyBudget = {
            target: spawnEnemiesThisMaze ? Phaser.Math.Between(enemyCountCfg.min ?? 1, enemyCountCfg.max ?? 1) : 0,
            spawned: 0
        };

        // Presupuesto de coins extra por maze (además de los de fila)
        const coinBudget = {
            bonus: 2,
            used: 0
        };

        for (let row = 0; row < rowCount; row++) {
            const rowY = yStart - (row * (rowHeight + rowGap));
            // Use pattern from GridGenerator
            let rowConfig = pattern[row % pattern.length];

            this.scene.levelManager.spawnMazeRowFromConfig(
                rowY,
                rowConfig,
                false, // allowMoving
                true,  // allowSpikes / enemies en maze
                row,
                pattern,
                color,
                enemyBudget,
                coinBudget
            );
        }

        return {
            rowCount,
            patternName: `MAZE_${layoutData.data.patternIndex}`,
            patternLength: pattern.length,
            contentHeight: height
        };
    }





    /**
     * Actualiza el generador (llamado cada frame)
     */
    update() {
        if (!this.scene.player) return;

        // Prevenir múltiples generaciones en el mismo frame
        if (this.isGenerating) return;

        const playerY = this.scene.player.y;
        const cameraTop = this.scene.cameras.main.scrollY;
        const MIN_SLOTS_AHEAD = 3;
        const LOOKAHEAD_DISTANCE = this.slotHeight * (MIN_SLOTS_AHEAD + 1); // asegúrate de contar suficientes slots
        // Reducir generaciones por frame en mobile para mejor rendimiento
        const isMobile = this.scene?.isMobile || false;
        const MAX_GENERATIONS_PER_UPDATE = isMobile ? 2 : 5; // Menos generaciones en mobile

        // Generar tantos slots como sean necesarios para mantener el buffer
        try {
            this.isGenerating = true;
            let lastSlot = this.slots[this.slots.length - 1];
            let generatedThisFrame = 0;

            // Si no hay slots, generar el primero
            if (!lastSlot) {
                console.warn('⚠️ SlotGenerator: No hay slots, generando primero...');
                this.generateNextSlot();
                lastSlot = this.slots[this.slots.length - 1];
            }

            // Debug: mostrar estado actual - 🔴 THROTTLED (completamente opcional)
            const verbose = this.scene?.registry?.get('showSlotLogs') === true;
            const shouldLog = false; // hard-disable noisy update logs

            while (lastSlot && generatedThisFrame < MAX_GENERATIONS_PER_UPDATE) {
                // Calcular distancia desde el jugador hasta el final del último slot
                const distanceToLastSlot = playerY - lastSlot.yEnd;

                // Generar solo si el jugador está cerca del final del último slot
                // spawnBuffer ahora es 800px, así que generamos cuando el jugador está a 800px del final
                const spawnThreshold = lastSlot.yEnd + this.spawnBuffer;

                // Count slots that are ahead AND close to the player
                // OPTIMIZED: Use a simple loop with early exit when we find enough slots
                let slotsAhead = 0;
                const maxSlotsToCheck = MIN_SLOTS_AHEAD + 2; // Early exit optimization
                for (let i = 0; i < this.slots.length && slotsAhead < maxSlotsToCheck; i++) {
                    const s = this.slots[i];
                    if (s.yEnd < playerY) {
                        const distance = playerY - s.yEnd;
                        if (distance < LOOKAHEAD_DISTANCE) {
                            slotsAhead++;
                        }
                    }
                }
                const fewSlots = slotsAhead < MIN_SLOTS_AHEAD; // trigger generation sooner to avoid stalls

                // Generar solo si el jugador está por encima del threshold (más cerca del slot)
                // O si hay pocos slots adelante Y el jugador está relativamente cerca
                const shouldGenerate = playerY < spawnThreshold || (fewSlots && distanceToLastSlot < this.spawnBuffer * 1.2);
                if (verbose && shouldLog) {
                    console.log(`📍 Slots: ${this.slots.map(s => `[${s.yStart.toFixed(0)} to ${s.yEnd.toFixed(0)}]`).join(', ')}`);
                    console.log(`🔍 Check: playerY=${playerY.toFixed(2)}, threshold=${spawnThreshold.toFixed(2)}, slotsAhead=${slotsAhead}, shouldGen=${shouldGenerate}`);
                }

                if (shouldGenerate) {
                    if (verbose && shouldLog) {
                        console.log(`🎯 Generando slot: playerY=${playerY.toFixed(2)}, slotsAhead=${slotsAhead}, reason=${fewSlots ? 'FEW_SLOTS' : 'THRESHOLD'}`);
                    }
                    this.generateNextSlot();
                    generatedThisFrame++;
                    lastSlot = this.slots[this.slots.length - 1];
                } else {
                    if (verbose && shouldLog) {
                        console.log(`⏸️ NO generando: playerY=${playerY.toFixed(2)} >= threshold=${spawnThreshold.toFixed(2)}, slotsAhead=${slotsAhead} >= 2`);
                    }
                    break;
                }
            }

            // OPTIMIZATION: Only warn about max generations if debug is enabled
            if (generatedThisFrame >= MAX_GENERATIONS_PER_UPDATE && verbose) {
                console.warn(`[SlotGenerator] Max generations per frame reached (${MAX_GENERATIONS_PER_UPDATE}). Slots=${this.slots.length}`);
            }
        } catch (error) {
            console.error('❌ Error en SlotGenerator.update():', error);
        } finally {
            this.isGenerating = false;
        }

        // Cleanup slots viejos
        // OPTIMIZED: Use both player position AND riser (lava) position for cleanup
        // If lava has passed a slot, the player can never go back to it, so we can safely remove it
        const playerLimitY = (this.scene.player?.y || cameraTop) + this.cleanupDistance;

        // Get riser (lava) position - if it exists and has started rising, use it as cleanup limit
        let riserLimitY = playerLimitY; // Default to player limit
        const riser = this.scene.riserManager?.riser;
        if (riser && this.scene.riserManager?.hasStartedRising) {
            // Riser Y is the top of the riser (origin 0.5, 0)
            // Add a small safety margin (100px) to ensure we don't remove slots too early
            riserLimitY = riser.y - 100;
        }

        // Use the maximum (most aggressive cleanup) between player and riser limits
        // This ensures we clean up slots that are either:
        // 1. Below the player + cleanupDistance (traditional cleanup)
        // 2. Below the riser (lava has passed, player can't go back)
        const limitY = Math.max(playerLimitY, riserLimitY);
        this.cleanupOldSlots(limitY);

        // Safety: enforce original position for platforms to avoid drift (opt-in via enablePlatformLock)
        if (this.scene.registry?.get('enablePlatformLock')) {
            this.restorePlatformPositions();
        }

        // Debug: report transformer width vs camera
        if (this.scene.registry?.get('showSlotLogs') && this.scene.registry?.get('logBounds')) {
            const camWidth = this.scene.cameras?.main?.worldView?.width || this.scene.cameras?.main?.width;
            console.log('[SlotGenerator] widths => transformer:', this.transformer.gameWidth, 'camera:', camWidth);
        }

        // Debug: log if any platform drifted (position != initial)
        // OPTIMIZED: Only check drift if debug flags are enabled (throttled check)
        if (this.scene.registry?.get('showSlotLogs') && this.scene.registry?.get('logPlatformDrift')) {
            // Throttle drift checks to every 60 frames (1 second at 60fps) to reduce CPU usage
            if (!this._driftCheckFrame) this._driftCheckFrame = 0;
            this._driftCheckFrame++;
            if (this._driftCheckFrame >= 60) {
                this._driftCheckFrame = 0;
                const activePlatforms = this.scene.platformPool?.getActive?.() || [];
                const drifted = [];
                // OPTIMIZED: Use simple loop instead of filter
                for (let i = 0; i < activePlatforms.length; i++) {
                    const p = activePlatforms[i];
                    if ((p.initialY !== undefined && p.y !== p.initialY) ||
                        (p.initialX !== undefined && p.x !== p.initialX)) {
                        drifted.push(p);
                    }
                }
                if (drifted.length > 0) {
                    console.warn('[SlotGenerator] Drift detected on platforms:', drifted.map(p => ({
                        x: p.x, y: p.y, initX: p.initialX, initY: p.initialY
                    })));
                    console.trace('[SlotGenerator] Drift stack trace');
                }
            }
        }
    }

    /**
     * Limpia slots que quedaron muy abajo
     * @param {number} limitY - Y límite para cleanup
     */
    cleanupOldSlots(limitY) {
        // Solo desactivar si está explícitamente deshabilitado (no por showSlotLogs)
        if (this.scene.registry?.get('disableCleanup') || this.scene.disableCleanup) {
            return;
        }

        const slotsToRemove = this.slots.filter(slot => slot.yStart > limitY);

        if (slotsToRemove.length > 0) {
            const verbose = this.scene?.registry?.get('showSlotLogs');
            if (verbose) {
                console.log(`🧹 Limpiando ${slotsToRemove.length} slots viejos (limitY: ${limitY})`);
                slotsToRemove.forEach(slot => {
                    console.log(`  🗑️ SLOT ${slot.index} (${slot.type})`);
                });
            }

            // Remover del array
            this.slots = this.slots.filter(slot => slot.yStart <= limitY);

            // Delegar cleanup de objetos al LevelManager
            this.scene.levelManager.cleanupOnly(limitY);
        }
    }

    /**
     * Checks if a point overlaps with any maze wall.
     * @param {number} x 
     * @param {number} y 
     * @param {number} radius 
     */
    _overlapsMazeWall(x, y, radius = 16) {
        if (!this.scene.mazeWalls) return false;

        let overlap = false;
        // Use manual iteration as we want to return early if overlap found
        const walls = this.scene.mazeWalls.getChildren();
        for (const wall of walls) {
            if (!wall.active) continue;

            // Simple AABB overlap check
            const wLeft = wall.x - wall.displayWidth / 2;
            const wRight = wall.x + wall.displayWidth / 2;
            const wTop = wall.y - wall.displayHeight / 2;
            const wBottom = wall.y + wall.displayHeight / 2;

            if (x + radius > wLeft && x - radius < wRight &&
                y + radius > wTop && y - radius < wBottom) {
                overlap = true;
                break;
            }
        }
        return overlap;
    }

    /**
     * Limpia todos los slots y reinicia el generador
     */
    reset() {
        // OPTIMIZATION: Only log reset if debug is enabled
        if (this.scene?.registry?.get('showSlotLogs') === true) {
            console.log('🔄 SlotGenerator: Reiniciando...');
        }
        this.slots = [];
        this.currentSlotIndex = 0;
        // this.colorIndex = 0;  // Comentado: colores debug desactivados
    }

    /**
     * Reestablece la posición Y de las plataformas activas a su valor inicial para evitar desplazamientos
     */
    restorePlatformPositions() {
        const active = this.scene.platformPool?.getActive?.();
        if (!active) return;
        active.forEach(p => {
            if (p.initialY !== undefined && p.y !== p.initialY) {
                p.y = p.initialY;
                if (p.body) {
                    p.body.updateFromGameObject();
                    p.body.velocity.y = 0;
                }
            }
            if (p.initialX !== undefined && p.x !== p.initialX) {
                p.x = p.initialX;
                if (p.body) {
                    p.body.updateFromGameObject();
                    p.body.velocity.x = 0;
                }
            }
        });
    }
}
