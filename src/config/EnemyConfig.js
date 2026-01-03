export const ENEMY_CONFIG = {
    PATROL: {
        SIZE: 32,
        GRAVITY: 1200,
        SPEED: 60,
        BOUNDS_MARGIN: 2  // Margen reducido para más espacio de patrullaje
    },
    SHOOTER: {
        SIZE: 32,
        GRAVITY: 0
    },
    JUMPER: {
        SIZE: 32,
        GRAVITY: 1200,
        JUMP_FORCE: -465,      // Altura máxima ~90px
        JUMP_INTERVAL_MIN: 800,  // Saltos más frecuentes para dinamismo
        JUMP_INTERVAL_MAX: 1500
    }
};
