// Sistema de mazes numerados con entradas y salidas consistentes
// Todos los mazes empiezan y terminan con gap central de 120px para consistencia
// Gap estándar: 120px central (entrada/salida)

// Dimensiones base para mazes
export const MAZE_ROW_HEIGHT = 64; // altura de cada bloque
export const MAZE_ROW_GAP = 100;   // separación vertical entre filas
export const MAZE_ROW_COUNT = 6;   // filas por maze por defecto

// MAZE 1: Zig-Zag Simple (Izquierda-Derecha)
// Basado en Panel 1 de la imagen
export const MAZE_1 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'left', width: 224 },
    { type: 'right', width: 224 },
    { type: 'left', width: 224 },
    { type: 'right', width: 224 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 2: L con Bloque Vertical
// Basado en Panel 2 de la imagen
export const MAZE_2 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'left', width: 192 },
    { type: 'right', width: 224 },
    { type: 'right', width: 224 },
    { type: 'left', width: 192 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 3: Escalera desde Abajo
// Basado en Panel 3 de la imagen
export const MAZE_3 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'left', width: 96 },
    { type: 'left', width: 192 },
    { type: 'left', width: 256 },
    { type: 'right', width: 160 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 4: Túnel Central Mejorado (más corto y con variación)
// Basado en Panel 4 de la imagen, pero más corto y con alternancia para facilitar subida
export const MAZE_4 = [
    // Ajustado a múltiplos de 32 y gap central más ancho
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'split', width: 128, width2: 128 },
    { type: 'left', width: 192 }, // Alternancia para variar subida
    { type: 'split', width: 128, width2: 128 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 5: Tres Bloques Horizontales Alternados
// Basado en Panel 5 de la imagen
export const MAZE_5 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'left', width: 224 },
    { type: 'right', width: 224 },
    { type: 'left', width: 224 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 6: Cuatro Bloques Horizontales Alternados
// Basado en Panel 6 de la imagen
export const MAZE_6 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'left', width: 192 },
    { type: 'right', width: 192 },
    { type: 'left', width: 192 },
    { type: 'right', width: 192 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 7: Cuatro Bloques desde la Izquierda
// Basado en Panel 7 de la imagen
export const MAZE_7 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'left', width: 160 },
    { type: 'left', width: 192 },
    { type: 'left', width: 224 },
    { type: 'left', width: 224 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 8: Zigzag Invertido (Derecha-Izquierda)
// Patrón alternado inverso al MAZE_1
export const MAZE_8 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'right', width: 224 },
    { type: 'left', width: 224 },
    { type: 'right', width: 224 },
    { type: 'left', width: 224 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 9: Patrón en S (S-Curve)
// Alternancia suave que forma una S
export const MAZE_9 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'left', width: 160 },
    { type: 'right', width: 192 },
    { type: 'left', width: 224 },
    { type: 'right', width: 192 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 10: Túnel que se Cierra y Abre
// Comienza abierto, se cierra en el medio, y se abre al final
export const MAZE_10 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'split', width: 96, width2: 96 },   // Más abierto
    { type: 'split', width: 160, width2: 160 },  // Más cerrado
    { type: 'split', width: 96, width2: 96 },   // Se abre de nuevo
    { type: 'split', width: 128, width2: 128 }   // Salida central
];

