import { ManagerInitializer } from './Initializers/ManagerInitializer.js';
import { WorldInitializer } from './Initializers/WorldInitializer.js';
import { EventInitializer } from './Initializers/EventInitializer.js';
import { DeviceConfig } from '../Config/DeviceConfig.js';

export class GameInitializer {
    constructor(scene) {
        this.scene = scene;
    }

    init() {
        this.setupDeviceDetection();

        // Initialize World (Camera, Physics, Walls, Pools)
        WorldInitializer.init(this.scene);

        // Initialize Managers (Score, UI, Input, Audio, etc.)
        ManagerInitializer.init(this.scene);

        // Setup Events (Pause, Resume, Game Over)
        EventInitializer.init(this.scene);
    }

    setupDeviceDetection() {
        DeviceConfig.setup(this.scene);
    }

    // Static delegation for wall updates
    static updateWalls(scene) {
        WorldInitializer.updateWalls(scene);
    }
}
