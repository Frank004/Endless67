import { PLATFORM_WIDTH, PLATFORM_HEIGHT } from '../prefabs/Platform.js';
import { MAZE_ROW_HEIGHT, MAZE_ROW_GAP, MAZE_ROW_COUNT } from '../data/MazePatterns.js';
import { WALLS } from './GameConstants.js';

/**
 * SlotConfig.js
 * 
 * Configuración del sistema de slots para generación de nivel.
 * Cada slot tiene 640px de altura y contiene un tipo específico de contenido.
 * 
 * Principios:
 * - Single Responsibility: Solo configuración, sin lógica
 * - DRY: Valores centralizados
 * - Separation of Concerns: Config separada de generación
 */

export const SLOT_CONFIG = {
    // ─────────────────────────────────────────────────────────────
    // DIMENSIONES BASE (VERTICAL 9:16, 360x640)
    // ─────────────────────────────────────────────────────────────
    slotHeight: 640,  // Altura FIJA de cada slot (múltiplo de 32px)

    gameWidth: 360,   // Ancho base vertical
    wallWidth: 32,
    centerX: 180,     // Centro del juego (360/2)

    // ─────────────────────────────────────────────────────────────
    // PLATAFORMAS
    // ─────────────────────────────────────────────────────────────
    platformWidth: PLATFORM_WIDTH,      // Ancho ÚNICO para todas las plataformas
    platformHeight: PLATFORM_HEIGHT,    // Altura estándar (1 tile de 32px)
    minVerticalGap: 160,     // Distancia mínima entre plataformas (NO NEGOCIABLE)
    maxVerticalGap: 192,     // Distancia máxima entre plataformas
    slotGap: 120,            // Distancia entre slots 

    // ─────────────────────────────────────────────────────────────
    // TIPOS DE SLOTS
    // ─────────────────────────────────────────────────────────────
    types: {
        PLATFORM_BATCH: {
            name: 'PLATFORM_BATCH',
            height: 640,
            platformCount: { min: 4, max: 4 },  // Siempre 4 plataformas

            // Transformaciones ✅ ACTIVADAS
            transformWeights: {
                none: 0.4,      // 40% sin transformación
                mirrorX: 0.3,   // 30% espejo horizontal (izq ↔ der)
                mirrorY: 0.15,  // 15% espejo vertical (arriba ↔ abajo)
                mirrorXY: 0.15  // 15% espejo ambos
            },

            // Spawn chances
            spawnChances: {
                coins: 0.4,
                powerups: 0.25,
                patrol: 0.2,
                shooter: 0.1,
                jumper: 0.1
            },

            // Debug
            debugColors: [0xff0000, 0x00ff00, 0xffff00]  // Rojo, Verde, Amarillo
        },

        MAZE: {
            name: 'MAZE',
            rowHeight: MAZE_ROW_HEIGHT,     // Altura de cada bloque de muro (2 tiles de 32px)
            rowGap: MAZE_ROW_GAP,           // Separación vertical entre filas
            rowCount: MAZE_ROW_COUNT,       // Número de filas del maze (alto dinámico)
            transformWeights: {
                none: 0.6,
                mirrorX: 0.3,   // Espejo horizontal (izq-der)
                mirrorY: 0.1    // Espejo vertical (invierte orden de filas)
            },
            spawnChances: {
                coins: 0.5,
                powerups: 0.2,
                enemies: 20,                // 20% chance global de que este maze tenga enemigos
                enemyCount: { min: 1, max: 2 },
                enemyTypes: { patrol: 0.5, shooter: 0.5 }
            }
        },

        SAFE_ZONE: {
            name: 'SAFE_ZONE',
            height: 640,
            platformCount: { min: 4, max: 4 },  // Siempre 4 plataformas

            transformWeights: {
                none: 0.6,      // 60% sin transformación (más predecible)
                mirrorX: 0.3,   // 30% espejo horizontal
                mirrorY: 0.05,  // 5% espejo vertical
                mirrorXY: 0.05  // 5% espejo ambos
            },

            spawnChances: {
                coins: 0.6,
                powerups: 0.3,
                enemies: 0.0  // Sin enemigos (zona segura)
            },

            debugColors: [0x00ffff, 0xff00ff, 0xffffff]  // Cyan, Magenta, Blanco
        }
    },

    // ─────────────────────────────────────────────────────────────
    // REGLAS DE GENERACIÓN
    // ─────────────────────────────────────────────────────────────
    rules: {
        tutorialSlots: 1,              // Solo el primer slot es tutorial (plataformas)
        maxConsecutiveSameType: 2,     // No más de 2 del mismo tipo seguidos
        spawnBuffer: 900,              // Buffer mayor para evitar gaps en dispositivos lentos (360x640 base)
        cleanupDistance: 1100,         // Limpia slots más lejos para que no desaparezcan antes de tiempo en mobile
        startPlatformY: 560            // Ubicación de la plataforma inicial (más abajo para acercar el primer slot)
    }
};

