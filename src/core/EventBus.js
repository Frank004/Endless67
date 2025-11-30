/**
 * EventBus - Central event emitter for decoupled communication
 * 
 * Singleton pattern para un bus de eventos global.
 * Permite que diferentes partes del juego se comuniquen sin acoplamiento directo.
 * 
 * Nota: Phaser se carga desde CDN en index.html, por lo que está disponible como variable global.
 * 
 * Uso:
 *   EventBus.emit('PLAYER_DIED', { score: 100 });
 *   EventBus.on('PLAYER_DIED', (data) => console.log(data.score));
 */
class EventBus extends Phaser.Events.EventEmitter {
    constructor() {
        super();
    }
}

// Singleton instance
export default new EventBus();

/**
 * Event Names - Constantes para los nombres de eventos
 * Esto previene typos y facilita el autocompletado
 */
export const Events = {
    // Player Events
    PLAYER_DIED: 'PLAYER_DIED',
    PLAYER_JUMPED: 'PLAYER_JUMPED',      // Emitted by Player after successful jump
    PLAYER_JUMP_REQUESTED: 'PLAYER_JUMP_REQUESTED',  // Emitted by InputManager when jump is requested
    PLAYER_LANDED: 'PLAYER_LANDED',
    PLAYER_HIT: 'PLAYER_HIT',
    PLAYER_MOVE: 'PLAYER_MOVE',      // { direction: -1 | 0 | 1 }
    PLAYER_STOP: 'PLAYER_STOP',      // Player stopped moving

    // Score Events
    SCORE_UPDATED: 'SCORE_UPDATED',
    HEIGHT_UPDATED: 'HEIGHT_UPDATED',

    // Game State Events
    GAME_STARTED: 'GAME_STARTED',
    GAME_OVER: 'GAME_OVER',
    GAME_PAUSED: 'GAME_PAUSED',
    GAME_RESUMED: 'GAME_RESUMED',

    // UI Events
    SHOW_PAUSE_MENU: 'SHOW_PAUSE_MENU',
    HIDE_PAUSE_MENU: 'HIDE_PAUSE_MENU',
    SHOW_GAME_OVER: 'SHOW_GAME_OVER',
    SHOW_HIGH_SCORE_INPUT: 'SHOW_HIGH_SCORE_INPUT',

    // Audio Events
    SOUND_TOGGLED: 'SOUND_TOGGLED',
    PLAY_SFX: 'PLAY_SFX',

    // Level Events
    PLATFORM_SPAWNED: 'PLATFORM_SPAWNED',
    PLATFORM_DESTROYED: 'PLATFORM_DESTROYED',
    ENEMY_SPAWNED: 'ENEMY_SPAWNED',
    ENEMY_DESTROYED: 'ENEMY_DESTROYED',

    // Collectibles
    COIN_COLLECTED: 'COIN_COLLECTED',
    POWERUP_COLLECTED: 'POWERUP_COLLECTED',
};
