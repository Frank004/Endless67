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
    // NOTE: Global parallax for wall decorations.
    // Use a subtle value (< 1) and clamp offset to avoid drift over long climbs.
    // Set to null to use per-depth values in WallDecorManager.
    // Set to 1 for no parallax.
    globalParallaxFactor: 0.9,
    maxParallaxOffset: 140,
    parallaxSmoothing: 0.18,
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
        min: 2,  // Mínimo 2 decoraciones
        max: 5   // Máximo 5 decoraciones
    },

    // Probabilidad de spawn por slot (0-1)
    spawnChance: 1.0, // 100% de probabilidad - siempre hay decoraciones (mínimo 2)

    // Delay de inicio - no spawnar decoraciones hasta después de esta distancia desde el stage floor
    spawnStartDelay: 150, // px - Start shortly after floor to avoid clutter but appear early

    // Distribución entre paredes (cuando solo hay 1 decoración)
    wallDistribution: {
        left: 0.5,  // 50% probabilidad pared izquierda
        right: 0.5  // 50% probabilidad pared derecha
    },

    // Separación mínima vertical entre decoraciones en el mismo slot
    minVerticalGap: 160, // px

    // ─────────────────────────────────────────────────────────────
    // DEPTH / Z-INDEX LAYERING (Complete Game Architecture)
    // ─────────────────────────────────────────────────────────────

    // Profundidad de renderizado completa del juego:
    // 0: Background (parallax)
    // 1: Buildings deco (futuro, parallax)
    // 2: Smaller Building deco (futuro, parallax)
    // 2.5: Pipes (parallax) - entre buildings y lightboxes
    // 3: Big lightboxes (parallax)
    // 4: Regular lightboxes (parallax)
    // 5: Cables blancos (parallax, ya implementado)
    // 20+: Gameplay (player, enemies, platforms, items, powerups, walls)
    // 40: Cables negros (parallax, ya implementado)
    // 100: Risers
    // 120: Menus y overlay
    depth: {
        buildingsBig: 1,        // Buildings grandes (futuro)
        buildingsSmall: 2,      // Buildings pequeños (futuro)
        pipes: 2.5,             // Pipes verticales - entre buildings y lightboxes
        lightboxBig: 3,         // Lightboxes grandes
        lightboxRegular: 4,     // Lightboxes regulares
    },

    // ─────────────────────────────────────────────────────────────
    // TIPOS DE DECORACIONES
    // ─────────────────────────────────────────────────────────────

    types: {
        LIGHTBOX: {
            name: 'LIGHTBOX',
            atlas: ASSETS.PROPS,
            depth: 4, // Regular lightboxes - detrás de cables blancos (5), adelante de gameplay (20+)

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
            tint: 0x666666,

            // Escala (si necesitas ajustar el tamaño)
            scale: 1.0,

            // Peso de spawn (para distribución entre tipos)
            spawnWeight: 0.7 // 70% de probabilidad vs lightboxBig
        },

        LIGHTBOX_BIG: {
            name: 'LIGHTBOX_BIG',
            atlas: ASSETS.PROPS,
            depth: 3, // Big lightboxes - más atrás que regular, detrás de cables blancos (5)

            // Frames disponibles por lado
            frames: {
                left: [
                    'lightboxBig-l-01.png',
                    'lightboxBig-l-03.png',
                    'lightboxBig-l-04.png',
                    'lightboxBig-l-05.png'
                ],
                right: [
                    'lightboxBig-r-01.png',
                    'lightboxBig-r-03.png',
                    'lightboxBig-r-04.png',
                    'lightboxBig-r-05.png'
                ]
            },

            // Propiedades visuales
            alpha: 1.0,
            tint: 0x666666,

            // Escala
            scale: 1.0,

            // Peso de spawn (para distribución entre tipos)
            spawnWeight: 0.3 // 30% de probabilidad vs lightbox regular
        },

        PIPE: {
            name: 'PIPE',
            atlas: ASSETS.PROPS,
            depth: 2.5, // Pipes - más atrás que lightboxes, adelante de buildings

            // Pipes son especiales: se construyen con múltiples sprites
            isComposite: true, // Flag para indicar que requiere renderizado especial

            // Delay de inicio específico para pipes (son grandes, aparecen más tarde)
            spawnStartDelay: 400, // px - Start a bit later than signs

            // Patrones de altura (cantidad de segmentos mid)
            patterns: [
                { midCount: 1, height: 96 },  // Patrón 1: top + 1 mid + bottom
                { midCount: 2, height: 128 }, // Patrón 2: top + 2 mid + bottom
                { midCount: 3, height: 160 }, // Patrón 3: top + 3 mid + bottom
                { midCount: 4, height: 192 }, // Patrón 4: top + 4 mid + bottom
                { midCount: 5, height: 224 }  // Patrón 5: top + 5 mid + bottom
            ],

            // Sprites componentes
            sprites: {
                top: 'pipe-top-deco.png',
                mid: 'pipe-mid-deco.png',
                bottom: 'pipe-bottom-deco.png'
            },

            // Propiedades visuales
            alpha: 1.0,
            tint: 0x888888,
            scale: 1.0,

            // Peso de spawn (para distribución entre tipos)
            spawnWeight: 0.4 // 40% de probabilidad
        },

        LAMP: {
            name: 'LAMP',
            atlas: ASSETS.PROPS,
            depth: 4.1, // Slightly in front of Lightboxes? Or same? 4 is regular.
            frames: {
                left: ['lamp.png'],
                right: ['lamp.png']
            },
            // Light emitter presets and overrides for glow + particles
            lightEmitterPreset: 'lampWarm',
            lightEmitterOverrides: null,
            spawnStartDelay: 100, // Starts nearly immediately
            alpha: 1.0,
            tint: 0xffffff, // Lamps usually bright? User said "dales un dime" to signs, maybe lamps stick to white or slight warm? 
            // "Lamp" implies light source. I'll keep it near white or 0xeeeeee.
            scale: 1.0,
            spawnWeight: 0.4 // Higher chance to see them spawn
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
