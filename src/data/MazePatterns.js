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
    { type: 'split', width: 140, width2: 140 }, // Entrada central
    { type: 'left', width: 250 },
    { type: 'right', width: 250 },
    { type: 'left', width: 250 },
    { type: 'right', width: 250 },
    { type: 'split', width: 140, width2: 140 }  // Salida central
];

// MAZE 2: L con Bloque Vertical
// Basado en Panel 2 de la imagen
export const MAZE_2 = [
    { type: 'split', width: 140, width2: 140 }, // Entrada central
    { type: 'left', width: 200 },
    { type: 'right', width: 250 }, // Bloque más largo que conecta con vertical (reducido para gap más cómodo)
    { type: 'right', width: 260 }, // Bloque vertical simulado (reducido de 320 a 260 para gap de ~140px)
    { type: 'left', width: 180 },
    { type: 'split', width: 140, width2: 140 }  // Salida central
];

// MAZE 3: Escalera desde Abajo
// Basado en Panel 3 de la imagen
export const MAZE_3 = [
    { type: 'split', width: 140, width2: 140 }, // Entrada central
    { type: 'left', width: 100 },
    { type: 'left', width: 200 },
    { type: 'left', width: 280 },
    { type: 'right', width: 150 },
    { type: 'split', width: 140, width2: 140 }  // Salida central
];

// MAZE 4: Túnel Central Mejorado (más corto y con variación)
// Basado en Panel 4 de la imagen, pero más corto y con alternancia para facilitar subida
export const MAZE_4 = [
    { type: 'split', width: 140, width2: 140 }, // Entrada central
    { type: 'split', width: 140, width2: 140 },
    { type: 'left', width: 200 }, // Alternancia: bloque izquierdo para variar y facilitar subida
    { type: 'split', width: 140, width2: 140 },
    { type: 'split', width: 140, width2: 140 }  // Salida central (reducido de 6 a 4 filas)
];

// MAZE 5: Tres Bloques Horizontales Alternados
// Basado en Panel 5 de la imagen
export const MAZE_5 = [
    { type: 'split', width: 140, width2: 140 }, // Entrada central
    { type: 'left', width: 220 },
    { type: 'right', width: 220 },
    { type: 'left', width: 220 },
    { type: 'split', width: 140, width2: 140 }  // Salida central
];

// MAZE 6: Cuatro Bloques Horizontales Alternados
// Basado en Panel 6 de la imagen
export const MAZE_6 = [
    { type: 'split', width: 140, width2: 140 }, // Entrada central
    { type: 'left', width: 200 },
    { type: 'right', width: 200 },
    { type: 'left', width: 200 },
    { type: 'right', width: 200 },
    { type: 'split', width: 140, width2: 140 }  // Salida central
];

// MAZE 7: Cuatro Bloques desde la Izquierda
// Basado en Panel 7 de la imagen
export const MAZE_7 = [
    { type: 'split', width: 140, width2: 140 }, // Entrada central
    { type: 'left', width: 180 },
    { type: 'left', width: 200 },
    { type: 'left', width: 220 },
    { type: 'left', width: 240 },
    { type: 'split', width: 140, width2: 140 }  // Salida central
];

// Array de todos los mazes numerados
export const MAZE_PATTERNS_NUMBERED = [
    MAZE_1, // Maze 1
    MAZE_2, // Maze 2
    MAZE_3, // Maze 3
    MAZE_4, // Maze 4
    MAZE_5, // Maze 5
    MAZE_6, // Maze 6
    MAZE_7  // Maze 7
];

// Grupos de mazes por dificultad (para referencia)
// Nueva clasificación basada en testing:
// EASY: Mazes 3, 4, 5, 6 (más directos y con gaps generosos)
// MEDIUM: Mazes 1, 2 (requieren más navegación)
// HARD: Maze 7 (más complejo y largo)

// Mantener compatibilidad hacia atrás
export const MAZE_PATTERNS = MAZE_PATTERNS_NUMBERED;
export const MAZE_PATTERNS_EASY = [MAZE_3, MAZE_4, MAZE_5, MAZE_6];
export const MAZE_PATTERNS_MEDIUM = [MAZE_1, MAZE_2];
export const MAZE_PATTERNS_HARD = [MAZE_7];
