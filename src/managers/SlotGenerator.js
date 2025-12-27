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
import { PatternTransformer } from '../utils/PatternTransformer.js';

export class SlotGenerator {
    constructor(scene) {
        this.scene = scene;
        this.transformer = new PatternTransformer();
        
        // Estado
        this.currentSlotIndex = 0;
        this.slots = [];  // Historial de slots generados
        // this.colorIndex = 0;  // Comentado: colores debug desactivados
        
        // Offset inicial: primera plataforma del batch empieza arriba de la plataforma de inicio
        // Plataforma de inicio está en Y=450, gap mínimo es 160px
        // Entonces primera plataforma del batch: 450 - 160 = 290
        this.startY = 290;  // Y inicial del primer batch
        
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
    init(startPlatformY = 450) {
        console.log('🎮 SlotGenerator: Inicializando...');
        
        // Calcular Y inicial del primer batch (arriba de la plataforma de inicio)
        this.startY = startPlatformY - SLOT_CONFIG.minVerticalGap;  // 450 - 160 = 290
        console.log(`  📍 Plataforma inicio: Y=${startPlatformY}, Primer batch: Y=${this.startY}`);
        
        // Generar 3 slots iniciales (tutorial)
        for (let i = 0; i < SLOT_CONFIG.rules.tutorialSlots; i++) {
            this.generateNextSlot();
        }
        
        console.log(`✅ SlotGenerator: ${this.slots.length} slots iniciales generados`);
    }

    /**
     * Genera el siguiente slot basado en reglas
     */
    generateNextSlot() {
        // Calcular Y del slot usando startY como referencia
        // Slot 0: startY (290)
        // Slot 1: startY - 640 = -350
        // Slot 2: startY - 1280 = -990
        
        // Verificar que no haya un slot ya generado en esta posición
        const expectedSlotYStart = this.startY - (this.currentSlotIndex * this.slotHeight);
        const expectedSlotYEnd = expectedSlotYStart - this.slotHeight;
        
        // Verificar si ya existe un slot en esta posición (prevenir duplicados)
        const existingSlot = this.slots.find(slot => 
            Math.abs(slot.yStart - expectedSlotYStart) < 10  // Tolerancia de 10px
        );
        
        if (existingSlot) {
            console.warn(`⚠️ Slot ya existe en Y=${expectedSlotYStart}, saltando generación`);
            this.currentSlotIndex++;
            return;
        }
        
        const slotYStart = expectedSlotYStart;
        const slotYEnd = expectedSlotYEnd;
        const slotType = this.determineSlotType();
        
        console.log(`📦 SLOT ${this.currentSlotIndex}: ${slotType} [Y: ${slotYStart} a ${slotYEnd}]`);
        
        let result = null;
        
        switch (slotType) {
            case 'PLATFORM_BATCH':
                result = this.generatePlatformBatch(slotYStart, slotType);
                break;
            case 'SAFE_ZONE':
                result = this.generatePlatformBatch(slotYStart, slotType);
                break;
            case 'MAZE':
                result = this.generateMaze(slotYStart);
                break;
            default:
                console.warn(`⚠️ Tipo de slot desconocido: ${slotType}, usando PLATFORM_BATCH`);
                result = this.generatePlatformBatch(slotYStart, 'PLATFORM_BATCH');
        }
        
        // Registrar slot
        this.slots.push({
            index: this.currentSlotIndex,
            type: slotType,
            yStart: slotYStart,
            yEnd: slotYEnd,
            ...result
        });
        
        this.currentSlotIndex++;
    }

    /**
     * Determina qué tipo de slot generar (con reglas de variedad)
     * @returns {string} Tipo de slot
     */
    determineSlotType() {
        // REGLA 1: Primeros 3 slots siempre PLATFORM_BATCH (tutorial)
        if (this.currentSlotIndex < SLOT_CONFIG.rules.tutorialSlots) {
            return 'PLATFORM_BATCH';
        }
        
        // REGLA 2: No más de N slots consecutivos del mismo tipo
        const lastSlots = this.slots.slice(-SLOT_CONFIG.rules.maxConsecutiveSameType);
        if (lastSlots.length >= SLOT_CONFIG.rules.maxConsecutiveSameType) {
            const allSame = lastSlots.every(s => s.type === lastSlots[0].type);
            if (allSame) {
                // Forzar un tipo diferente
                const availableTypes = ['PLATFORM_BATCH', 'SAFE_ZONE'];  // MAZE deshabilitado
                return availableTypes.find(t => t !== lastSlots[0].type) || 'PLATFORM_BATCH';
            }
        }
        
        // REGLA 3: Distribución general (por ahora solo PLATFORM_BATCH y SAFE_ZONE)
        const rand = Math.random();
        if (rand < 0.7) {
            return 'PLATFORM_BATCH';
        } else {
            return 'SAFE_ZONE';
        }
    }

    /**
     * Genera un batch de plataformas dentro del slot
     * @param {number} slotYStart - Y inicial del slot
     * @param {string} slotType - Tipo de slot (PLATFORM_BATCH o SAFE_ZONE)
     * @returns {Object} Información del batch generado
     */
    generatePlatformBatch(slotYStart, slotType) {
        const config = SLOT_CONFIG.types[slotType];
        const platformCount = 4;  // Siempre 4 plataformas (640 / 160 = 4)
        
        // 1) Seleccionar patrón aleatorio
        const basePattern = getRandomPattern();
        
        // 2) Aplicar transformación aleatoria
        const { platforms, transform } = this.transformer.randomTransform(
            basePattern.platforms,
            config.transformWeights
        );
        
        // 3) Ajustar plataformas a límites
        const clampedPlatforms = this.transformer.clampToBounds(platforms);
        
        // 4) Sistema de SWAP para plataformas móviles
        // Porcentaje de chance de tener plataformas móviles por slot
        const MOVING_PLATFORM_CHANCE = 0.35;  // 35% de chance por slot
        const MOVING_PLATFORM_SPEED = 100;     // Velocidad de movimiento
        
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
            
            // Siguiente Y (siempre 160px arriba)
            currentY -= gap;
        }
        
        // ─────────────────────────────────────────────────────────────
        // PASO 2: Generar ITEMS (Coins + Powerups con sistema de swap)
        // ─────────────────────────────────────────────────────────────
        const ITEM_SIZE = 32;           // Tamaño del sprite (32x32px)
        const ITEM_HALF = ITEM_SIZE / 2; // 16px
        const ITEM_DISTANCE = 128;       // Radio de distancia mínima entre items
        
        // Config de POWERUP
        const POWERUP_MIN_DISTANCE = 3000;  // 300m en unidades Y
        const POWERUP_COOLDOWN = 15000;     // 15 segundos
        const POWERUP_CHANCE = 0.08;        // 8% de chance cuando aplica
        
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
        
        // Función para spawnar un POWERUP (usa powerup_ball existente)
        const spawnPowerup = (x, y) => {
            const powerup = this.scene.powerups.create(x, y, 'powerup_ball');
            if (powerup) {
                powerup.setDisplaySize(ITEM_SIZE, ITEM_SIZE);
                powerup.setDepth(10);
                // powerup_ball ya tiene su textura de basketball, no necesita tint
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
        const spawnCoin = (x, y) => {
            const coin = this.scene.coins.create(x, y, 'coin');
            if (coin) {
                coin.setDisplaySize(ITEM_SIZE, ITEM_SIZE);
                coin.setDepth(10);
                allGeneratedItems.push({ x, y, type: 'coin' });
                return true;
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
        
        return {
            patternName: basePattern.name,
            transform,
            platformCount,
            movingPlatforms: numMovingPlatforms
        };
    }

    /**
     * Genera un maze dentro del slot (deshabilitado por ahora)
     * @param {number} slotYStart - Y inicial del slot
     * @returns {Object} Información del maze generado
     */
    generateMaze(slotYStart) {
        const config = SLOT_CONFIG.types.MAZE;
        const slotYEnd = slotYStart - config.height;
        
        console.log(`  🌀 MAZE deshabilitado (Y: ${slotYStart} a ${slotYEnd})`);
        
        // TODO: Implementar cuando mazes estén listos
        // for (let row = 0; row < config.rowCount; row++) {
        //     const rowY = slotYStart - (row * config.rowHeight);
        //     this.scene.levelManager.spawnMazeRow(rowY);
        // }
        
        return {
            rowCount: config.rowCount,
            disabled: true
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
        
        // Generar nuevo slot si el jugador está cerca del último
        const lastSlot = this.slots[this.slots.length - 1];
        if (lastSlot) {
            const spawnThreshold = lastSlot.yEnd + this.spawnBuffer;
            
            if (playerY < spawnThreshold) {
                this.isGenerating = true;
                this.generateNextSlot();
                this.isGenerating = false;
            }
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
            console.log(`🧹 Limpiando ${slotsToRemove.length} slots viejos (limitY: ${limitY})`);
            
            slotsToRemove.forEach(slot => {
                console.log(`  🗑️ SLOT ${slot.index} (${slot.type})`);
            });
            
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

