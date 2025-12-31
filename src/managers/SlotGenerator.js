/**
 * SlotGenerator.js
 * 
 * Generador de slots para el sistema de nivel procedural.
 * Cada slot tiene 640px de altura y contiene un tipo específico de contenido.
 * 
 * Principios:
 * - Single Responsibility: Solo generación de slots
 * - Dependency Injection: Recibe scene y managers
 * - Separation of Concerns: Delega transformaciones y validaciones
 * 
 * Responsabilidades:
 * - Generar slots en secuencia
 * - Aplicar reglas de variedad
 * - Spawner plataformas con patrones transformados
 * - Cleanup de slots antiguos
 */

import { SLOT_CONFIG, getPlatformBounds } from '../config/SlotConfig.js';
import { PLATFORM_PATTERNS, getRandomPattern } from '../data/PlatformPatterns.js';
import { MAZE_PATTERNS_EASY, MAZE_PATTERNS_MEDIUM, MAZE_PATTERNS, MAZE_ROW_HEIGHT } from '../data/MazePatterns.js';
import { PatternTransformer } from '../utils/PatternTransformer.js';
import { COIN_BASE_SIZE } from '../prefabs/Coin.js';
import { POWERUP_BASE_SIZE } from '../prefabs/Powerup.js';
import { ENEMY_SIZE, PATROL_SPEED_DEFAULT } from '../prefabs/Enemy.js';

export class SlotGenerator {
    constructor(scene) {
        this.scene = scene;
        this.transformer = new PatternTransformer();
        
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
        
        // Flag para prevenir múltiples generaciones en el mismo frame
        this.isGenerating = false;
    }

    /**
     * Inicializa el generador y crea el primer batch
     * @param {number} startPlatformY - Y de la plataforma de inicio (default: 450)
     */
    init(startPlatformY = SLOT_CONFIG.rules.startPlatformY || 450) {
        console.log('🎮 SlotGenerator: Inicializando...');
        
        // Calcular Y inicial del primer batch: 160px por encima de la plataforma inicial
        this.startY = startPlatformY - SLOT_CONFIG.minVerticalGap;
        console.log(`  📍 Plataforma inicio: Y=${startPlatformY}, Primer batch: Y=${this.startY}`);
        
        // Generar slots iniciales (tutorial)
        for (let i = 0; i < SLOT_CONFIG.rules.tutorialSlots; i++) {
            this.generateNextSlot({ tutorialIndex: i });
        }
        
        console.log(`✅ SlotGenerator: ${this.slots.length} slots iniciales generados`);
    }

