import { getLevelConfig } from '../data/LevelConfig.js';

export class LavaManager {
    constructor(scene) {
        this.scene = scene;
        this.lava = null;
        this.baseLavaSpeed = -54;
        this.currentLavaSpeed = -54;
        this.lavaRising = false;
    }

    createLava() {
        const scene = this.scene;
        const gameWidth = scene.game.config.width;
        const wallWidth = 32;
        const waveOffset = 20;
        const lavaVisualWidth = gameWidth - (wallWidth * 2) + (waveOffset * 2);
        const lavaPhysicsWidth = gameWidth - (wallWidth * 2);
        const lavaX = gameWidth / 2;

        this.lava = scene.add.tileSprite(lavaX, 900, lavaVisualWidth, 800, 'lava_texture').setOrigin(0.5, 0);
        scene.physics.add.existing(this.lava);
        this.lava.body.allowGravity = false;
        this.lava.body.immovable = true;
        
        // Ajustar el body de física para que coincida exactamente con la parte superior visual de la lava
        // El body debe ser delgado y estar en la parte superior para detectar colisiones precisas
        // Considerando que el player tiene un body de ~20px de altura con offset en la parte inferior
        const lavaBodyHeight = 10; // Body delgado en la parte superior
        // Offset Y negativo para que el body esté exactamente en la parte superior visual
        // Esto compensa cualquier diferencia entre la posición visual y el body
        const lavaBodyOffsetY = -5; // Offset negativo para subir el body y alinearlo con la parte superior visual
        
        this.lava.body.setSize(lavaPhysicsWidth, lavaBodyHeight);
        this.lava.body.setOffset(waveOffset, lavaBodyOffsetY);
        this.lava.setDepth(50);

        if (scene.game.renderer.type === Phaser.WEBGL) {
            this.lava.setPostPipeline('LavaPipeline');
        }

        // Expose lava to scene for collisions
        scene.lava = this.lava;
    }

    update(playerY, currentHeight, isGameOver) {
        if (isGameOver) {
            this.handleGameOverUpdate();
            return;
        }

        let distanceToLava = playerY - this.lava.y;

        // Get speed from config
        const config = getLevelConfig(currentHeight);
        let tierSpeed = config.lava.speed;

        let targetSpeed = tierSpeed;
        if (distanceToLava < -800) targetSpeed = -180;
        else if (distanceToLava < -600) targetSpeed = -126;

        this.currentLavaSpeed = Phaser.Math.Linear(this.currentLavaSpeed, targetSpeed, 0.02);
        this.lava.y += this.currentLavaSpeed * (1 / 60);
        this.lava.tilePositionY -= 1;
    }

    handleGameOverUpdate() {
        const scene = this.scene;
        const cameraTop = scene.cameras.main.scrollY;
        const cameraBottom = scene.cameras.main.scrollY + scene.cameras.main.height;

        if (this.lavaRising) {
            const targetY = cameraTop - 100;
            if (this.lava.y > targetY) {
                this.lava.y -= 8;
            } else {
                this.lava.y = targetY;
            }
        } else {
            const targetY = cameraBottom - 100;
            if (this.lava.y > targetY) {
                this.lava.y = Math.max(this.lava.y - 15, targetY);
            } else {
                this.lava.y = targetY;
            }
        }
        this.lava.tilePositionY -= 2;
    }

    triggerRising() {
        this.lavaRising = true;
    }
}
