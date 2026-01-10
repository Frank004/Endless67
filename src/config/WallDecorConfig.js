import { ASSETS } from './AssetKeys.js';
import { WALLS } from './GameConstants.js';

/**
 * WallDecorConfig.js
 * 
 * Configuración para decoraciones de pared (lightboxes, señales, etc.)
 * 
 * Principios:
 * - Single Responsibility: Solo configuración de decoraciones de pared
 * - DRY: Valores centralizados para todas las decoraciones
 * - Separation of Concerns: Config separada de lógica de generación
 * 
 * Terminología:
 * - Wall Inset / Inner Wall Edge: El borde interior de las paredes (donde se pegan las decoraciones)
 */

export const WALL_DECOR_CONFIG = {
    // ─────────────────────────────────────────────────────────────
    // POSICIONAMIENTO
    // ─────────────────────────────────────────────────────────────

    // Distancia desde el borde interior de la pared (wall inset)
    // Las decoraciones se pegan al "inner wall edge"
    wallInsetOffset: WALLS.WIDTH, // 32px - posición X del borde interior de la pared

    // Margen adicional desde el wall inset (para que no se pegue exactamente al borde)
    insetMargin: 2, // 2px de separación del borde interior

    // ─────────────────────────────────────────────────────────────
    // SPAWN CONFIGURATION
    // ─────────────────────────────────────────────────────────────

    // Cantidad de decoraciones por slot
    perSlot: {
        min: 1,
        max: 2
    },

    // Probabilidad de spawn por slot (0-1)
    spawnChance: 0.6, // 60% de probabilidad de que un slot tenga decoraciones

    // Distribución entre paredes (cuando solo hay 1 decoración)
    wallDistribution: {
        left: 0.5,  // 50% probabilidad pared izquierda
        right: 0.5  // 50% probabilidad pared derecha
    },

    // Separación mínima vertical entre decoraciones en el mismo slot
    minVerticalGap: 160, // px

    // ─────────────────────────────────────────────────────────────
    // DEPTH / Z-INDEX
    // ─────────────────────────────────────────────────────────────

    // Profundidad de renderizado (arriba de cables, debajo de plataformas)
    depth: {
        base: 5, // Cables están en depth 3, así que 5 los pone arriba
    },

    // ─────────────────────────────────────────────────────────────
    // TIPOS DE DECORACIONES
    // ─────────────────────────────────────────────────────────────

    types: {
        LIGHTBOX: {
            name: 'LIGHTBOX',
            atlas: ASSETS.PROPS,

            // Frames disponibles por lado
            frames: {
                left: [
                    'lightbox-l-01.png',
                    'lightbox-l-02.png',
                    'lightbox-l-03.png',
                    'lightbox-l-04.png',
                    'lightbox-l-05.png',
                    'lightbox-l-06.png'
                ],
                right: [
                    'lightbox-r-01.png',
                    'lightbox-r-02.png',
                    'lightbox-r-03.png',
                    'lightbox-r-04.png',
                    'lightbox-r-05.png',
                    'lightbox-r-06.png'
                ]
            },

            // Propiedades visuales
            alpha: 1.0,
            tint: 0xffffff,

            // Escala (si necesitas ajustar el tamaño)
            scale: 1.0
        }

        // Aquí puedes agregar más tipos en el futuro:
        // NEON_SIGN: { ... },
        // GRAFFITI: { ... },
        // etc.
    }
};

/**
 * Obtiene un frame aleatorio de lightbox para el lado especificado
 * @param {string} side - 'left' o 'right'
 * @returns {string} Frame name
 */
export function getRandomLightboxFrame(side) {
    const frames = WALL_DECOR_CONFIG.types.LIGHTBOX.frames[side];
    return Phaser.Utils.Array.GetRandom(frames);
}

/**
 * Calcula la posición X para una decoración en el wall inset
 * @param {string} side - 'left' o 'right'
 * @param {number} gameWidth - Ancho del juego
 * @returns {number} Posición X
 */
export function getWallInsetX(side, gameWidth) {
    const { wallInsetOffset, insetMargin } = WALL_DECOR_CONFIG;

    if (side === 'left') {
        // Pared izquierda: wall width + margin
        return wallInsetOffset + insetMargin;
    } else {
        // Pared derecha: gameWidth - wall width - margin
        return gameWidth - wallInsetOffset - insetMargin;
    }
}
