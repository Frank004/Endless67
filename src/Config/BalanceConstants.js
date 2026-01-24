/**
 * BalanceConstants - métricas físicas base del personaje.
 * Calculadas con gravedad 1200 y velocidad de salto -600 (Player actual).
 * Se usan para validar alcanzabilidad (dx/dy) y diseñar chunks seguros.
 */
const GRAVITY_Y = 1200;
const JUMP_VELOCITY = -600;

// Tiempo hasta el ápice y altura máxima de un salto simple
const TIME_TO_APEX = Math.abs(JUMP_VELOCITY) / GRAVITY_Y; // ~0.5s
const MAX_JUMP_HEIGHT = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY_Y); // ~150px

// Aire total aproximado (subida + bajada simétrica)
const MAX_AIR_TIME = TIME_TO_APEX * 2; // ~1.0s

// Alcance horizontal aproximado considerando maxVelocityX=276 (reducido 8%) y algo de drag
// Usamos un factor conservador (0.9) para evitar asumir velocidad tope sostenida.
const MAX_HORIZONTAL_REACH = 276 * MAX_AIR_TIME * 0.9; // ~248px (reducido 8%)

// Rangos recomendados para spawns verticales
const DY_SAFE = {
    MIN: MAX_JUMP_HEIGHT * 0.55, // ~82px
    MAX: MAX_JUMP_HEIGHT * 0.80  // ~120px
};

const DY_HARD = {
    MIN: MAX_JUMP_HEIGHT * 0.80, // ~120px
    MAX: MAX_JUMP_HEIGHT * 0.92  // ~138px
};

// Rango seguro horizontal (evitar forzar el máximo)
const DX_SAFE = MAX_HORIZONTAL_REACH * 0.7; // ~189px
const DX_HARD = MAX_HORIZONTAL_REACH * 0.88; // ~238px

export const BalanceConstants = {
    GRAVITY_Y,
    JUMP_VELOCITY,
    TIME_TO_APEX,
    MAX_JUMP_HEIGHT,
    MAX_AIR_TIME,
    MAX_HORIZONTAL_REACH,
    DY_SAFE,
    DY_HARD,
    DX_SAFE,
    DX_HARD,
};

export default BalanceConstants;