// MAZE 11: Escalera desde la Derecha
// Contraparte del MAZE_3 pero desde la derecha
export const MAZE_11 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'right', width: 96 },
    { type: 'right', width: 192 },
    { type: 'right', width: 256 },
    { type: 'left', width: 160 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 12: Patrón de Pinza (Pincer)
// Se cierra desde ambos lados hacia el centro
export const MAZE_12 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'left', width: 160 },
    { type: 'right', width: 160 },
    { type: 'left', width: 192 },
    { type: 'right', width: 192 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 13: Alternancia Rápida
// Cambios rápidos izquierda-derecha para desafío
export const MAZE_13 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'left', width: 192 },
    { type: 'right', width: 192 },
    { type: 'left', width: 192 },
    { type: 'right', width: 192 },
    { type: 'left', width: 192 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 14: Bloque Central Variable
// Usa bloques centrales de diferentes tamaños
export const MAZE_14 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'center', width: 96 },
    { type: 'center', width: 160 },
    { type: 'center', width: 128 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// MAZE 15: Patrón Mixto Complejo
// Combina diferentes tipos de bloques
export const MAZE_15 = [
    { type: 'split', width: 128, width2: 128 }, // Entrada central
    { type: 'left', width: 160 },
    { type: 'split', width: 128, width2: 128 },
    { type: 'right', width: 224 },
    { type: 'left', width: 192 },
    { type: 'split', width: 128, width2: 128 }  // Salida central
];

// Array de todos los mazes numerados
export const MAZE_PATTERNS_NUMBERED = [
    MAZE_1,  // Maze 1
    MAZE_2,  // Maze 2
    MAZE_3,  // Maze 3
    MAZE_4,  // Maze 4
    MAZE_5,  // Maze 5
    MAZE_6,  // Maze 6
    MAZE_7,  // Maze 7
    MAZE_8,  // Maze 8
    MAZE_9,  // Maze 9
    MAZE_10, // Maze 10
    MAZE_11, // Maze 11
    MAZE_12, // Maze 12
    MAZE_13, // Maze 13
    MAZE_14, // Maze 14
    MAZE_15  // Maze 15
];

// Grupos de mazes por dificultad
// Clasificación basada en complejidad y gaps:
// EASY: Mazes con gaps generosos y patrones simples
// MEDIUM: Mazes que requieren más navegación y timing
// HARD: Mazes complejos con cambios rápidos o gaps más pequeños

// Mantener compatibilidad hacia atrás
export const MAZE_PATTERNS = MAZE_PATTERNS_NUMBERED;
export const MAZE_PATTERNS_EASY = [
    MAZE_3,  // Escalera desde abajo
    MAZE_4,  // Túnel central
    MAZE_5,  // Tres bloques alternados
    MAZE_6,  // Cuatro bloques alternados
    MAZE_8,  // Zigzag invertido (similar a 1)
    MAZE_9,  // Patrón en S
    MAZE_10, // Túnel que se cierra y abre
    MAZE_11  // Escalera desde la derecha
];
export const MAZE_PATTERNS_MEDIUM = [
    MAZE_1,  // Zigzag simple
    MAZE_2,  // L con bloque vertical
    MAZE_12, // Patrón de pinza
    MAZE_14  // Bloque central variable
];
export const MAZE_PATTERNS_HARD = [
    MAZE_7,  // Cuatro bloques desde la izquierda
    MAZE_13, // Alternancia rápida
    MAZE_15  // Patrón mixto complejo
];

/**
 * Obtiene un maze pattern aleatorio del pool combinado (EASY + MEDIUM)
 * @returns {Array} Maze pattern aleatorio
 */
export function getRandomMazePattern() {
    const pool = [...MAZE_PATTERNS_EASY, ...MAZE_PATTERNS_MEDIUM];
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
}

/**
 * Obtiene un maze pattern aleatorio excluyendo uno específico
 * @param {Array|null} excludePattern - Pattern a excluir
 * @returns {Array} Maze pattern aleatorio (diferente al excluido)
 */
export function getRandomMazePatternExcluding(excludePattern) {
    const pool = [...MAZE_PATTERNS_EASY, ...MAZE_PATTERNS_MEDIUM];

    // Si no hay patrón a excluir o solo hay 1 patrón, usar normal
    if (!excludePattern || pool.length <= 1) {
        return getRandomMazePattern();
    }

    // Filtrar el patrón excluido (comparar por referencia)
    const availablePatterns = pool.filter(p => p !== excludePattern);

    // Si el filtro eliminó todo (no debería pasar), usar todos
    if (availablePatterns.length === 0) {
        return getRandomMazePattern();
    }

    const index = Math.floor(Math.random() * availablePatterns.length);
    return availablePatterns[index];
}