/**
 * Obtiene los límites X válidos para plataformas
 * 
 * Con gameWidth=400, wallWidth=32, platformWidth=128:
 * - Zona jugable: 32 a 368
 * - halfWidth = 64
 * - minX = 32 + 64 = 96
 * - maxX = 368 - 64 = 304
 * 
 * @param {number} gameWidth - Ancho del juego (opcional, usa SLOT_CONFIG.gameWidth si no se proporciona)
 * @returns {Object} { minX, maxX, centerX }
 */
export function getPlatformBounds(gameWidth = null) {
    const actualGameWidth = gameWidth || SLOT_CONFIG.gameWidth;
    const halfWidth = SLOT_CONFIG.platformWidth / 2;  // 64
    const margin = SLOT_CONFIG.wallWidth + WALLS.MARGIN;
    const usableWidth = actualGameWidth - margin * 2;
    // Si la pantalla es muy estrecha (mobile), evitar que minX supere a maxX
    const clampedHalf = usableWidth > halfWidth * 2 ? halfWidth : Math.max(usableWidth / 2, 0);
    const minX = margin + clampedHalf;
    const maxX = actualGameWidth - margin - clampedHalf;
    const centerRaw = actualGameWidth / 2;
    const centerX = Math.max(minX, Math.min(maxX, centerRaw));

    return {
        minX,
        maxX,
        centerX
    };
}

/**
 * Límites seguros para ítems (coins/powerups) considerando paredes y tamaño del ítem.
 * @param {number} gameWidth
 * @param {number} itemSize - ancho del ítem (px)
 * @returns {{minX:number,maxX:number,centerX:number}}
 */
export function getItemBounds(gameWidth = null, itemSize = 32) {
    const actualGameWidth = gameWidth || SLOT_CONFIG.gameWidth;
    const half = itemSize / 2;
    const margin = SLOT_CONFIG.wallWidth + WALLS.MARGIN;
    const usableWidth = actualGameWidth - margin * 2;
    const clampedHalf = usableWidth > itemSize ? half : Math.max(usableWidth / 2, 0);
    const minX = margin + clampedHalf;
    const maxX = actualGameWidth - margin - clampedHalf;
    const centerRaw = actualGameWidth / 2;
    const centerX = Math.max(minX, Math.min(maxX, centerRaw));
    return { minX, maxX, centerX };
}

/**
 * Calcula el número de plataformas que caben en un slot respetando gaps mínimos
 * @param {number} slotHeight - Altura del slot
 * @param {number} minGap - Gap mínimo entre plataformas
 * @returns {number} Número máximo de plataformas
 */
export function calculateMaxPlatforms(slotHeight = SLOT_CONFIG.slotHeight, minGap = SLOT_CONFIG.minVerticalGap) {
    // slotHeight / minGap
    // 640 / 160 = 4 plataformas
    return Math.floor(slotHeight / minGap);
}
