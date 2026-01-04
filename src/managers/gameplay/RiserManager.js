import { getLevelConfig } from '../../data/LevelConfig.js';
import { RiserConfiguration, RISER_TYPES } from '../../config/RiserConfig.js';
import { Riser } from '../../prefabs/Riser.js';
import { WALLS } from '../../config/GameConstants.js';
import { LAYOUT_CONFIG } from '../../config/LayoutConfig.js';
import RiserPipelineManager from './RiserPipelineManager.js';

export class RiserManager {
    constructor(scene, riserType = RISER_TYPES.LAVA) {
        this.scene = scene;
        this.riser = null;
        this.config = new RiserConfiguration(riserType);

        this.currentSpeed = this.config.speedConfig.baseSpeed;
        this.isRising = false;
        this.enabled = true;
        this.riserHeight = null; // Se calculará dinámicamente en createRiser()
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

        // Visual width: más ancho que la pantalla para cubrir completamente
        // Usar ancho completo de la pantalla + margen extra para asegurar cobertura
        const visualWidth = gameWidth + (waveOffset * 4); // Más ancho que la pantalla
        const riserX = gameWidth / 2;

        // Get pipeline from RiserPipelineManager based on riser type
        const pipelineName = RiserPipelineManager.getPipelineForType(this.config.type);

        // Create Riser Prefab with managed pipeline
        // Initial Y: posicionar para que solo 20px sean visibles al inicio, MÁS ABAJO de los pies del jugador
        const screenHeight = scene?.scale?.height || scene?.game?.config?.height || 640;
        const adHeight = 50; // Altura del ad banner
        const floorHeight = 32; // Altura del stage floor
        const effectiveHeight = screenHeight - adHeight;
        const floorY = effectiveHeight - floorHeight;
        const playerSpawnY = effectiveHeight - floorHeight - 16; // Posición del jugador (centro)
        
        // Con origin (0.5, 0), el Y es el top del riser
        // Queremos que solo 20px sean visibles, MÁS ABAJO de los pies del jugador
        // Los pies del jugador están aproximadamente en floorY (o un poco más abajo)
        // La lava debe estar más abajo: floorY + offset, mostrando solo 20px visibles
        // Si el top del riser está en floorY + 20, entonces 20px serán visibles desde floorY hacia abajo
        const initialY = floorY + 20; // 20px abajo del floor, solo 20px visibles

        // Altura dinámica: altura de pantalla completa + margen de seguridad para cubrir cualquier pantalla
        // Usar al menos 2x la altura de la pantalla para asegurar cobertura completa en game over
        const safetyMultiplier = 2.5; // Multiplicador para asegurar cobertura en cualquier altura de pantalla
        this.riserHeight = Math.max(screenHeight * safetyMultiplier, 2000); // Mínimo 2000px para pantallas muy pequeñas

        this.riser = new Riser(
            scene,
            riserX,
            initialY,
            visualWidth,
            this.riserHeight,
            this.config.texture,
            pipelineName
        );

        // Flag para controlar cuando empieza a subir (espera a que jugador esté a mitad de pantalla)
        this.hasStartedRising = false;

        // Expose riser to scene for collisions
        scene.riser = this.riser;
        // Legacy support (temporarily)
        scene.fluid = this.riser;
        scene.lava = this.riser;
    }

