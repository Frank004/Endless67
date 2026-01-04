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
        const verbose = this.scene?.registry?.get('showSlotLogs');
        if (clampedX !== targetX) {
            if (verbose) {
                console.warn(`PlatformSpawner: clamping platform center ${targetX} -> ${clampedX} (camWidth=${camWidth}, min=${minCenter}, max=${maxCenter})`);
            }
        }
        x = clampedX;

        // Spawn desde el pool
        const p = scene.platformPool.spawn(x, y, width, isMoving, speed);
        if (!p) {
            const stats = scene.platformPool?.getStats?.();
            console.warn('PlatformSpawner: pool spawn returned null', stats || {});
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

        // DEBUG TEXT desactivado - solo activar si showSlotLogs está activo
        // if (scene.add?.text && scene.registry?.get('showSlotLogs')) {
        //     const debugText = scene.add.text(x, y, `Y:${Math.round(y)}`, { fontSize: '16px', fill: '#ffffff', backgroundColor: '#ff0000' });
        //     debugText.setOrigin(0.5);
        //     debugText.setDepth(200);
        //     p.debugText = debugText; // Asignar a la plataforma para limpieza automática
        // }

        // Logging y safety checks
        this.logPlatformPlacement(p.x, p.y, width, isMoving);
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

    logPlatformPlacement(x, y, width, isMoving) {
        const scene = this.scene;
        // Check overlap with items (coins/powerups)
        const checkItemOverlap = (group, label) => {
            if (!group || !group.children || typeof group.children.iterate !== 'function') return;

            const halfW = width / 2;
            const halfH = PLATFORM_HEIGHT / 2;
            const left = x - halfW;
            const right = x + halfW;
            const top = y - halfH;
            const bottom = y + halfH;

            group.children.iterate((item) => {
                if (!item || !item.active) return;
                const ix = item.x || 0;
                const iy = item.y || 0;
                if (ix >= left && ix <= right && iy >= top && iy <= bottom) {
                    // Overlap detected
                }
            });
        };

        checkItemOverlap(scene.coins, 'coin');
        checkItemOverlap(scene.powerups, 'powerup');
    }

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
