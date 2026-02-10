import { WALLS } from '../Config/GameConstants.js';
import { SLOT_CONFIG } from '../Config/SlotConfig.js';

/**
 * Calcula límites X seguros dinámicos usando la vista de cámara.
 * Devuelve minX/maxX/center y left/right del worldView.
 * @param {Phaser.Scene} scene
 * @param {number} itemSize - ancho del objeto a colocar (px)
 */
export function getPlayableBounds(scene, itemSize = 32) {
    const cam = scene?.cameras?.main;
    const fallbackWidth = scene?.scale?.gameSize?.width || cam?.width || SLOT_CONFIG.gameWidth;
    let left = 0;
    let right = left + fallbackWidth;
    let margin = WALLS.WIDTH + WALLS.MARGIN;

    const leftWall = scene?.leftWall?.body;
    const rightWall = scene?.rightWall?.body;
    if (leftWall && rightWall) {
        const wallLeft = leftWall.x + leftWall.width;
        const wallRight = rightWall.x;
        if (wallRight > wallLeft) {
            left = wallLeft;
            right = wallRight;
            margin = WALLS.MARGIN;
        }
    }

    const width = Math.max(0, right - left);
    const usable = Math.max(0, width - margin * 2);
    const half = itemSize / 2;
    const clampedHalf = usable > itemSize ? half : Math.max(usable / 2, 0);
    const minX = left + margin + clampedHalf;
    const maxX = right - margin - clampedHalf;
    const centerX = Math.max(minX, Math.min(maxX, left + width / 2));
    return { minX, maxX, centerX, left, right, width };
}

/**
 * Clamp a value to the playable X bounds with optional extra margin.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} itemSize
 * @param {number} extraMargin
 */
export function clampToPlayableBounds(scene, x, itemSize = 32, extraMargin = 0) {
    const { minX, maxX, centerX } = getPlayableBounds(scene, itemSize);
    const min = minX + extraMargin;
    const max = maxX - extraMargin;
    if (min > max) return centerX;
    const value = (typeof x === 'number') ? x : centerX;
    return Math.max(min, Math.min(max, value));
}
