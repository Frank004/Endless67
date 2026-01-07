import { WALLS } from '../config/GameConstants.js';
import { SLOT_CONFIG } from '../config/SlotConfig.js';

/**
 * Calcula límites X seguros dinámicos usando la vista de cámara.
 * Devuelve minX/maxX/center y left/right del worldView.
 * @param {Phaser.Scene} scene
 * @param {number} itemSize - ancho del objeto a colocar (px)
 */
export function getPlayableBounds(scene, itemSize = 32) {
    const cam = scene?.cameras?.main;
    const width = scene?.scale?.gameSize?.width || cam?.width || SLOT_CONFIG.gameWidth;
    const left = 0;
    const right = left + width;
    const margin = WALLS.WIDTH + WALLS.MARGIN;
    const usable = Math.max(0, width - margin * 2);
    const half = itemSize / 2;
    const clampedHalf = usable > itemSize ? half : Math.max(usable / 2, 0);
    const minX = left + margin + clampedHalf;
    const maxX = right - margin - clampedHalf;
    const centerX = Math.max(minX, Math.min(maxX, left + width / 2));
    return { minX, maxX, centerX, left, right, width };
}
