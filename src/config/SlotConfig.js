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
    // DIMENSIONES BASE (DESKTOP: 400x600)
    // ─────────────────────────────────────────────────────────────
    slotHeight: 640,  // Altura FIJA de cada slot (múltiplo de 32px)
    
    gameWidth: 400,   // ✅ CORREGIDO: era 600, pero el juego es 400px de ancho
    wallWidth: 32,
    centerX: 200,     // ✅ CORREGIDO: centro real del juego (400/2)
    
    // ─────────────────────────────────────────────────────────────
    // PLATAFORMAS
    // ─────────────────────────────────────────────────────────────
    platformWidth: PLATFORM_WIDTH,      // Ancho ÚNICO para todas las plataformas
    platformHeight: PLATFORM_HEIGHT,    // Altura estándar (1 tile de 32px)
    minVerticalGap: 160,     // Distancia mínima entre plataformas (NO NEGOCIABLE)
    maxVerticalGap: 192,     // Distancia máxima entre plataformas
    
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
                powerups: 0.15,
                patrol: 0.2,   // Chance de patrullero por plataforma estática
                shooter: 0.1   // Chance de shooter por plataforma estática
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
                powerups: 0.0,
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
        spawnBuffer: 800,              // Genera nuevo slot cuando jugador está a 800px del último
        cleanupDistance: 900,          // Limpia slots a más de 900px debajo de cámara
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
 * @returns {Object} { minX, maxX, centerX }
 */
export function getPlatformBounds() {
    const halfWidth = SLOT_CONFIG.platformWidth / 2;  // 64
    // Usar el mismo margen que LevelManager para evitar desalineación
    const minX = SLOT_CONFIG.wallWidth + WALLS.MARGIN + halfWidth; // 32 + 28 + 64 = 124
    const maxX = SLOT_CONFIG.gameWidth - SLOT_CONFIG.wallWidth - WALLS.MARGIN - halfWidth; // 400 - 32 - 28 - 64 = 276
    
    return {
        minX,
        maxX,
        centerX: SLOT_CONFIG.centerX      // 200
    };
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
