import { getLevelConfig } from '../../data/LevelConfig.js';
import { RiserConfiguration, RISER_TYPES } from '../../config/RiserConfig.js';
import { Riser } from '../../prefabs/Riser.js';
import { WALLS } from '../../config/GameConstants.js';
import RiserPipelineManager from './RiserPipelineManager.js';

export class RiserManager {
    constructor(scene, riserType = RISER_TYPES.LAVA) {
        this.scene = scene;
        this.riser = null;
        this.config = new RiserConfiguration(riserType);

        this.currentSpeed = this.config.speedConfig.baseSpeed;
        this.isRising = false;
        this.enabled = true;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (this.riser) {
            this.riser.setVisible(enabled);
        }
    }

    createRiser() {
        const scene = this.scene;
        const gameWidth = scene.game.config.width;
        const wallWidth = WALLS.WIDTH;
        const waveOffset = 20;

        // Visual width includes the wave offset to cover the edges
        const visualWidth = gameWidth - (wallWidth * 2) + (waveOffset * 2);
        const riserX = gameWidth / 2;

        // Get pipeline from RiserPipelineManager based on riser type
        const pipelineName = RiserPipelineManager.getPipelineForType(this.config.type);

        // Create Riser Prefab with managed pipeline
        this.riser = new Riser(
            scene,
            riserX,
            900,
            visualWidth,
            800,
            this.config.texture,
            pipelineName
        );

        // Expose riser to scene for collisions
        scene.riser = this.riser;
        // Legacy support (temporarily)
        scene.fluid = this.riser;
        scene.lava = this.riser;
    }

    update(playerY, currentHeight, isGameOver) {
        if (!this.enabled) {
            if (this.riser) {
                const cameraBottom = this.scene.cameras.main.scrollY + this.scene.cameras.main.height;
                this.riser.y = cameraBottom + 400; // mantener fuera de cámara
                this.riser.tilePositionY -= 0.2;
            }
            return;
        }

        if (isGameOver) {
            this.handleGameOverUpdate();
            return;
        }

        let distanceToRiser = playerY - this.riser.y;

        // Get base speed from level config (difficulty progression)
        const levelConfig = getLevelConfig(currentHeight);
        let difficultySpeed = levelConfig.lava.speed;

        let targetSpeed = difficultySpeed;

        // Catch-up logic (if player is too far ahead, riser speeds up)
        if (distanceToRiser < -800) {
            targetSpeed = this.config.speedConfig.maxSpeed;
        } else if (distanceToRiser < -600) {
            targetSpeed = this.config.speedConfig.maxSpeed * 0.7;
        }

        this.currentSpeed = Phaser.Math.Linear(this.currentSpeed, targetSpeed, this.config.speedConfig.acceleration);
        this.riser.y += this.currentSpeed * (1 / 60);
        this.riser.tilePositionY -= 1;
    }

    handleGameOverUpdate() {
        const scene = this.scene;
        const cameraTop = scene.cameras.main.scrollY;
        const cameraBottom = scene.cameras.main.scrollY + scene.cameras.main.height;

        if (this.isRising) {
            const targetY = cameraTop - 100;
            if (this.riser.y > targetY) {
                this.riser.y -= 8;
            } else {
                this.riser.y = targetY;
            }
        } else {
            const targetY = cameraBottom - 100;
            if (this.riser.y > targetY) {
                this.riser.y = Math.max(this.riser.y - 15, targetY);
            } else {
                this.riser.y = targetY;
            }
        }
        this.riser.tilePositionY -= 2;
    }

    triggerRising() {
        if (this.enabled) {
            this.isRising = true;
        }
    }
}
