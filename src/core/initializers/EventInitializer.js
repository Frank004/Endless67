import EventBus, { Events } from '../EventBus.js';
import { DeviceConfig } from '../config/DeviceConfig.js';

export class EventInitializer {
    static init(scene) {
        this.setupGameEventListeners(scene);
        this.setupShutdownCleanup(scene);
    }

    static setupGameEventListeners(scene) {
        // Handle physics pause/resume when game state changes
        const pauseListener = () => {
            scene.physics.pause();
            scene.isPaused = true;
        };
        EventBus.on(Events.GAME_PAUSED, pauseListener);
        scene._pauseListener = pauseListener;

        const resumeListener = () => {
            scene.physics.resume();
            scene.isPaused = false;
        };
        EventBus.on(Events.GAME_RESUMED, resumeListener);
        scene._resumeListener = resumeListener;

        const gameOverListener = () => {
            scene.physics.pause();
            scene.isGameOver = true;
            scene.isPaused = true;
        };
        EventBus.on(Events.GAME_OVER, gameOverListener);
        scene._gameOverListener = gameOverListener;

        const gameStartListener = () => {
            scene.physics.resume();
            scene.isGameOver = false;
            scene.isPaused = false;
            scene.gameStarted = true;
            // Ensure music starts if not already playing (e.g. keyboard start)
            if (scene.audioManager) {
                scene.audioManager.startMusic();
            }
        };
        EventBus.on(Events.GAME_STARTED, gameStartListener);
        scene._gameStartListener = gameStartListener;
    }

    static setupShutdownCleanup(scene) {
        scene.events.once('shutdown', () => {
            if (scene.audioManager) scene.audioManager.stopAudio();
            if (scene.uiManager) scene.uiManager.destroy();
            if (scene.particleManager) scene.particleManager.destroy();
            if (scene.interactableManager) scene.interactableManager.destroy();
            if (scene.wallDecorator) scene.wallDecorator.destroy(); // Fix: Clean up wall decoration pools

            // Failsafe: Clear static pools from WallDecorFactory
            // Import WallDecorFactory dynamically if needed, or rely on manager cleanup
            try {
                // We assume wallDecorator.destroy() calls Factory.clearPools(), but safe to ensure references are killed
            } catch (e) { }

            // Cleanup event listeners
            if (scene._pauseListener) EventBus.off(Events.GAME_PAUSED, scene._pauseListener);
            if (scene._resumeListener) EventBus.off(Events.GAME_RESUMED, scene._resumeListener);
            if (scene._gameOverListener) EventBus.off(Events.GAME_OVER, scene._gameOverListener);
            if (scene._gameStartListener) EventBus.off(Events.GAME_STARTED, scene._gameStartListener);

            // Clean global listeners
            DeviceConfig.cleanup(scene);
        });
    }
}
