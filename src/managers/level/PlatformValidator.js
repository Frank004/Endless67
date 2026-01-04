
import { WALLS } from '../../config/GameConstants.js';
import { SLOT_CONFIG } from '../../config/SlotConfig.js';

export class PlatformValidator {
    constructor(scene) {
        this.scene = scene;
        this.PLATFORM_HEIGHT = SLOT_CONFIG.platformHeight || 32;
        this.MIN_VERTICAL_SPACING = 160;
        this.SAME_LINE_EPS = 32;
    }

    /**
     * Valida si una posición es adecuada para una nueva plataforma.
     * 
     * Nota: Los bounds check (paredes) ya se manejan en PlatformSpawner.spawn(),
     * así que solo validamos overlap y spacing vertical aquí.
     * 
     * @param {number} x - Platform center X
     * @param {number} y - Platform center Y
     * @param {number} width - Platform width
     * @param {Array} activePlatforms - Array of tracking objects {x,y,width,height}
     * @returns {boolean} True if valid
     */
    isValidPosition(x, y, width, activePlatforms) {
        if (!activePlatforms || activePlatforms.length === 0) {
            return true;
        }

        // Vertical spacing validation - evitar plataformas muy cercanas verticalmente
        const VALIDATION_RANGE = 500;
        for (const platform of activePlatforms) {
            const dy = Math.abs(platform.y - y);
            if (dy > VALIDATION_RANGE) continue;

            // Rechazar si está muy cerca verticalmente (menos de MIN_VERTICAL_SPACING)
            if (dy < this.MIN_VERTICAL_SPACING) {
                return false;
            }
        }

        // Same line check - evitar múltiples plataformas en la misma línea Y
        const sameLine = activePlatforms.some(p => Math.abs(p.y - y) < this.SAME_LINE_EPS);
        if (sameLine) {
            return false;
        }

        // AABB Overlap - evitar superposición física
        if (this.checkOverlap(x, y, width, activePlatforms)) {
            return false;
        }

        return true;
    }

    checkOverlap(x, y, width, activePlatforms) {
        const halfWidth = width / 2;
        const halfHeight = this.PLATFORM_HEIGHT / 2;

        const thisLeft = x - halfWidth;
        const thisRight = x + halfWidth;
        const thisTop = y - halfHeight;
        const thisBottom = y + halfHeight;

        for (let platform of activePlatforms) {
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
}
