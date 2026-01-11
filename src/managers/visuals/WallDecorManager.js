import { WALL_DECOR_CONFIG, getRandomDecorationType, getRandomFrameForType, getWallInsetX } from '../../config/WallDecorConfig.js';
import { WallDecorFactory } from './decorations/WallDecorFactory.js';
import { DecorRules } from './rules/DecorRules.js';
import { LightBugInteractable } from '../gameplay/interactables/LightBugInteractable.js';

/**
 * WallDecorManager.js
 * 
 * Gestiona la generación y limpieza de decoraciones de pared (lightboxes, señales, etc.)
 * 
 * Principios:
 * - Single Responsibility: Solo maneja decoraciones de pared
 * - DRY: Usa configuración centralizada
 * - Separation of Concerns: No maneja slots ni plataformas
 */

export class WallDecorManager {
    constructor(scene) {
        this.scene = scene;
        this.decorations = []; // Array de todas las decoraciones activas (BaseWallDecoration)
        this.gameWidth = scene.game.config.width;
    }

    /**
     * Genera decoraciones de pared para un slot
     * @param {number} slotY - Posición Y del slot
     * @param {number} slotHeight - Altura del slot
     */
    generateForSlot(slotY, slotHeight) {
        // Verificar si estamos dentro del delay de inicio
        // slotY es negativo (sube hacia arriba), así que verificamos si está por encima del delay
        const stageFloorY = this.scene.scale.height - 32; // Floor Y position
        const distanceFromFloor = stageFloorY - slotY; // Distancia positiva hacia arriba

        if (distanceFromFloor < WALL_DECOR_CONFIG.spawnStartDelay) {
            return; // No generar decoraciones aún (muy cerca del floor)
        }

        // Verificar probabilidad de spawn
        if (Math.random() > WALL_DECOR_CONFIG.spawnChance) {
            return; // No generar decoraciones en este slot
        }

        // Determinar cantidad de decoraciones
        const { min, max } = WALL_DECOR_CONFIG.perSlot;
        const count = Phaser.Math.Between(min, max);

        // Tracking para este slot
        const slotDecorations = [];
        const usedFrames = new Set(); // Para evitar repetir frames

        // Generar decoraciones
        for (let i = 0; i < count; i++) {
            this.spawnDecoration(slotY, slotHeight, i, count, slotDecorations, usedFrames, distanceFromFloor);
        }
    }

