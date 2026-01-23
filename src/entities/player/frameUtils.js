import { ASSETS } from '../../config/AssetKeys.js';

/**
 * Utility to find frames in player atlas with robust normalization.
 * Handles different folder structures and naming conventions across skins.
 * 
 * Examples:
 * - "idle-01.png" matches "idle/idle-01.png" or "IDLE/IDLE-01.png"
 * - "jump-03.png" matches "Jump/jump-03.png" or "jump/jump-03.png"
 */

/**
 * Normalize frame name for fuzzy matching
 * @param {string} name - Frame name to normalize
 * @returns {string} Normalized name (lowercase, no separators, no folder)
 */
const normalize = (name) => {
    if (!name) return '';
    // Get filename part, ignore folder
    const filename = name.split('/').pop();
    // Lowercase, remove underscores, dashes, spaces
    return filename.toLowerCase().replace(/[\s\-_]/g, '');
};

/**
 * Find a frame in the player texture atlas
 * @param {Phaser.Textures.Texture} texture - The player texture atlas
 * @param {string} requestedName - The frame name to find
 * @param {boolean} silent - If true, don't log warnings
 * @returns {string|null} The actual frame name in the atlas, or null if not found
 */
export function findPlayerFrame(texture, requestedName, silent = false) {
    if (!texture || !requestedName) return null;

    // 1. Exact match (Fastest)
    if (texture.has(requestedName)) return requestedName;
    if (texture.has(requestedName.trim())) return requestedName.trim();

    // 2. Normalized Fuzzy Match
    // Matches "idle-01.png" with "IDLE/idle_01.png" or "idle/idle-01.png"
    const reqNorm = normalize(requestedName);
    if (!reqNorm) return null;

    const allFrameNames = texture.getFrameNames();
    const found = allFrameNames.find(fn => normalize(fn) === reqNorm);

    if (found) return found;

    if (!silent) {
        console.warn(`[frameUtils] Frame not found in Player Atlas: "${requestedName}"`);
    }
    return null;
}

/**
 * Check if a frame exists in the player texture
 * @param {Phaser.Textures.Texture} texture - The player texture atlas
 * @param {string} frameName - The frame name to check
 * @returns {boolean} True if frame exists
 */
export function hasPlayerFrame(texture, frameName) {
    return findPlayerFrame(texture, frameName, true) !== null;
}

/**
 * Safely set a frame on a sprite with fallback options
 * @param {Phaser.GameObjects.Sprite} sprite - The sprite to set frame on
 * @param {string} primaryFrame - Primary frame to try
 * @param {string[]} fallbackFrames - Array of fallback frames to try
 * @returns {boolean} True if a frame was set successfully
 */
export function safeSetFrame(sprite, primaryFrame, fallbackFrames = []) {
    if (!sprite || !sprite.texture) return false;

    const texture = sprite.texture;

    // Try primary frame
    const primary = findPlayerFrame(texture, primaryFrame, true);
    if (primary) {
        sprite.setFrame(primary);
        return true;
    }

    // Try fallbacks
    for (const fallback of fallbackFrames) {
        const frame = findPlayerFrame(texture, fallback, true);
        if (frame) {
            sprite.setFrame(frame);
            return true;
        }
    }

    console.warn(`[frameUtils] Could not set frame. Tried: ${primaryFrame}, ${fallbackFrames.join(', ')}`);
    return false;
}
