export const ENEMY_CONFIG = {
    PATROL: {
        SIZE: 20,

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
        // Menos altura y menos frecuencia para que sean más lentos
        JUMP_FORCE: -360,         // Altura moderada
        JUMP_INTERVAL_MIN: 1400,  // Más tiempo entre saltos
        JUMP_INTERVAL_MAX: 2200
    }
};