    update(playerY, currentHeight, isGameOver) {
        // CRÍTICO: No actualizar si el juego no ha comenzado
        const scene = this.scene;
        if (!scene.gameStarted) {
            // Mantener la lava en su posición inicial mientras el juego no inicia
            if (this.riser) {
                const screenHeight = scene?.scale?.height || 640;
                const adHeight = 50;
                const floorHeight = 32;
                const effectiveHeight = screenHeight - adHeight;
                const floorY = effectiveHeight - floorHeight;
                const targetY = floorY + 20; // Solo 20px visibles, más abajo del floor
                this.riser.y = targetY;
                this.riser.tilePositionY -= 0.5; // Animación visual
            }
            return;
        }

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

        // ESPACIO DE RESPIRO: Esperar hasta que el jugador haya subido una distancia mínima antes de empezar a subir
        if (!this.hasStartedRising) {
            // Guardar posición inicial del jugador si no está guardada (solo una vez)
            if (this.initialPlayerY === undefined) {
                this.initialPlayerY = playerY;
                console.log(`🔥 Lava inicializada - Jugador en Y=${Math.round(playerY)}, Lava en Y=${Math.round(this.riser.y)}`);
            }
            
            // Calcular cuánto ha subido el jugador desde su posición inicial
            const playerRiseDistance = this.initialPlayerY - playerY; // Positivo cuando sube
            
            // Esperar hasta que el jugador haya subido al menos la mitad de la altura de la pantalla
            const camera = this.scene.cameras.main;
            const requiredRise = camera.height / 2; // Mitad de la altura de la cámara (ej: 590/2 = 295px)
            
            // CRÍTICO: Mantener la lava en su posición inicial mientras espera
            const screenHeight = this.scene?.scale?.height || 640;
            const adHeight = 50;
            const floorHeight = 32;
            const effectiveHeight = screenHeight - adHeight;
            const floorY = effectiveHeight - floorHeight;
            const targetY = floorY + 20; // Mantener a 20px visibles, más abajo del floor
            
            // Forzar posición inicial si se ha movido
            if (Math.abs(this.riser.y - targetY) > 1) {
                this.riser.y = targetY;
            }
            
            if (playerRiseDistance >= requiredRise) {
                this.hasStartedRising = true;
                console.log(`🔥 Lava iniciando subida - Jugador subió ${Math.round(playerRiseDistance)}px (requerido: ${Math.round(requiredRise)}px)`);
            } else {
                // Mantener la lava en su posición inicial (solo 20px visibles)
                // Solo animar el tilePositionY para efecto visual
                this.riser.tilePositionY -= 0.5;
                return; // No subir todavía
            }
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
        const camera = scene.cameras.main;
        const cameraTop = camera.scrollY;
        const cameraBottom = camera.scrollY + camera.height;
        const cameraHeight = camera.height;
        
        // Usar la altura real del riser (calculada dinámicamente)
        const riserHeight = this.riserHeight || this.riser.displayHeight || 3000;

        if (this.isRising) {
            // Cuando la lava mata al jugador, debe cubrir completamente la pantalla
            // Con origin (0.5, 0), el Y es el top del riser
            // El bottom del riser está en riser.y + riserHeight
            
            // Estrategia: Asegurar que la lava cubra desde el bottom de la cámara hasta arriba del top
            // El bottom del riser debe estar arriba del cameraTop (con margen)
            // El top del riser debe estar abajo del cameraBottom (con margen)
            // Como el riser es muy alto (2.5x pantalla), esto garantiza cobertura completa
            
            const safetyMargin = Math.max(cameraHeight * 0.3, 150); // 30% de la altura de la cámara o mínimo 150px
            
            // Target 1: Bottom del riser arriba del cameraTop
            const targetBottomY = cameraTop - safetyMargin;
            const targetTopY1 = targetBottomY - riserHeight;
            
            // Target 2: Top del riser abajo del cameraBottom (para cubrir el bottom de la pantalla)
            const targetTopY2 = cameraBottom + safetyMargin - riserHeight;
            
            // Usar el target más bajo para asegurar que cubra tanto arriba como abajo
            // Esto garantiza cobertura completa en cualquier posición de la cámara
            const targetTopY = Math.min(targetTopY1, targetTopY2);
            
            if (this.riser.y > targetTopY) {
                // Subir rápidamente para cubrir la pantalla
                this.riser.y -= 30; // Velocidad rápida de subida
                // Asegurar que no pase del target
                if (this.riser.y < targetTopY) {
                    this.riser.y = targetTopY;
                }
            } else {
                // Ya cubrió la pantalla completamente, mantener posición
                this.riser.y = targetTopY;
            }
        } else {
            // Si no está rising, mantener posición actual
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
