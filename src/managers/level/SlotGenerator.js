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
     * @param {number} startPlatformY - Y de la plataforma de inicio (default: 450)
     */
    init(startPlatformY = SLOT_CONFIG.rules.startPlatformY || 450) {
        console.log('🎮 SlotGenerator: Inicializando...');

        // Calcular Y inicial del primer batch usando slotGap
        this.startY = startPlatformY - SLOT_CONFIG.slotGap;
        console.log(`  📍 Plataforma inicio: Y=${startPlatformY}, Primer batch: Y=${this.startY}`);

        // Initialize GridGenerator with start position
        this.gridGenerator.reset(this.startY);

        // Generar slots iniciales (tutorial)
        for (let i = 0; i < SLOT_CONFIG.rules.tutorialSlots; i++) {
            this.generateNextSlot({ tutorialIndex: i });
        }
        // Garantizar al menos 3 slots iniciales para evitar huecos de arranque
        while (this.slots.length < 3) {
            this.generateNextSlot();
        }

        console.log(`✅ SlotGenerator: ${this.slots.length} slots iniciales generados`);
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

        // Get layout from GridGenerator (pure logic)
        const layoutData = this.gridGenerator.nextSlot();

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

        // Render based on type
        switch (slotType) {
            case 'PLATFORM_BATCH':
                result = this.generatePlatformBatch(slotYStart, slotType, { forcePattern, disableTransform, tutorialIndex });
                break;
            case 'SAFE_ZONE':
                result = this.generatePlatformBatch(slotYStart, slotType, { forcePattern, disableTransform, tutorialIndex });
                break;
            case 'MAZE':
                result = this.generateMaze(slotYStart);
                break;
            default:
                console.warn(`⚠️ Tipo de slot desconocido: ${slotType}, usando PLATFORM_BATCH`);
                result = this.generatePlatformBatch(slotYStart, 'PLATFORM_BATCH', { forcePattern, disableTransform });
        }

        const verbose = this.scene?.registry?.get('showSlotLogs');
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

        this.slots.push(slotData);

        // Log del slot registrado para debugging
        if (verbose || this.slots.length <= 2) {
            console.log(`✅ Slot ${this.currentSlotIndex} registrado:`, {
                type: slotType,
                yStart: slotYStart.toFixed(2),
                yEnd: slotYEnd.toFixed(2),
                height: slotHeight.toFixed(2),
                contentHeight: slotHeight.toFixed(2)
            });
        }

        this.currentSlotIndex++;
    }

    /**
     * Determina qué tipo de slot generar (con reglas de variedad)
     * @returns {string} Tipo de slot
     */
    determineSlotType() {
        // Slots iniciales tutorial: todos plataformas
        if (this.currentSlotIndex < SLOT_CONFIG.rules.tutorialSlots) {
            // Forzar maze en el segundo slot si hay tutorial (para pruebas)
            if (this.currentSlotIndex === 1) return 'MAZE';
            return 'PLATFORM_BATCH';
        }

        // Distribución aleatoria: 50% plataforma, 20% safe, 30% maze
        const r = Math.random();
        if (r < 0.5) return 'PLATFORM_BATCH';
        if (r < 0.7) return 'SAFE_ZONE';
        return 'MAZE';
    }

    /**
     * Genera un batch de plataformas dentro del slot
     * @param {number} slotYStart - Y inicial del slot
     * @param {string} slotType - Tipo de slot (PLATFORM_BATCH o SAFE_ZONE)
     * @returns {Object} Información del batch generado
     */
    generatePlatformBatch(slotYStart, slotType, options = {}) {
        const config = SLOT_CONFIG.types[slotType];
        const platformCount = 4;  // 640 / 160 = 4 plataformas por slot
        const isTutorial = options.tutorialIndex !== undefined;

        // 1) Seleccionar patrón
        let basePattern;
        const fallbackPattern = isTutorial
            ? PLATFORM_PATTERNS.find(p => p.name === 'column_alternating') || getRandomPattern()
            : getRandomPattern();
        basePattern = options.forcePattern
            ? PLATFORM_PATTERNS.find(p => p.name === options.forcePattern) || fallbackPattern
            : fallbackPattern;

        // 2) Aplicar transformación (omitida en tutorial para evitar merges)
        let platforms;
        let transform = 'none';
        if (options.disableTransform || isTutorial) {
            platforms = basePattern.platforms;
        } else {
            const transformed = this.transformer.randomTransform(
                basePattern.platforms,
                config.transformWeights
            );
            platforms = transformed.platforms;
            transform = transformed.transform;
        }

        // 3) Ajustar plataformas a límites
        let clampedPlatforms = this.transformer.clampToBounds(platforms);
        const boundsPlatform = getPlayableBounds(this.scene, SLOT_CONFIG.platformWidth);
        const gameWidth = boundsPlatform.width;
        if (!clampedPlatforms || clampedPlatforms.length === 0) {
            console.warn('⚠️ Patrón vacío tras clamp; usando patrón original');
            clampedPlatforms = platforms;
        }
        // If tutorial, drop any platform that would end on the wall (keep inside bounds)
        if (isTutorial) {
            clampedPlatforms = clampedPlatforms.filter(p => p.x >= boundsPlatform.minX && p.x <= boundsPlatform.maxX);
            if (clampedPlatforms.length === 0) {
                clampedPlatforms = platforms;
            }
        }

        // 4) Sistema de SWAP para plataformas móviles
        // Porcentaje de chance de tener plataformas móviles por slot
        const MOVING_PLATFORM_CHANCE = isTutorial ? 0 : 0.35;  // Sin móviles en tutorial
        const MOVING_PLATFORM_SPEED = 100;    // Velocidad de movimiento

        // Determinar cuántas plataformas móviles tendrá este slot (0, 1 o 2)
        let numMovingPlatforms = 0;
        if (Math.random() < MOVING_PLATFORM_CHANCE) {
            // Si aplica, puede tener 1 o 2 plataformas móviles
            numMovingPlatforms = Phaser.Math.Between(1, 2);
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

        // Calcular límites para verificación (alineados con LevelManager)
        const halfWidth = SLOT_CONFIG.platformWidth / 2; // 64
        const minX = boundsPlatform.minX;
        const maxX = boundsPlatform.maxX;
        const centerX = boundsPlatform.centerX;

        console.log(`  🎨 Patrón: ${basePattern.name} | Transform: ${transform}`);
        console.log(`  📏 gameWidth=${gameWidth}, Límites X: ${minX} - ${maxX}`);
        if (numMovingPlatforms > 0) {
            console.log(`  🔵 Plataformas móviles: ${numMovingPlatforms}`);
        }

        // ─────────────────────────────────────────────────────────────
        // PASO 1: Generar TODAS las plataformas primero
        // ─────────────────────────────────────────────────────────────
        const gap = SLOT_CONFIG.minVerticalGap;  // Siempre 160px
        let currentY = slotYStart;
        const spawnedPlatforms = [];  // Guardar posiciones para evitar colisiones con coins
        const verbose = this.scene?.registry?.get('showSlotLogs');

        // Verificar que el slotYStart sea válido (no negativo infinito o NaN)
        if (!isFinite(slotYStart) || isNaN(slotYStart)) {
            console.error(`❌ ERROR: slotYStart inválido: ${slotYStart}`);
            return { patternName: 'ERROR', transform: 'none', platformCount: 0, movingPlatforms: 0, contentHeight: SLOT_CONFIG.slotHeight };
        }

        // Log inicial del slot para debugging
        if (verbose) {
            console.log(`  📍 Slot Y: ${slotYStart.toFixed(2)}, Gap: ${gap}px, Platformas: ${platformCount}`);
        }

        for (let i = 0; i < platformCount; i++) {
            const patternPlatform = clampedPlatforms[i % clampedPlatforms.length];
            if (!patternPlatform) {
                console.error('❌ Plataforma inválida en patrón/clamp', clampedPlatforms);
                continue;
            }
            let spawnX = patternPlatform?.x;
            // Fallback si viene NaN/undefined
            if (!isFinite(spawnX)) {
                spawnX = centerX;
            }

            // Clamp duro a límites jugables antes de spawnear
            const clampedX = Phaser.Math.Clamp(spawnX, minX, maxX);
            const wasClamped = clampedX !== spawnX;
            spawnX = clampedX;

            // Verificar límites ANTES de spawn
            const leftEdge = spawnX - halfWidth;
            const rightEdge = spawnX + halfWidth;
            const isInBounds = spawnX >= minX && spawnX <= maxX;

            if (!isInBounds) {
                console.error(`  ❌ FUERA DE LÍMITES: x=${patternPlatform.x}, leftEdge=${leftEdge}, rightEdge=${rightEdge}`);
            } else if (wasClamped && this.scene?.registry?.get('showSlotLogs')) {
                console.warn(`  ⚙️ Clamp X plataforma: ${patternPlatform.x} → ${spawnX}`);
            }

            // Verificar que currentY sea válido
            if (!isFinite(currentY) || isNaN(currentY)) {
                console.error(`  ❌ ERROR: currentY inválido en plataforma ${i + 1}: ${currentY}`);
                break;
            }

            // SWAP: Determinar si esta plataforma será móvil o estática
            const isMoving = movingPlatformIndices.has(i);

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
                platform = this.scene.physics.add.staticSprite(spawnX, currentY, 'platform');
                platform.setDisplaySize(SLOT_CONFIG.platformWidth, SLOT_CONFIG.platformHeight).refreshBody();
                this.scene.platforms?.add(platform, true);
            }

            // Color debug comentado
            // if (platform) {
            //     platform.setTint(debugColor);
            // }

            // Guardar posición de la plataforma
            spawnedPlatforms.push({
                x: spawnX,
                y: currentY,
                width: SLOT_CONFIG.platformWidth,
                height: SLOT_CONFIG.platformHeight
            });

            const platType = isMoving ? '🔵 MÓVIL' : '🟣 ESTÁTICA';
            if (verbose) {
                console.log(`    ▓ Plat ${i + 1}: x=${spawnX}, y=${currentY}, ${platType}, edges=[${leftEdge}, ${rightEdge}] ${isInBounds ? '✅' : '❌'}`);
            }

            // ─────────────────────────────────────────────────────────────
            // SPAWN ENEMIGOS: Delegado a EnemySpawnStrategy
            // ─────────────────────────────────────────────────────────────
            this.enemySpawnStrategy.trySpawn(platform, {
                isMoving: isMoving,
                spawnChances: config.spawnChances
            });

            // Siguiente Y (siempre 160px arriba)
            const previousY = currentY;
            currentY -= gap;

            // Validar que el cálculo de Y sea correcto
            if (!isFinite(currentY) || isNaN(currentY)) {
                console.error(`  ❌ ERROR: currentY inválido después de plataforma ${i + 1}. previousY=${previousY}, gap=${gap}`);
                break;
            }

            // Validar que el gap sea correcto
            const actualGap = previousY - currentY;
            if (Math.abs(actualGap - gap) > 1) {
                console.warn(`  ⚠️ Gap inesperado en plataforma ${i + 1}. Esperado: ${gap}, Actual: ${actualGap.toFixed(2)}`);
            }
        }

        // Fallback duro: si no se generó ninguna plataforma (por clamps extremos), crear un set seguro al centro
        if (spawnedPlatforms.length === 0) {
            const gameWidth = this.scene.cameras.main.width;
            const centerSafe = Phaser.Math.Clamp(getPlatformBounds(gameWidth).centerX, minX, maxX);
            let fbY = slotYStart;
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
                    if (verbose) {
                        console.warn(`  ⚠️ Fallback plataforma segura añadida en slot (x=${centerSafe}, y=${fbY})`);
                    }
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
        const POWERUP_MIN_DISTANCE = isDev ? 0 : 600;   // 60m en unidades Y (más temprano)
        const POWERUP_COOLDOWN = isDev ? 0 : 6000;      // 6 segundos
        const POWERUP_CHANCE = isDev ? 0.5 : (SLOT_CONFIG.types?.PLATFORM?.spawnChances?.powerups ?? 0.25);
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

            // Condición 1: Distancia mínima de 300m (3000 unidades)
            const distanceDelta = currentHeight - lastHeight;
            const distanceOk = distanceDelta >= POWERUP_MIN_DISTANCE;

            // Condición 2: Cooldown de 15 segundos
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
                console.warn('SlotGenerator: no se pudo spawnar coin (pool vacío o maxSize alcanzado)');
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
                const itemY = platformTop - ITEM_HALF - 4;
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
        const slotTop = slotYStart - this.slotHeight + 60;
        const slotBottom = slotYStart - 60;

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
        if (totalItems > 0) {
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
            const actualHeight = (slotYStart - highestY) + SLOT_CONFIG.platformHeight;

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
            patternName: basePattern.name,
            transform,
            platformCount,
            movingPlatforms: numMovingPlatforms,
            contentHeight: contentHeight
        };
    }

    /**
     * Genera un maze dentro del slot (deshabilitado por ahora)
     * @param {number} slotYStart - Y inicial del slot
     * @returns {Object} Información del maze generado
     */
    generateMaze(slotYStart, slotHeightOverride = null) {
        const config = SLOT_CONFIG.types.MAZE;
        const rowCount = config.rowCount || 5;
        const rowHeight = config.rowHeight || MAZE_ROW_HEIGHT;
        const rowGap = config.rowGap || 100;
        const slotHeight = slotHeightOverride || (rowCount * rowHeight + (rowCount - 1) * rowGap);
        const slotYEnd = slotYStart - slotHeight;

        const patternPool = [...MAZE_PATTERNS_EASY, ...MAZE_PATTERNS_MEDIUM];
        let pattern = patternPool[Math.floor(Math.random() * patternPool.length)] || MAZE_PATTERNS[0];
        const mazeColors = [0xff7777, 0x77ff77, 0x7777ff, 0xffcc66, 0x66ccff];
        const color = mazeColors[this.currentSlotIndex % mazeColors.length];

        console.log(`  🌀 Generando MAZE [${rowCount} filas] (Y: ${slotYStart} a ${slotYEnd})`);

        // Aplicar transformaciones simples a la secuencia de filas
        const tWeights = config.transformWeights || { none: 1 };
        const r = Math.random();
        const mirrorX = r < (tWeights.mirrorX || 0);
        const mirrorY = !mirrorX && r < ((tWeights.mirrorX || 0) + (tWeights.mirrorY || 0)); // prioridad mirrorX

        let rowsToUse = pattern;
        if (mirrorY) {
            rowsToUse = [...pattern].reverse();
        }

        // Retirar walls existentes solo dentro del rango de este maze para evitar solapes puntuales
        if (this.scene.mazeWalls) {
            const slotYEnd = slotYStart - slotHeight;
            this.scene.mazeWalls.children.each(wall => {
                if (wall.active && wall.y <= slotYStart + 1 && wall.y >= slotYEnd - 1) {
                    wall.destroy();
                }
            });
        }

        // Presupuesto de enemigos por maze (con chance global por maze)
        const mazeSpawnConfig = SLOT_CONFIG?.types?.MAZE?.spawnChances || {};
        const enemyCountCfg = mazeSpawnConfig.enemyCount || { min: 1, max: 2 };
        const enemyChance = (mazeSpawnConfig.enemies ?? 0) / 100;
        const spawnEnemiesThisMaze = Math.random() < enemyChance;
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
            const rowY = slotYStart - (row * (rowHeight + rowGap));
            let rowConfig = rowsToUse[row % rowsToUse.length];
            if (mirrorX) {
                rowConfig = { ...rowConfig };
                if (rowConfig.type === 'left') rowConfig.type = 'right';
                else if (rowConfig.type === 'right') rowConfig.type = 'left';
                else if (rowConfig.type === 'split') {
                    const w1 = rowConfig.width;
                    rowConfig.width = rowConfig.width2;
                    rowConfig.width2 = w1;
                }
            }
            this.scene.levelManager.spawnMazeRowFromConfig(
                rowY,
                rowConfig,
                false, // allowMoving
                true,  // allowSpikes / enemies en maze
                row,
                rowsToUse,
                color,
                enemyBudget,
                coinBudget
            );
        }

        return {
            rowCount,
            patternName: `MAZE_${MAZE_PATTERNS.indexOf(pattern) + 1 || 1}`,
            patternLength: pattern.length,
            contentHeight: slotHeight
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

        // Generar tantos slots como sean necesarios para mantener el buffer
        try {
            this.isGenerating = true;
            let lastSlot = this.slots[this.slots.length - 1];

            // Si no hay slots, generar el primero
            if (!lastSlot) {
                console.warn('⚠️ SlotGenerator: No hay slots, generando primero...');
                this.generateNextSlot();
                lastSlot = this.slots[this.slots.length - 1];
            }

            // Debug: mostrar estado actual (solo para primeros slots)
            if (this.slots.length <= 2) {
                const playerHeight = Math.floor((400 - playerY) / 10);
                // Log verbose only when registry flag is true
                const verbose = this.scene.registry.get('showSlotLogs');
                if (verbose) {
                    console.log(`📊 SlotGenerator update: slots=${this.slots.length}, playerY=${playerY.toFixed(2)}, playerHeight=${playerHeight}m, lastSlot.yEnd=${lastSlot ? lastSlot.yEnd.toFixed(2) : 'N/A'}`);
                }
            }

            while (lastSlot) {
                // Calcular threshold: cuando el jugador está a spawnBuffer px del final del slot
                // En Phaser, Y aumenta hacia abajo, así que:
                // - playerY negativo = más arriba
                // - lastSlot.yEnd es negativo (más arriba que yStart)
                // - spawnThreshold debe estar más abajo (más positivo) que yEnd para generar antes
                // - Cuando el jugador sube (playerY disminuye), eventualmente llegará al threshold
                // - Generamos cuando playerY está cerca de yEnd (dentro del buffer)
                const spawnThreshold = lastSlot.yEnd + this.spawnBuffer; // Más abajo que yEnd

                // Si el jugador está más arriba (Y más negativo/más pequeño) que el threshold, generar nuevo slot
                // Esto significa que el jugador se acercó lo suficiente al final del slot
                // playerY < spawnThreshold significa que el jugador está más arriba que el threshold
                const distanceToThreshold = Math.abs(spawnThreshold - playerY);
                // FAILSAFE: Si tenemos pocos slots activos (menos de 2 ahead), forzar generación
                const fewSlots = this.slots.filter(s => s.yStart < playerY).length < 2;

                if (playerY < spawnThreshold || fewSlots) {
                    if (this.scene?.registry?.get('showSlotLogs')) {
                        console.log(`🎯 Generando slot: playerY=${playerY.toFixed(2)}, threshold=${spawnThreshold.toFixed(2)}, reason=${fewSlots ? 'FEW_SLOTS' : 'THRESHOLD'}`);
                    }
                    this.generateNextSlot();
                    lastSlot = this.slots[this.slots.length - 1];
                } else {
                    // Debug: mostrar por qué no se genera
                    const verbose = this.scene?.registry?.get('showSlotLogs');
                    if (verbose && this.slots.length === 1) {
                        console.log(`⏸️ No generando slot: playerY=${playerY.toFixed(2)}, lastSlot.yEnd=${lastSlot.yEnd.toFixed(2)}, threshold=${spawnThreshold.toFixed(2)}, diff=${(spawnThreshold - playerY).toFixed(2)}`);
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('❌ Error en SlotGenerator.update():', error);
        } finally {
            this.isGenerating = false;
        }

        // Cleanup slots viejos
        const limitY = cameraTop + this.cleanupDistance;
        this.cleanupOldSlots(limitY);
    }

    /**
     * Limpia slots que quedaron muy abajo
     * @param {number} limitY - Y límite para cleanup
     */
    cleanupOldSlots(limitY) {
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
        console.log('🔄 SlotGenerator: Reiniciando...');
        this.slots = [];
        this.currentSlotIndex = 0;
        // this.colorIndex = 0;  // Comentado: colores debug desactivados
    }
}
