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
import { PlatformSlotStrategy } from './strategies/PlatformSlotStrategy.js';
import { MazeSlotStrategy } from './strategies/MazeSlotStrategy.js';
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

        // Initialize Strategies
        this.strategies = {
            platform: new PlatformSlotStrategy(scene),
            maze: new MazeSlotStrategy(scene)
        };

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

        const slotType = layoutData.type;
        const verbose = this.scene?.registry?.get('showSlotLogs') === true;

        if (verbose) {
            console.log(`  ⚙️ Generating Slot ${this.currentSlotIndex} [${slotType}]...`);
        }

        // Select Strategy
        let strategy;
        if (slotType === 'MAZE') {
            strategy = this.strategies.maze;
        } else {
            strategy = this.strategies.platform; // Handles PLATFORM_BATCH and SAFE_ZONE
        }

        // Execute Strategy
        let result = null;
        try {
            result = strategy.generate(layoutData);
        } catch (e) {
            console.error(`❌ SlotGenerator: Strategy failed for type ${slotType}:`, e);
            return null;
        }

        if (verbose) {
            console.log(`📦 SLOT ${this.currentSlotIndex}: ${slotType}`);
        }

        // Register slot
        const slotData = {
            index: this.currentSlotIndex,
            type: slotType,
            yStart: layoutData.yStart,
            yEnd: layoutData.yEnd,
            height: layoutData.height,
            contentHeight: layoutData.height,
            slotHeight: layoutData.height,
            ...result
        };

        // Validate and insert
        if (slotData) {
            // VALIDACIÓN Y AUTO-CORRECCIÓN DE POSICIÓN
            const lastSlot = this.slots[this.slots.length - 1];
            if (lastSlot) {
                const gap = Math.abs(slotData.yStart - lastSlot.yEnd);
                if (gap > 0.1) {
                    if (verbose) {
                        console.warn(`⚠️ SLOT GAP detected. Fixing...`);
                    }
                    slotData.yStart = lastSlot.yEnd;
                    slotData.yEnd = slotData.yStart - slotData.height;
                    this.gridGenerator.lastSlotYEnd = slotData.yEnd;
                }
            }

            this.slots.push(slotData);
            this.currentSlotIndex++;

            if (verbose) {
                console.log(`✅ Slot ${this.currentSlotIndex - 1} registered.`);
            }
        } else {
            console.error(`❌ SLOT ERROR: Failed to generate Slot ${this.currentSlotIndex}.`);
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

        // Cleanup wall decorations (lightboxes, signs, etc.)
        this.scene.wallDecorManager?.cleanup(playerY, this.cleanupDistance);

        // Update parallax for wall decorations (depth effect)
        const cameraY = this.scene.cameras.main.scrollY;
        this.scene.wallDecorManager?.updateParallax(cameraY);

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
        this.slots = [];
        this.consecutiveMazes = 0;
        this.mazeCooldown = 0;
        this.isGenerating = false;

        // Wall Decor is now managed by ManagerInitializer/Scene lifecycle.
        // We do not destroy it here as it is a shared resource.
        if (this.scene.wallDecorManager && typeof this.scene.wallDecorManager.reset === 'function') {
            this.scene.wallDecorManager.reset();
        } else if (this.scene.wallDecorManager) {
            // Fallback: manually clear if no reset method exists yet (though destroy works, it might be too aggressive)
            // this.scene.wallDecorManager.destroy(); // DISABLED: Shared resource
        }

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