    /**
     * Genera una decoración individual
     * @param {number} slotY - Posición Y del slot
     * @param {number} slotHeight - Altura del slot
     * @param {number} index - Índice de la decoración en el slot
     * @param {number} total - Total de decoraciones en el slot
     * @param {Array} slotDecorations - Decoraciones ya generadas en este slot
     * @param {Set} usedFrames - Frames ya usados en este slot
     * @param {number} distanceFromFloor - Distancia desde el stage floor
     */
    spawnDecoration(slotY, slotHeight, index, total, slotDecorations, usedFrames, distanceFromFloor) {
        // Seleccionar tipo de decoración aleatoriamente (con pesos)
        const decorType = getRandomDecorationType();

        // Determinar lado (left o right) before calculating Y
        let side;
        if (total === 1) {
            // Solo 1 decoración: elegir lado aleatoriamente
            side = Math.random() < WALL_DECOR_CONFIG.wallDistribution.left ? 'left' : 'right';
        } else {
            // Múltiples decoraciones: alternar lados
            side = index % 2 === 0 ? 'left' : 'right';
        }

        // Calcular posición Y dentro del slot
        const minGap = WALL_DECOR_CONFIG.minVerticalGap;
        const usableHeight = slotHeight - (minGap * (total - 1));
        const segmentHeight = usableHeight / total;

        // Posición Y base y final
        let baseY = slotY + (index * (segmentHeight + minGap)) + (segmentHeight / 2);
        const randomOffset = Phaser.Math.Between(-30, 30); // Variación de ±30px
        let y = baseY + randomOffset;

        // Verificar altura mínima (Global Global + Tipo Específico)
        // Usamos la posición Y real calculada para mayor precisión
        const stageFloorY = this.scene.scale.height - 32;
        const actualDistanceFromFloor = stageFloorY - y;

        // Usamos el mayor de los dos delays: el global (1000m) o el del tipo
        const globalDelay = WALL_DECOR_CONFIG.spawnStartDelay || 1000;
        // Prioritize type-specific delay if set (e.g., LAMPS at 100), otherwise use Global (1000)
        const minHeight = (decorType.spawnStartDelay !== undefined)
            ? decorType.spawnStartDelay
            : globalDelay;

        if (!DecorRules.hasEnoughHeight(actualDistanceFromFloor, minHeight)) {
            return; // Aún no alcanzamos la altura necesaria
        }

        // ═══════════════════════════════════════════════════════════════
        // REGLAS: Spacing & Overlap (Usando DecorRules)
        // ═══════════════════════════════════════════════════════════════

        // 1. Spacing Check (Mismo Tipo)
        if (decorType.name !== 'PIPE') {
            const MIN_DISTANCE = 100;
            if (DecorRules.isTooCloseToSameType(y, decorType.name, slotDecorations, MIN_DISTANCE)) {
                // Intentar ajustar posición
                let attempts = 0;
                let validFound = false;
                while (attempts < 5) {
                    const tempY = baseY + Phaser.Math.Between(-50, 50);
                    if (!DecorRules.isTooCloseToSameType(tempY, decorType.name, slotDecorations, MIN_DISTANCE)) {
                        y = tempY;
                        validFound = true;
                        break;
                    }
                    attempts++;
                }
                if (!validFound) return;
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // INSTANCIACIÓN DE DECORACIÓN
        // ═══════════════════════════════════════════════════════════════

        let decoration = null;
        const x = getWallInsetX(side, this.gameWidth);

        if (decorType.name === 'PIPE') {
            // PIPE: Verificar overlap y crear
            const pattern = Phaser.Utils.Array.GetRandom(decorType.patterns);

            // Margen vertical (50px) para evitar solapamiento visual
            const PIPE_MARGIN = 50;
            if (DecorRules.checkVerticalOverlap(y, pattern.height, side, 'PIPE', slotDecorations, PIPE_MARGIN)) {
                return; // Overlap detectado
            }

            decoration = WallDecorFactory.getPipe(this.scene, decorType, x, y, side, pattern);

        } else if (decorType.name === 'LAMP') {
            // Force Lamp to be roughly centered in the slot to avoid bunching at edges
            y = slotY + (slotHeight / 2) + Phaser.Math.Between(-15, 15);

            // LAMP: Unique rule "Max 1 per side per slot"
            const hasLampOnSide = slotDecorations.some(d => d.config.name === 'LAMP' && d.side === side);

            // Check for overlap with other decorations in this slot since we forced centering
            const overlap = slotDecorations.some(d => Math.abs(d.y - y) < 80 && d.side === side);

            if (hasLampOnSide || overlap) {
                // Ya hay una lámpara o colisión
                return;
            }

            const frame = getRandomFrameForType(decorType, side);
            decoration = WallDecorFactory.getLamp(this.scene, decorType, x, y, side, frame);

        } else {
            // SIGN/LIGHTBOX: Seleccionar frame y crear
            // Filtrar frames validos
            const availableFrames = decorType.frames[side].filter(f => !usedFrames.has(f));
            let frame;

            if (availableFrames.length > 0) {
                frame = Phaser.Utils.Array.GetRandom(availableFrames);
            } else {
                frame = getRandomFrameForType(decorType, side);
            }
            usedFrames.add(frame);

            decoration = WallDecorFactory.getSign(this.scene, decorType, x, y, side, frame);
        }

        // 3. Registrar y activar Parallax
        if (decoration) {
            // Apply immediate parallax update to prevent 1-frame jump
            let parallaxFactor = this.getParallaxFactor(decorType.depth);

            // Override for LAMP: Static on wall (No parallax shift relative to wall)
            // Ideally '1.0' means lock to camera scroll (static in screen).
            // '0.0' means lock to world (static in world).
            // If WallDecorManager updates Y as `initialY - scrollY * factor`.
            // If factor is 1, `y = initial - scroll`. As scroll increases (player goes UP), Y decreases. 
            // This is standard "Move with world" behavior (Static in World).
            // If factor is 0, `y = initial`. Static on Screen (HUD).
            // User said "Estatica". Lamps are attached to walls. Walls scroll.
            // So Lamps should scroll WITH walls.
            // Our walls scroll with factor 1.0 (they are part of world).
            // If `getParallaxFactor` returns 0.5, decoration moves SLOWER than wall (Depth effect).
            // To make it "Estatica" (on the wall), it must have factor 1.0?
            // Wait. `getParallaxFactor` says "1.0 // Gameplay y adelante - sin parallax".
            // So YES, 1.0 means "No Parallax Effect" (Moves with World).
            if (decorType.name === 'LAMP') {
                parallaxFactor = 1.0;
            }

            decoration.initParallax(
                parallaxFactor,
                WALL_DECOR_CONFIG.maxParallaxOffset,
                WALL_DECOR_CONFIG.parallaxSmoothing
            );

            // Force an immediate update with current camera scroll
            // This ensures the visual position is correct before the first render
            if (this.scene.cameras.main) {
                decoration.update(this.scene.cameras.main.scrollY);
            }

            this.decorations.push(decoration);
            slotDecorations.push(decoration);

            // Register lamp as interactable if it's a lamp and not already registered
            if (decorType.name === 'LAMP' && this.scene.interactableManager && decoration && !decoration.interactableId) {
                const lampId = `lamp_${x}_${y}_${this.decorations.length}_${Date.now()}`;
                const lightBugInteractable = new LightBugInteractable(this.scene, decoration);
                this.scene.interactableManager.register(lampId, lightBugInteractable);
                decoration.interactableId = lampId;
            }
        }
    }

    /**
     * Calcula el factor de parallax basado en el depth
     * Más profundo (depth menor) = parallax más lento
     * @param {number} depth - Depth del objeto
     * @returns {number} Factor de parallax (0-1)
     */
    getParallaxFactor(depth) {
        // Global override: use a single subtle parallax factor for all wall decorations.
        const globalFactor = WALL_DECOR_CONFIG.globalParallaxFactor;
        if (globalFactor !== null && globalFactor !== undefined) {
            return Phaser.Math.Clamp(globalFactor, 0, 1);
        }
        if (depth === 0) return 0.1;  // Background - casi estático
        if (depth === 1) return 0.2;  // Buildings big - muy lento
        if (depth === 2) return 0.3;  // Buildings small - lento
        if (depth === 2.5) return 0.35; // Pipes - lento-medio
        if (depth === 3) return 0.4;  // Big lightboxes - medio-lento
        if (depth === 4) return 0.5;  // Regular lightboxes - medio
        if (depth === 5) return 0.6;  // Cables blancos - medio-rápido
        if (depth === 40) return 0.6; // Cables negros - medio-rápido
        return 1.0; // Gameplay y adelante - sin parallax
    }

    /**
     * Actualiza el parallax de todas las decoraciones
     * Debe llamarse en el update loop de la escena
     * @param {number} cameraY - Posición Y de la cámara
     */
    updateParallax(cameraY) {
        // Delegar actualización a cada instancia de decoración
        this.decorations.forEach(decor => decor.update(cameraY));
    }

    /**
     * Limpia decoraciones que están muy por debajo del jugador
     * @param {number} playerY - Posición Y del jugador
     * @param {number} cleanupDistance - Distancia de limpieza (default: 1800)
     */
    cleanup(playerY, cleanupDistance = 1800) {
        const limitY = playerY + cleanupDistance;

        // Filtrar y destruir decoraciones fuera de rango
        this.decorations = this.decorations.filter(decor => {
            if (decor.shouldCleanup(limitY)) {
                // Unregister interactable if it's a lamp
                if (this.scene.interactableManager && decor.interactableId) {
                    this.scene.interactableManager.unregister(decor.interactableId);
                }
                WallDecorFactory.release(decor);
                return false; // Remover del array
            }
            return true; // Mantener en el array
        });
    }

    /**
     * Calcula un tinte basado en la profundidad para simular perspectiva atmosférica.
     * Objetos más lejanos (menor depth) son más oscuros y menos saturados.
     * @param {number} depth 
     * @returns {number} Color hex
     */
    getDepthTint(depth) {
        // Rango de Depth: ~2.5 (Pipes) a ~5 (Foreground Deco)
        // Gameplay es 20+, esos no se tintan aquí.

        const minDepth = 2.0;
        const maxDepth = 5.0;
        const normalized = Phaser.Math.Clamp((depth - minDepth) / (maxDepth - minDepth), 0, 1);

        // Brillo mucho más agresivo para empujar hacia atrás
        // Depth 2.5 (Pipes) -> ~0.3 (Muy oscuro)
        // Depth 5.0 (Cables) -> ~0.7 (Algo oscuro pero visible)
        const brightness = 0.15 + (0.55 * normalized);

        // Convertir a color (Scale Grayish Blue)
        // Reducimos R y G para dar un tono frío y "alejar" visualmente
        const c = Math.floor(255 * brightness);
        const r = Math.floor(c * 0.75); // Menos rojo
        const g = Math.floor(c * 0.85); // Menos verde
        const b = Math.floor(c * 1.0);  // Mantener azul relativo (cool tint)

        return Phaser.Display.Color.GetColor(r, g, b);
    }

    /**
     * Destruye todas las decoraciones
     */
    destroy() {
        this.decorations.forEach(decor => WallDecorFactory.release(decor));
        this.decorations = [];
        WallDecorFactory.clearPools();
    }

    /**
     * Obtiene el número de decoraciones activas
     * @returns {number}
     */
    getCount() {
        return this.decorations.length;
    }
}
