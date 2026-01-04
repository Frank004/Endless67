import { WALLS } from '../../config/GameConstants.js';
import { SLOT_CONFIG, getPlatformBounds } from '../../config/SlotConfig.js';
import { PLATFORM_WIDTH, PLATFORM_HEIGHT } from '../../prefabs/Platform.js';
import { PlatformValidator } from './PlatformValidator.js';

/**
 * PlatformSpawner
 * 
 * Responsabilidades:
 * - Spawnear plataformas usando el pool.
 * - Validar posiciones de plataformas (overlap, bounds).
 * - Mantener el tracking de plataformas activas para validación.
 * - Cleanup de su propio tracking.
 */
export class PlatformSpawner {
    constructor(scene) {
        this.scene = scene;
        this.activePlatforms = [];
        this.validator = new PlatformValidator(scene);
    }

    /**
     * Spawnea una plataforma en la posición dada.
     * @param {number} x - Centro X
     * @param {number} y - Centro Y
     * @param {number} width - Ancho
     * @param {boolean} isMoving - Si es móvil
     * @param {number} speed - Velocidad si es móvil
     * @returns {Phaser.GameObjects.Sprite} La plataforma spawneada (o null si falla)
     */
    spawn(x, y, width, isMoving, speed = 100) {
        const scene = this.scene;

        // Clamp center X to safe bounds
        const camWidth = this.scene.cameras?.main?.worldView?.width || this.scene.cameras?.main?.width || scene.scale.width || SLOT_CONFIG.gameWidth;
        const { minX: minCenter, maxX: maxCenter, centerX } = getPlatformBounds(camWidth);
        const halfWidth = width / 2;
        let targetX = x ?? centerX;
        
        // Para plataformas estáticas: asegurar 10px de espacio desde las paredes para que el jugador pueda pasar
        if (!isMoving) {
            const playerClearance = 10; // Espacio mínimo entre plataforma y pared
            const leftEdge = targetX - halfWidth;
            const rightEdge = targetX + halfWidth;
            const minWallEdge = WALLS.WIDTH + playerClearance;
            const maxWallEdge = camWidth - WALLS.WIDTH - playerClearance;
            
            // Ajustar posición si los bordes están muy cerca de las paredes
            if (leftEdge < minWallEdge) {
                targetX = minWallEdge + halfWidth;
            } else if (rightEdge > maxWallEdge) {
                targetX = maxWallEdge - halfWidth;
            }
        }
        
        // Clamp final a los límites seguros
        let clampedX = Phaser.Math.Clamp(targetX, minCenter, maxCenter);

        // Only clamp if truly out of bounds; allow center positions to pass untouched
        // Logs desactivados para performance
        x = clampedX;

        // Spawn desde el pool
        const p = scene.platformPool.spawn(x, y, width, isMoving, speed);
        if (!p) {
            // Log solo si showSlotLogs está activo (errores críticos)
            const showLogs = scene.registry?.get('showSlotLogs');
            if (showLogs) {
                const stats = scene.platformPool?.getStats?.();
                console.warn('PlatformSpawner: pool spawn returned null', stats || {});
            }
            return null;
        }

        // Asegurar physics body
        if (!p.body) {
            scene.physics.add.existing(p);
        }

        // Agregar al grupo legacy (si existe)
        if (scene.platforms) {
            scene.platforms.add(p, true);
        }

        // Registrar para tracking
        this.registerPlatform(x, y, width);

        // Debug text desactivado para performance
        // (Eliminado: debugText que mostraba Y en cada plataforma)

        // Safety checks (sin logging para performance)
        this.ensureBounds(p, width, isMoving, minCenter, maxCenter);

        return p;
    }

    /**
     * Registra una plataforma en el tracking system (para evitar superposiciones).
     */
    registerPlatform(x, y, width) {
        this.activePlatforms.push({
            x: x,
            y: y,
            width: width,
            height: PLATFORM_HEIGHT
        });
    }

    /**
     * Limpia plataformas trackeadas que quedaron muy abajo.
     * @param {number} limitY - Límite Y para limpiar.
     */
    cleanupTracking(limitY) {
        this.activePlatforms = this.activePlatforms.filter(p => p.y < limitY);
    }

    /**
     * Valida si una posición es adecuada para una nueva plataforma.
     */
    isValidPosition(x, y, width) {
        return this.validator.isValidPosition(x, y, width, this.activePlatforms);
    }

    // logPlatformPlacement desactivado para performance
    // (Eliminado: logging de posicionamiento de plataformas)

    ensureBounds(p, width, isMoving, minCenter, maxCenter) {
        const halfWidth = width / 2;
        const camWidth = this.scene.cameras?.main?.worldView?.width || this.scene.cameras?.main?.width || this.scene.scale.width || SLOT_CONFIG.gameWidth;
        
        const leftEdge = p.x - halfWidth;
        const rightEdge = p.x + halfWidth;
        
        // Para plataformas estáticas: asegurar 10px de espacio desde las paredes
        let minEdge = WALLS.WIDTH;
        let maxEdge = camWidth - WALLS.WIDTH;
        
        if (!isMoving) {
            const playerClearance = 10;
            minEdge = WALLS.WIDTH + playerClearance;
            maxEdge = camWidth - WALLS.WIDTH - playerClearance;
        }

        if (leftEdge < minEdge || rightEdge > maxEdge) {
            // Ajustar posición para mantener el espacio de clearance
            if (!isMoving) {
                if (leftEdge < minEdge) {
                    p.x = minEdge + halfWidth;
                } else if (rightEdge > maxEdge) {
                    p.x = maxEdge - halfWidth;
                }
            } else {
                // Para móviles, usar clamp estándar
                const safeX = Phaser.Math.Clamp(p.x, minCenter, maxCenter);
                p.x = safeX;
            }
            
            if (p.body) {
                p.body.updateFromGameObject();
                p.body.setVelocityX(isMoving ? p.body.velocity.x : 0);
            }
        }
    }
}
