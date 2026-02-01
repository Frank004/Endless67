import { CleanupSystem } from '../../Systems/Core/CleanupSystem.js';
import { CollisionManager } from '../../Systems/Collision/CollisionManager.js';
import { LevelManager } from '../../Systems/Level/LevelManager.js';
import { SlotGenerator } from '../../Systems/Level/SlotGenerator.js';
import { InputSystem } from '../../Systems/Core/InputSystem.js';
import { UIManager } from '../../Systems/UI/UIManager.js';
import { AudioSystem } from '../../Systems/Core/AudioSystem.js';
import { ParticleManager } from '../../Systems/Gameplay/ParticleManager.js';
import { RiserManager } from '../../Systems/Gameplay/RiserManager.js';
import { DebugManager } from '../../Systems/Debug/DebugManager.js';
import { WallDecorator } from '../../Systems/Level/WallDecorator.js';
import { InteractableManager } from '../../Systems/Gameplay/InteractableManager.js';
import { initializePlatformTextureCache } from '../../Entities/Platform.js';
import { RISER_TYPES } from '../../Config/RiserConfig.js';
import { WallDecorManager } from '../../Systems/Visuals/WallDecorManager.js';
import { DifficultyManager } from '../../Systems/Level/DifficultyManager.js';
import { ReviveService } from '../../Systems/Gameplay/ReviveService.js';

export class ManagerInitializer {
    /**
     * Initializes all game managers.
     * @param {Phaser.Scene} scene 
     */
    static init(scene) {
        // Core Systems (Source of Truth)
        scene.difficultyManager = new DifficultyManager(scene);
        scene.cleanupSystem = new CleanupSystem(scene);

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
        const types = Object.values(RISER_TYPES);
        const randomType = types[Math.floor(Math.random() * types.length)];
        // console.log(`🚀 Game Initializer: Riser Type: ${randomType}`);

        scene.riserManager = new RiserManager(scene, randomType);

        // Setup specific ambient sound for the selected riser
        if (scene.riserManager.config && scene.riserManager.config.soundKey) {
            scene.audioManager.setupRiserSound(scene.riserManager.config.soundKey);
        }

        scene.debugManager = new DebugManager(scene);
        scene.wallDecorator = new WallDecorator(scene);
        scene.reviveService = new ReviveService(scene);

        // Create InteractableManager
        scene.interactableManager = new InteractableManager(scene);

        // Pre-initialize wall patterns and segments immediately for better startup performance
        if (scene.textures.exists('walls')) {
            const initialScrollY = scene.cameras.main.scrollY || 0;
            scene.wallDecorator.preInitialize(initialScrollY);
        }

        // Cache platform frame references to avoid repeated texture lookups
        if (scene.textures.exists('platform')) {
            initializePlatformTextureCache(scene);
        }
    }
}
