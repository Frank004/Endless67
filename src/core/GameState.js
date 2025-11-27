import EventBus, { Events } from './EventBus.js';

/**
 * GameState - Manages global game state
 * 
 * Singleton que mantiene el estado global del juego.
 * Emite eventos cuando el estado cambia para que otros sistemas reaccionen.
 * 
 * Responsabilidades:
 * - Mantener score, height, lives
 * - Gestionar estados: playing, paused, gameOver
 * - Emitir eventos cuando cambia el estado
 * 
 * Uso:
 *   GameState.instance.addScore(10);
 *   GameState.instance.updateHeight(500);
 *   GameState.instance.pause();
 */
class GameState {
    static instance = null;

    constructor() {
        if (GameState.instance) {
            return GameState.instance;
        }

        this._score = 0;
        this._height = 0;
        this._maxHeight = 0;
        this._lives = 3;
        this._isPaused = false;
        this._isGameOver = false;
        this._soundEnabled = true;

        GameState.instance = this;
    }

    /**
     * Reset game state to initial values
     */
    reset() {
        this._score = 0;
        this._height = 0;
        this._maxHeight = 0;
        this._lives = 3;
        this._isPaused = false;
        this._isGameOver = false;

        EventBus.emit(Events.SCORE_UPDATED, { score: this._score });
        EventBus.emit(Events.HEIGHT_UPDATED, { height: this._height });
    }

    // Score Management
    get score() {
        return this._score;
    }

    addScore(points) {
        this._score += points;
        EventBus.emit(Events.SCORE_UPDATED, {
            score: this._score,
            delta: points
        });
    }

    setScore(value) {
        this._score = value;
        EventBus.emit(Events.SCORE_UPDATED, { score: this._score });
    }

    // Height Management
    get height() {
        return this._height;
    }

    get maxHeight() {
        return this._maxHeight;
    }

    updateHeight(newHeight) {
        this._height = newHeight;

        if (newHeight > this._maxHeight) {
            this._maxHeight = newHeight;
        }

        EventBus.emit(Events.HEIGHT_UPDATED, {
            height: this._height,
            maxHeight: this._maxHeight
        });
    }

    // Lives Management
    get lives() {
        return this._lives;
    }

    loseLife() {
        this._lives = Math.max(0, this._lives - 1);

        EventBus.emit(Events.PLAYER_HIT, {
            lives: this._lives
        });

        if (this._lives <= 0) {
            this.gameOver();
        }
    }

    addLife() {
        this._lives++;
        EventBus.emit(Events.PLAYER_HIT, {
            lives: this._lives
        });
    }

    // Game State Management
    get isPaused() {
        return this._isPaused;
    }

    get isGameOver() {
        return this._isGameOver;
    }

    pause() {
        if (this._isGameOver) return;

        this._isPaused = true;
        EventBus.emit(Events.GAME_PAUSED);
    }

    resume() {
        if (this._isGameOver) return;

        this._isPaused = false;
        EventBus.emit(Events.GAME_RESUMED);
    }

    togglePause() {
        if (this._isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    gameOver() {
        this._isGameOver = true;
        this._isPaused = true;

        EventBus.emit(Events.GAME_OVER, {
            score: this._score,
            height: this._maxHeight,
        });
    }

    startGame() {
        this.reset();
        this._isGameOver = false;
        this._isPaused = false;

        EventBus.emit(Events.GAME_STARTED);
    }

    // Audio Management
    get soundEnabled() {
        return this._soundEnabled;
    }

    toggleSound() {
        this._soundEnabled = !this._soundEnabled;
        EventBus.emit(Events.SOUND_TOGGLED, {
            enabled: this._soundEnabled
        });
    }

    setSoundEnabled(enabled) {
        this._soundEnabled = enabled;
        EventBus.emit(Events.SOUND_TOGGLED, {
            enabled: this._soundEnabled
        });
    }

    // Utility
    getState() {
        return {
            score: this._score,
            height: this._height,
            maxHeight: this._maxHeight,
            lives: this._lives,
            isPaused: this._isPaused,
            isGameOver: this._isGameOver,
            soundEnabled: this._soundEnabled,
        };
    }
}

// Export singleton instance
export default new GameState();
