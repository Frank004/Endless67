/**
 * PlatformPatterns.js
 * 
 * Patrones base de plataformas para el juego.
 * 
 * DIMENSIONES DEL JUEGO (DESKTOP):
 * - gameWidth: 400px
 * - wallWidth: 32px cada lado
 * - platformWidth: 128px (halfWidth = 64px)
 * - Zona jugable: 32 a 368
 * - Centro mínimo X: 96 (32 + 64)
 * - Centro máximo X: 304 (368 - 64)
 * - Centro del juego: 200
 * 
 * RANGO VÁLIDO PARA CENTROS: 96 a 304
 */

export const PLATFORM_PATTERNS = [
    // ─────────────────────────────────────────────────────────────
    // PATRONES ZIGZAG (Alternancia izquierda-derecha)
    // ─────────────────────────────────────────────────────────────
    {
        name: 'zigzag_simple',
        description: 'Zigzag simple izquierda-derecha',
        platforms: [
            { x: 120, y: 0 },
            { x: 280, y: -160 },
            { x: 120, y: -320 },
            { x: 280, y: -480 }
        ]
    },
    
    {
        name: 'zigzag_center_left',
        description: 'Zigzag centro hacia izquierda',
        platforms: [
            { x: 200, y: 0 },
            { x: 120, y: -160 },
            { x: 200, y: -320 },
            { x: 120, y: -480 }
        ]
    },
    
    {
        name: 'zigzag_center_right',
        description: 'Zigzag centro hacia derecha',
        platforms: [
            { x: 200, y: 0 },
            { x: 280, y: -160 },
            { x: 200, y: -320 },
            { x: 280, y: -480 }
        ]
    },
    
    {
        name: 'zigzag_wide',
        description: 'Zigzag amplio (extremos)',
        platforms: [
            { x: 100, y: 0 },
            { x: 300, y: -160 },
            { x: 100, y: -320 },
            { x: 300, y: -480 }
        ]
    },
    
    {
        name: 'zigzag_asymmetric',
        description: 'Zigzag asimétrico',
        platforms: [
            { x: 140, y: 0 },
            { x: 260, y: -160 },
            { x: 180, y: -320 },
            { x: 220, y: -480 }
        ]
    },
    
    // ─────────────────────────────────────────────────────────────
    // PATRONES COLUMNA (Verticales)
    // ─────────────────────────────────────────────────────────────
    {
        name: 'column_left',
        description: 'Columna lado izquierdo',
        platforms: [
            { x: 120, y: 0 },
            { x: 120, y: -160 },
            { x: 120, y: -320 },
            { x: 120, y: -480 }
        ]
    },
    
    {
        name: 'column_center',
        description: 'Columna centro',
        platforms: [
            { x: 200, y: 0 },
            { x: 200, y: -160 },
            { x: 200, y: -320 },
            { x: 200, y: -480 }
        ]
    },
    
    {
        name: 'column_right',
        description: 'Columna lado derecho',
        platforms: [
            { x: 280, y: 0 },
            { x: 280, y: -160 },
            { x: 280, y: -320 },
            { x: 280, y: -480 }
        ]
    },
    
    {
        name: 'column_alternating',
        description: 'Columna con alternancia suave',
        platforms: [
            { x: 160, y: 0 },
            { x: 240, y: -160 },
            { x: 160, y: -320 },
            { x: 240, y: -480 }
        ]
    },
    
    // ─────────────────────────────────────────────────────────────
    // PATRONES ESCALERA (Progresión diagonal)
    // ─────────────────────────────────────────────────────────────
    {
        name: 'stairs_left_to_right',
        description: 'Escalera de izquierda a derecha',
        platforms: [
            { x: 100, y: 0 },
            { x: 165, y: -160 },
            { x: 235, y: -320 },
            { x: 300, y: -480 }
        ]
    },
    
    {
        name: 'stairs_right_to_left',
        description: 'Escalera de derecha a izquierda',
        platforms: [
            { x: 300, y: 0 },
            { x: 235, y: -160 },
            { x: 165, y: -320 },
            { x: 100, y: -480 }
        ]
    },
    
    {
        name: 'stairs_center_out',
        description: 'Escalera del centro hacia afuera',
        platforms: [
            { x: 200, y: 0 },
            { x: 130, y: -160 },
            { x: 270, y: -320 },
            { x: 200, y: -480 }
        ]
    },
    
    // ─────────────────────────────────────────────────────────────
    // PATRONES ESPECIALES
    // ─────────────────────────────────────────────────────────────
    {
        name: 'diamond',
        description: 'Patrón diamante',
        platforms: [
            { x: 200, y: 0 },
            { x: 120, y: -160 },
            { x: 280, y: -320 },
            { x: 200, y: -480 }
        ]
    },
    
    {
        name: 'wave_left',
        description: 'Onda hacia la izquierda',
        platforms: [
            { x: 240, y: 0 },
            { x: 140, y: -160 },
            { x: 240, y: -320 },
            { x: 140, y: -480 }
        ]
    },
    
    {
        name: 'wave_right',
        description: 'Onda hacia la derecha',
        platforms: [
            { x: 160, y: 0 },
            { x: 260, y: -160 },
            { x: 160, y: -320 },
            { x: 260, y: -480 }
        ]
    },
    
    // ─────────────────────────────────────────────────────────────
    // PATRONES ADICIONALES (4 nuevos)
    // ─────────────────────────────────────────────────────────────
    {
        name: 'snake_tight',
        description: 'Serpiente apretada',
        platforms: [
            { x: 150, y: 0 },
            { x: 200, y: -160 },
            { x: 250, y: -320 },
            { x: 200, y: -480 }
        ]
    },
    
    {
        name: 'bounce_extreme',
        description: 'Rebote extremo de lado a lado',
        platforms: [
            { x: 100, y: 0 },
            { x: 300, y: -160 },
            { x: 100, y: -320 },
            { x: 300, y: -480 }
        ]
    },
    
    {
        name: 'funnel_down',
        description: 'Embudo hacia el centro',
        platforms: [
            { x: 100, y: 0 },
            { x: 150, y: -160 },
            { x: 250, y: -320 },
            { x: 200, y: -480 }
        ]
    },
    
    {
        name: 'stutter_step',
        description: 'Pasos cortos alternados',
        platforms: [
            { x: 180, y: 0 },
            { x: 220, y: -160 },
            { x: 180, y: -320 },
            { x: 220, y: -480 }
        ]
    }
];

/**
 * Obtiene un patrón aleatorio
 * @returns {Object} Patrón aleatorio
 */
export function getRandomPattern() {
    const index = Math.floor(Math.random() * PLATFORM_PATTERNS.length);
    return PLATFORM_PATTERNS[index];
}

/**
 * Obtiene un patrón por nombre
 * @param {string} name - Nombre del patrón
 * @returns {Object|null} Patrón o null si no existe
 */
export function getPatternByName(name) {
    return PLATFORM_PATTERNS.find(p => p.name === name) || null;
}

/**
 * Obtiene todos los nombres de patrones
 * @returns {Array<string>} Array de nombres
 */
export function getPatternNames() {
    return PLATFORM_PATTERNS.map(p => p.name);
}