    /**
     * Genera el siguiente slot basado en reglas
     */
    generateNextSlot(options = {}) {
        // Calcular Y del slot usando el final del anterior menos el gap mínimo
        let slotYStart;
        if (this.slots.length === 0) {
            slotYStart = this.startY;
        } else {
            const lastSlot = this.slots[this.slots.length - 1];
            slotYStart = lastSlot.yEnd - SLOT_CONFIG.minVerticalGap;
        }

        const slotType = this.determineSlotType();
        let result = null;

        // Opciones para tutorial: patrones fijos y sin transform
        const forcePattern = options.forcePattern || null;
        const disableTransform = options.disableTransform || false;
        const tutorialIndex = options.tutorialIndex;

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

        const contentHeight = result?.contentHeight || SLOT_CONFIG.slotHeight;
        const slotHeight = contentHeight;
        const slotYEnd = slotYStart - slotHeight;
        
        console.log(`📦 SLOT ${this.currentSlotIndex}: ${slotType} [Y: ${slotYStart} a ${slotYEnd}] (contentHeight=${contentHeight})`);
        
        // Registrar slot
        this.slots.push({
            index: this.currentSlotIndex,
            type: slotType,
            yStart: slotYStart,
            yEnd: slotYEnd,
            height: slotHeight,
            contentHeight,
            ...result
        });

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
        // If tutorial, drop any platform that would end on the wall (keep inside bounds)
        if (isTutorial) {
            const bounds = getPlatformBounds();
            clampedPlatforms = clampedPlatforms.filter(p => p.x >= bounds.minX && p.x <= bounds.maxX);
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
        
        // Calcular límites para verificación
        // gameWidth=400, wallWidth=32, platformWidth=128, halfWidth=64
        const halfWidth = SLOT_CONFIG.platformWidth / 2; // 64
        const playableLeft = SLOT_CONFIG.wallWidth;  // 32
        const playableRight = SLOT_CONFIG.gameWidth - SLOT_CONFIG.wallWidth;  // 368
        const minX = playableLeft + halfWidth;   // 32 + 64 = 96
        const maxX = playableRight - halfWidth;  // 368 - 64 = 304
        
        console.log(`  🎨 Patrón: ${basePattern.name} | Transform: ${transform}`);
        console.log(`  📏 gameWidth=${SLOT_CONFIG.gameWidth}, Límites X: ${minX} - ${maxX}`);
        if (numMovingPlatforms > 0) {
            console.log(`  🔵 Plataformas móviles: ${numMovingPlatforms}`);
        }
        
        // ─────────────────────────────────────────────────────────────
        // PASO 1: Generar TODAS las plataformas primero
        // ─────────────────────────────────────────────────────────────
        const gap = SLOT_CONFIG.minVerticalGap;  // Siempre 160px
        let currentY = slotYStart;
        const spawnedPlatforms = [];  // Guardar posiciones para evitar colisiones con coins
        
        // Verificar que el slotYStart sea válido (no negativo infinito o NaN)
        if (!isFinite(slotYStart) || isNaN(slotYStart)) {
            console.error(`❌ ERROR: slotYStart inválido: ${slotYStart}`);
            return { patternName: 'ERROR', transform: 'none', platformCount: 0, movingPlatforms: 0 };
        }
        
        for (let i = 0; i < platformCount; i++) {
            const patternPlatform = clampedPlatforms[i % clampedPlatforms.length];
            
            // Verificar límites ANTES de spawn
            const leftEdge = patternPlatform.x - halfWidth;
            const rightEdge = patternPlatform.x + halfWidth;
            const isInBounds = leftEdge >= playableLeft && rightEdge <= playableRight;
            
            if (!isInBounds) {
                console.error(`  ❌ FUERA DE LÍMITES: x=${patternPlatform.x}, leftEdge=${leftEdge}, rightEdge=${rightEdge}`);
            }
            
            // Verificar que currentY sea válido
            if (!isFinite(currentY) || isNaN(currentY)) {
                console.error(`  ❌ ERROR: currentY inválido en plataforma ${i + 1}: ${currentY}`);
                break;
            }
            
            // SWAP: Determinar si esta plataforma será móvil o estática
            const isMoving = movingPlatformIndices.has(i);
            
            // Spawn platform (estática o móvil según swap)
            const platform = this.scene.levelManager.spawnPlatform(
                patternPlatform.x,
                currentY,
                SLOT_CONFIG.platformWidth,
                isMoving,  // isMoving = true si está en movingPlatformIndices
                MOVING_PLATFORM_SPEED
            );
            
            // Color debug comentado
            // if (platform) {
            //     platform.setTint(debugColor);
            // }
            
            // Guardar posición de la plataforma
            spawnedPlatforms.push({
                x: patternPlatform.x,
                y: currentY,
                width: SLOT_CONFIG.platformWidth,
                height: SLOT_CONFIG.platformHeight
            });
            
            const platType = isMoving ? '🔵 MÓVIL' : '🟣 ESTÁTICA';
            console.log(`    ▓ Plat ${i + 1}: x=${patternPlatform.x}, y=${currentY}, ${platType}, edges=[${leftEdge}, ${rightEdge}] ${isInBounds ? '✅' : '❌'}`);
            
            // ─────────────────────────────────────────────────────────────
            // SPAWN ENEMIGOS: Solo en plataformas ESTÁTICAS
            // ─────────────────────────────────────────────────────────────
            if (!isMoving && platform && platform.active) {
                const enemyChancePatrol = config.spawnChances.patrol || 0;
                const enemyChanceShooter = config.spawnChances.shooter || 0;
                const rand = Math.random();
                // Prefer patrol if both fire; evaluate independently
                if (enemyChancePatrol > 0 && rand < enemyChancePatrol) {
                    this.scene.time.delayedCall(200, () => {
                        const enemy = this.scene.levelManager.spawnPatrol(platform);
                        if (enemy && enemy.active) {
                            const platformHalfWidth = SLOT_CONFIG.platformWidth / 2;
                            const enemyHalfWidth = ENEMY_SIZE / 2;
                            const margin = 4;
                            const minX = platform.x - platformHalfWidth + enemyHalfWidth + margin;
                            const maxX = platform.x + platformHalfWidth - enemyHalfWidth - margin;
                            const patrolSpeed = PATROL_SPEED_DEFAULT;
                            
                            if (minX >= maxX) return;
                            
                            this.scene.time.delayedCall(300, () => {
                                if (enemy && enemy.active && enemy.body) {
                                    enemy.setPatrolBounds(minX, maxX, patrolSpeed);
                                    enemy.patrol(minX, maxX, patrolSpeed);
                                }
                            });
                        }
                    });
                } else if (enemyChanceShooter > 0 && rand < enemyChancePatrol + enemyChanceShooter) {
                    this.scene.time.delayedCall(200, () => {
                        this.scene.levelManager.spawnShooter(platform);
                    });
                }
            }
            
            // Siguiente Y (siempre 160px arriba)
            currentY -= gap;
        }
        
        // ─────────────────────────────────────────────────────────────
        // PASO 2: Generar ITEMS (Coins + Powerups con sistema de swap)
        // ─────────────────────────────────────────────────────────────
        const ITEM_SIZE = Math.max(COIN_BASE_SIZE, POWERUP_BASE_SIZE);           // Tamaño base del sprite (32x32px)
        const ITEM_HALF = ITEM_SIZE / 2; // 16px
        const ITEM_DISTANCE = 128;       // Radio de distancia mínima entre items
        
        // Config de POWERUP
        const isDev = this.scene.registry?.get('isDevMode');
        const POWERUP_MIN_DISTANCE = isDev ? 0 : 3000;  // 300m en unidades Y
        const POWERUP_COOLDOWN = isDev ? 0 : 15000;     // 15 segundos
        const POWERUP_CHANCE = isDev ? 0.5 : 0.08;      // boost en dev
        
        // Lista de TODOS los items generados (coins + powerups)
        const allGeneratedItems = [];
        
        // Función para verificar distancia con otros items
        const tooCloseToOtherItems = (x, y) => {
            for (const existing of allGeneratedItems) {
                const dist = Math.sqrt(Math.pow(x - existing.x, 2) + Math.pow(y - existing.y, 2));
                if (dist < ITEM_DISTANCE) {
                    return true;
                }
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
            const distanceOk = (currentHeight - lastHeight) >= POWERUP_MIN_DISTANCE;
            
            // Condición 2: Cooldown de 15 segundos
            const cooldownOk = (now - lastTime) >= POWERUP_COOLDOWN;
            
            // Condición 3: Random chance (8%)
            const chanceOk = Math.random() < POWERUP_CHANCE;
            
            return distanceOk && cooldownOk && chanceOk;
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
                
                console.log(`    ⚡ POWERUP spawned at (${x}, ${y})`);
                return true;
            }
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
                const itemX = plat.x;
                
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
        const leftWallX = playableLeft + 40;   // 32 + 40 = 72
        const rightWallX = playableRight - 40; // 368 - 40 = 328
        
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
        
        // Calcular altura real del contenido (mínima Y relativa)
        const minOffset = Math.min(...clampedPlatforms.map(p => p.y));
        const contentHeight = Math.abs(minOffset) + SLOT_CONFIG.platformHeight;

        return {
            patternName: basePattern.name,
            transform,
            platformCount,
            movingPlatforms: numMovingPlatforms,
            contentHeight
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
            while (lastSlot) {
                const spawnThreshold = lastSlot.yEnd + this.spawnBuffer;
                if (playerY < spawnThreshold) {
                    this.generateNextSlot();
                    lastSlot = this.slots[this.slots.length - 1];
                } else {
                    break;
                }
            }
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
     * Limpia todos los slots y reinicia el generador
     */
    reset() {
        console.log('🔄 SlotGenerator: Reiniciando...');
        this.slots = [];
        this.currentSlotIndex = 0;
        // this.colorIndex = 0;  // Comentado: colores debug desactivados
    }
}
