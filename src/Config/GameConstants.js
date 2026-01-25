/**
 * GameConstants - Centralized game configuration
 * 
 * Todas las constantes del juego en un solo lugar.
 * Facilita el tuning y evita magic numbers en el código.
 */

export const GAME_CONFIG = {
    TITLE: 'Endless67',
    TILE_SIZE: 32, // Unidad base para pixel art 32x32
    // Resoluciones por dispositivo (se usan en main.js)
    RESOLUTIONS: {
        // Base vertical (9:16) para escalar en cualquier monitor/dispositivo
        DESKTOP: { width: 360, height: 640 },
        // Móvil un poco más “cercano” para que se vea más grande al hacer FIT
        MOBILE: { width: 320, height: 568 },
    },
};

export const PHYSICS = {
    GRAVITY: 800,
    DEBUG: false,
    // Bounds del mundo físico (valores grandes para juego infinito)
    WORLD_BOUNDS: {
        MIN_Y: -1000000,
        MAX_Y: 1000000 + 800,
    },
};

export const WALLS = {
    WIDTH: 32, // Ancho de las paredes laterales
    HEIGHT: 1200, // Altura de las paredes (tileSprite)
    Y_OFFSET: 300, // Offset vertical para posicionamiento
    MARGIN: 28, // Margen de seguridad desde las paredes para generación de nivel
    PLATFORM_MARGIN: 50, // Margen para plataformas móviles
    DEPTH: 60, // Profundidad de renderizado
};

export const PLAYER = {
    SPEED: 200,
    JUMP_VELOCITY: -400,
    MAX_HEALTH: 3,
    INVINCIBILITY_DURATION: 1000, // ms
    SIZE: {
        WIDTH: 32,
        HEIGHT: 32,
    },
};

export const PLATFORM = {
    WIDTH: 128,
    HEIGHT: 32,
    SPACING: {
        MIN_X: 64,
        MAX_X: 192,
        MIN_Y: 160,
        MAX_Y: 192,
    },
    INITIAL_Y: 500,
};

export const ENEMY = {
    PATROL: {
        SPEED: 50,
        DETECTION_RANGE: 200,
    },
    SHOOTER: {
        SHOOT_INTERVAL: 2000, // ms
        PROJECTILE_SPEED: 200,
        PROJECTILE_LIFETIME: 3000, // ms
    },
    SPIKE: {
        DAMAGE: 1,
    },
    FLYING: {
        SPEED: 80,
        AMPLITUDE: 50,
        FREQUENCY: 0.002,
    },
};

export const MAZE = {
    BLOCK_SIZE: 50,
    MIN_HEIGHT: 1000, // Altura mínima para que aparezcan mazes
    DIFFICULTY_TIERS: [
        { maxHeight: 2000, patterns: ['EASY'] },
        { maxHeight: 4000, patterns: ['EASY', 'MEDIUM'] },
        { maxHeight: Infinity, patterns: ['EASY', 'MEDIUM', 'HARD'] },
    ],
};

export const LAVA = {
    RISE_SPEED: 0.5, // pixels per frame
    INITIAL_Y: 650,
    DAMAGE: 1,
    WAVE_AMPLITUDE: 5,
    WAVE_FREQUENCY: 0.01,
};

export const SCORE = {
    HEIGHT_MULTIPLIER: 1, // 1 punto por pixel de altura
    COIN_VALUE: 10,
    ENEMY_KILL_VALUE: 50,
};

export const UI = {
    COLORS: {
        PRIMARY: '#00ff00',
        SECONDARY: '#ffff00',
        DANGER: '#ff0000',
        WHITE: '#ffffff',
        BLACK: '#000000',
    },
    FONTS: {
        MAIN: 'Arial',
        SIZE: {
            SMALL: '16px',
            MEDIUM: '24px',
            LARGE: '32px',
            XLARGE: '48px',
        },
    },
    PADDING: 20,
    LOGO: {
        SCALE: 0.24,
        Y: 100,
        LOADER_TOP_PERCENT: 21.5,
        LOADER_OFFSET_PX: 20,
        HTML_WIDTH_VW: 73,
        HTML_MAX_WIDTH_PX: 488,
    },
};

export const AUDIO = {
    VOLUME: {
        MUSIC: 0.5,
        SFX: 0.7,
    },
    KEYS: {
        JUMP: 'jump',
        HIT: 'hit',
        COIN: 'coin',
        GAME_OVER: 'gameOver',
        BACKGROUND_MUSIC: 'bgMusic',
    },
};

export const POOL = {
    INITIAL_SIZE: {
        PLATFORMS: 20,
        ENEMIES: 10,
        PROJECTILES: 15,
        COINS: 10,
    },
    GROW_SIZE: 5, // Cuántos objetos crear cuando el pool se queda sin objetos
};

export const DEBUG = {
    SHOW_FPS: false,
    SHOW_PHYSICS: false,
    GOD_MODE: false,
    SPAWN_RATE_MULTIPLIER: 1,
};

// Tipos de enemigos
export const ENEMY_TYPES = {
    PATROL: 'patrol',
    SHOOTER: 'shooter',
    SPIKE: 'spike',
    FLYING: 'flying',
};

// Tipos de plataformas
export const PLATFORM_TYPES = {
    NORMAL: 'normal',
    MOVING: 'moving',
    BREAKABLE: 'breakable',
    BOUNCY: 'bouncy',
};

// Dificultad
export const DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
};

export default {
    GAME_CONFIG,
    PHYSICS,
    WALLS,
    PLAYER,
    PLATFORM,
    ENEMY,
    MAZE,
    LAVA,
    SCORE,
    UI,
    AUDIO,
    POOL,
    DEBUG,
    ENEMY_TYPES,
    PLATFORM_TYPES,
    DIFFICULTY,
};
