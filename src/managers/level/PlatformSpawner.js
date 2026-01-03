import { WALLS } from '../../config/GameConstants.js';
import { SLOT_CONFIG } from '../../config/SlotConfig.js';
import { PLATFORM_WIDTH } from '../../prefabs/Platform.js';

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
        this.MIN_PLATFORM_WIDTH = PLATFORM_WIDTH;
        this.PLATFORM_HEIGHT = SLOT_CONFIG.platformHeight || 32;
        this.MIN_VERTICAL_SPACING = 160;
        this.SAME_LINE_EPS = 32;
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
        const halfWidth = width / 2;
        const minCenter = WALLS.WIDTH + WALLS.MARGIN + halfWidth;
        const maxCenter = scene.cameras.main.width - WALLS.WIDTH - WALLS.MARGIN - halfWidth;
        let clampedX = Phaser.Math.Clamp(x, minCenter, maxCenter);

        const verbose = this.scene?.registry?.get('showSlotLogs');
        if (clampedX !== x && verbose) {
            console.warn(`PlatformSpawner: clamping platform center ${x} -> ${clampedX}`);
        }
        x = clampedX;

        // Spawn desde el pool
        const p = scene.platformPool.spawn(x, y, width, isMoving, speed);

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
            height: this.PLATFORM_HEIGHT
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
        const scene = this.scene;
        const gameWidth = scene.cameras.main.width;
        const wallWidth = WALLS.WIDTH;
        const halfWidth = width / 2;

        // Bounds check
        const minX = wallWidth + WALLS.MARGIN + halfWidth + 10;
        const maxX = gameWidth - wallWidth - WALLS.MARGIN - halfWidth - 10;

        if (x < minX || x > maxX) {
            return false;
        }

        // Vertical spacing validation
        const VALIDATION_RANGE = 500;
        for (const platform of this.activePlatforms) {
            const dy = Math.abs(platform.y - y);
            if (dy > VALIDATION_RANGE) continue;

            // overlap vertical muy cercano
            if (dy < this.MIN_VERTICAL_SPACING) {
                return false;
            }
        }

        // Same line check
        const sameLine = this.activePlatforms.some(p => Math.abs(p.y - y) < this.SAME_LINE_EPS);
        if (sameLine) {
            return false;
        }

        // AABB Overlap
        if (this.checkOverlap(x, y, width)) {
            return false;
        }

        return true;
    }

    checkOverlap(x, y, width) {
        const halfWidth = width / 2;
        const halfHeight = this.PLATFORM_HEIGHT / 2;

        const thisLeft = x - halfWidth;
        const thisRight = x + halfWidth;
        const thisTop = y - halfHeight;
        const thisBottom = y + halfHeight;

        for (let platform of this.activePlatforms) {
            const otherLeft = platform.x - platform.width / 2;
            const otherRight = platform.x + platform.width / 2;
            const otherTop = platform.y - platform.height / 2;
            const otherBottom = platform.y + platform.height / 2;

            if (thisLeft < otherRight && thisRight > otherLeft &&
                thisTop < otherBottom && thisBottom > otherTop) {
                return true;
            }
        }
        return false;
    }

    logPlatformPlacement(x, y, width, isMoving) {
        const scene = this.scene;
        // Check overlap with items (coins/powerups)
        const checkItemOverlap = (group, label) => {
            if (!group || !group.children || typeof group.children.iterate !== 'function') return;

            const halfW = width / 2;
            const halfH = this.PLATFORM_HEIGHT / 2;
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
        const leftEdge = p.x - halfWidth;
        const rightEdge = p.x + halfWidth;
        const minEdge = WALLS.WIDTH;
        const maxEdge = this.scene.cameras.main.width - WALLS.WIDTH;

        if (leftEdge < minEdge || rightEdge > maxEdge) {
            const safeX = Phaser.Math.Clamp(p.x, minCenter, maxCenter);
            p.x = safeX;
            if (p.body) {
                p.body.updateFromGameObject();
                p.body.setVelocityX(isMoving ? p.body.velocity.x : 0);
            }
        }
    }
}
