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
    // DEPTH / Z-INDEX LAYERING
    // ─────────────────────────────────────────────────────────────

    // Profundidad de renderizado (cerca del background, muy atrás)
    // Depth 0: Background base
    // Depth 1: Big lightboxes (más atrás, cerca del background)
    // Depth 2: Regular lightboxes (un poco adelante de big)
    // Depth 3: Cables
    // Depth 10+: Platforms, Player, Enemies
    depth: {
        lightboxBig: 1,     // Lightboxes grandes - muy atrás, cerca del background
        lightboxRegular: 2, // Lightboxes regulares - adelante de big, atrás de cables
    },

    // ─────────────────────────────────────────────────────────────
    // TIPOS DE DECORACIONES
    // ─────────────────────────────────────────────────────────────

    types: {
        LIGHTBOX: {
            name: 'LIGHTBOX',
            atlas: ASSETS.PROPS,
            depth: 2, // Depth específico para lightboxes regulares (atrás de cables)

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
            scale: 1.0,

            // Peso de spawn (para distribución entre tipos)
            spawnWeight: 0.7 // 70% de probabilidad vs lightboxBig
        },

        LIGHTBOX_BIG: {
            name: 'LIGHTBOX_BIG',
            atlas: ASSETS.PROPS,
            depth: 1, // Más atrás que lightboxes regulares, cerca del background

            // Frames disponibles por lado
            frames: {
                left: [
                    'lightboxBig-l-01.png'
                ],
                right: [
                    'lightboxBig-r-01.png'
                ]
            },

            // Propiedades visuales
            alpha: 1.0,
            tint: 0xffffff,

            // Escala
            scale: 1.0,

            // Peso de spawn (para distribución entre tipos)
            spawnWeight: 0.3 // 30% de probabilidad vs lightbox regular
        }

        // Aquí puedes agregar más tipos en el futuro:
        // NEON_SIGN: { ... },
        // GRAFFITI: { ... },
        // etc.
    }
};

/**
 * Selecciona un tipo de decoración aleatorio basado en pesos
 * @returns {Object} Tipo de decoración seleccionado
 */
export function getRandomDecorationType() {
    const types = Object.values(WALL_DECOR_CONFIG.types);

    // Calcular peso total
    const totalWeight = types.reduce((sum, type) => sum + (type.spawnWeight || 1), 0);

    // Seleccionar aleatoriamente basado en pesos
    let random = Math.random() * totalWeight;

    for (const type of types) {
        random -= (type.spawnWeight || 1);
        if (random <= 0) {
            return type;
        }
    }

    // Fallback al primer tipo
    return types[0];
}

/**
 * Obtiene un frame aleatorio para el tipo y lado especificado
 * @param {Object} decorType - Tipo de decoración
 * @param {string} side - 'left' o 'right'
 * @returns {string} Frame name
 */
export function getRandomFrameForType(decorType, side) {
    const frames = decorType.frames[side];
    return Phaser.Utils.Array.GetRandom(frames);
}

/**
 * Obtiene un frame aleatorio de lightbox para el lado especificado
 * @deprecated Use getRandomFrameForType instead
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
