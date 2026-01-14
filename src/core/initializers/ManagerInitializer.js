import { CollisionManager } from '../../managers/collision/CollisionManager.js';
import { LevelManager } from '../../managers/level/LevelManager.js';
import { SlotGenerator } from '../../managers/level/SlotGenerator.js';
import { InputSystem } from '../systems/InputSystem.js';
import { UIManager } from '../../managers/ui/UIManager.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { ParticleManager } from '../../managers/gameplay/ParticleManager.js';
import { RiserManager } from '../../managers/gameplay/RiserManager.js';
import { DebugManager } from '../../managers/debug/DebugManager.js';
import { WallDecorator } from '../../managers/level/WallDecorator.js';
import { InteractableManager } from '../../managers/gameplay/InteractableManager.js';
import { initializePlatformTextureCache } from '../../prefabs/Platform.js';
import { RISER_TYPES } from '../../config/RiserConfig.js';
import { WallDecorManager } from '../../managers/visuals/WallDecorManager.js';
import { DifficultyManager } from '../../managers/level/DifficultyManager.js';

export class ManagerInitializer {
    /**
     * Initializes all game managers.
     * @param {Phaser.Scene} scene 
     */
    static init(scene) {
        // Core Systems (Source of Truth)
        scene.difficultyManager = new DifficultyManager(scene);

        // Gameplay Managers
        scene.collisionManager = new CollisionManager(scene);
        scene.levelManager = new LevelManager(scene);
        scene.wallDecorManager = new WallDecorManager(scene);
        scene.slotGenerator = new SlotGenerator(scene);
        scene.inputManager = new InputSystem(scene);
        scene.uiManager = new UIManager(scene);

        scene.audioManager = new AudioSystem(); // Using new() to get the singleton (safe)
        scene.audioManager.setScene(scene);
        scene.audioManager.setupAudio();

        scene.input.once('pointerdown', () => {
            scene.audioManager.startMusic();
        });

        scene.particleManager = new ParticleManager(scene);
        scene.particleManager.createParticles();

        // Randomize Riser Type for this session
        // Forcing FIRE riser for development per user request
        const randomType = RISER_TYPES.FIRE;
        console.log(`🔥 Game Initializer: FORCED Riser Type: ${randomType}`);

        scene.riserManager = new RiserManager(scene, randomType);

        // Setup specific ambient sound for the selected riser
        if (scene.riserManager.config && scene.riserManager.config.soundKey) {
            scene.audioManager.setupRiserSound(scene.riserManager.config.soundKey);
        }

        scene.debugManager = new DebugManager(scene);
        scene.wallDecorator = new WallDecorator(scene);

        // Create InteractableManager
        scene.interactableManager = new InteractableManager(scene);

        // OPTIMIZATION: Pre-initialize wall patterns and segments immediately
        // This ensures walls are visible from the start and reduces first-frame load
        if (scene.textures.exists('walls')) {
            const initialScrollY = scene.cameras.main.scrollY || 0;
            scene.wallDecorator.preInitialize(initialScrollY);
        }

        // 🚀 OPTIMIZATION: Pre-initialize platform texture cache
        // This caches platform frame references to avoid repeated texture lookups
        if (scene.textures.exists('platform')) {
            initializePlatformTextureCache(scene);
        }
    }
}
