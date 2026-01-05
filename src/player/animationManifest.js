/**
 * Manifesto de animaciones del jugador.
 * Llena los keys con los nombres reales del atlas cuando estén listos.
 */

export const ANIM_MANIFEST = {
    GROUND: {
        idle: 'player_idle',
        run: 'player_run',
        runStop: 'player_run_stop'
    },
    AIR_RISE: {
        up: 'player_jump_up',
        side: 'player_jump_side',
        wall: 'player_jump_wall'
    },
    AIR_FALL: {
        start: 'player_fall_start',
        loop: 'player_fall_loop'
    },
    WALL_SLIDE: {
        start: 'player_wall_slide_start',
        loop: 'player_wall_slide_loop'
    },
    POWERUP: 'player_powerup',
    HIT: 'player_hit',
    GOAL: 'player_goal'
};
