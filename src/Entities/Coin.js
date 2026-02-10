/**
 * Coin.js
 * 
 * Prefab para coins del juego.
 * Maneja su propia animación, escala y lógica de spawn/despawn.
 * 
 * Principios:
 * - Single Responsibility: Solo lógica del coin
 * - Encapsulation: Maneja su propia animación y visual
 */

import { ASSETS } from '../Config/AssetKeys.js';

export const COIN_BASE_SIZE = 32;   // Canvas original del sprite
export const COIN_VISUAL_SIZE = 24; // Tamaño visual deseado en pantalla
export const COIN_HITBOX_SIZE = 14; // Tamaño del hitbox físico

export class Coin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        // Determinar qué textura usar: sprite sheet o fallback
        const hasSpriteSheet = scene.textures.exists(ASSETS.COINS);
        const textureKey = hasSpriteSheet ? ASSETS.COINS : 'coin';
        const frameKey = hasSpriteSheet ? 'coin-01.png' : null;

        // Crear sprite con frame inicial si hay sprite sheet
        super(scene, 0, 0, textureKey, frameKey);

        // Agregar a la escena y al physics world
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Configurar física básica
        if (this.body) {
            this.body.allowGravity = false;
            this.body.immovable = true;
            this.body.setEnable(true);
        }

        // Configuración inicial
        this.setDepth(10);

        // Inicialmente inactivo
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Spawn del coin (llamado desde PoolManager o directamente)
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     */
    spawn(x, y) {
        if (!this.scene || !this.scene.physics) {
            console.error('❌ Coin.spawn: scene o physics indefinido');
            return;
        }
        // Asegurar que está en el physics world
        if (!this.body) {
            this.scene.physics.add.existing(this);
        }
        if (this.body) {
            this.body.setEnable(true);
        }

        // Establecer posición PRIMERO
        this.setPosition(x, y);

        // Configurar tamaño visual
        // Los frames están trimmed (recortados) en el sprite sheet
        // sourceSize es 32x32px según coins.json (igual que el player)
        // frame trimmed es ~9x10px (el sprite real recortado)
        // IMPORTANTE: El coin debe verse a su tamaño natural escalado
        // El body debe coincidir con el tamaño visual real del sprite, no con el displaySize completo
        const SOURCE_SIZE = COIN_BASE_SIZE; // Tamaño original del canvas (sourceSize en JSON)

        // Configurar origen al centro (0.5, 0.5) para que el sprite se centre correctamente
        this.setOrigin(0.5, 0.5);

        // Obtener el tamaño del frame trimmed
        const frame = this.frame;
        const trimmedWidth = frame ? frame.width : 9;  // ~9px según JSON
        const trimmedHeight = frame ? frame.height : 10; // ~10px según JSON

        // Calcular el scale para que el sprite visual sea ~28px
        // Usamos un scale uniforme basado en el promedio para mantener proporciones
        const VISUAL_SIZE = COIN_VISUAL_SIZE; // Tamaño visual deseado del coin (~28px)
        const HITBOX_SIZE = COIN_HITBOX_SIZE; // Tamaño del hitbox (24x24px - 25% reducido de 32px)
        const avgTrimmedSize = (trimmedWidth + trimmedHeight) / 2;
        const scale = VISUAL_SIZE / avgTrimmedSize; // Escalar para que el promedio sea ~28px

        // Resetear scale primero
        this.setScale(1);
        // Aplicar scale uniforme para mantener proporciones
        this.setScale(scale);

        // Verificar que el displaySize sea correcto
        // Verificar que el displaySize sea correcto
        // console.log(`  🪙 Coin spawn...`);

        // Configurar física para colisiones
        // IMPORTANTE: El hitbox debe ser 24x24px (tamaño fijo), independiente del tamaño visual
        // Configurar física para colisiones
        // IMPORTANTE: El hitbox debe ser 24x24px (tamaño fijo), independiente del tamaño visual
        if (this.body) {
            // KEY FIX: Use CIRCLE body for better overlap detection
            // Circle radius = 12px (diameter 24px) to match previous HITBOX_SIZE
            const radius = HITBOX_SIZE / 2;
            this.body.setCircle(radius);

            // Center the circle in the sprite (offset is relative to top-left of the sprite frame)
            // Visual size ~28px. Hitbox 24px.
            // Offset for circle: (VisualWidth - Diameter) / 2
            const offsetX = (this.width - (radius * 2)) / 2;

            // Correction to align visual bottom with hitbox bottom (prevents floating)
            const VISUAL_BOTTOM_CORRECTION = -5;
            const offsetY = ((this.height - (radius * 2)) / 2) + VISUAL_BOTTOM_CORRECTION;

            this.body.setOffset(offsetX, offsetY);

            this.body.allowGravity = false;

            // SENSOR MODE: No physical collision response, only overlap events
            // This SOLVES the "Player jumps on Coin" bug permanently.
            this.body.immovable = false; // Moves if pushed? No, because we won't collide.
            this.body.moves = false; // Optimization: If it never moves physically

            // Wait - if body.moves = false, overlap might not work in some dynamic cases?
            // Actually, keep moves = true but disable collision response
            this.body.moves = true;

            // Disable physical separation logic, but keep collision enabled (none = false)
            // If none=true, Overlap checks might be skipped by Phaser!
            this.body.checkCollision.none = false;
            this.body.checkCollision.up = false;
            this.body.checkCollision.down = false;
            this.body.checkCollision.left = false;
            this.body.checkCollision.right = false;

            this.body.customSeparateX = false;
            this.body.customSeparateY = false;

            // Debug: mostrar hitbox visual
            this.showHitbox = this.scene.registry.get('showCoinHitbox') !== false; // Default: true
            if (this.showHitbox) {
                this.createHitboxVisual();
            }

            // Debug: verificar body size y posición
            // Debug: verificar body size y posición
            // console.log(`  🎯 Coin: ...`);
        }

        // Activar
        this.setActive(true);
        this.setVisible(true);

        // Reproducir animación si está disponible
        if (this.scene.anims.exists('coin_spin')) {
            this.anims.play('coin_spin', true);
        }
    }

    /**
     * Despawn del coin (llamado cuando se devuelve al pool)
     */
    despawn() {
        // Detener animación
        if (this.anims) {
            this.anims.stop();
        }

        // Resetear scale
        this.setScale(1);

        // Desactivar
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Crear hitbox visual para debug
     */
    createHitboxVisual() {
        if (this.hitboxGraphics) {
            this.hitboxGraphics.destroy();
        }

        this.hitboxGraphics = this.scene.add.graphics();
        this.hitboxGraphics.setDepth(1001); // Por encima del coin (depth 10)

        // Actualizar hitbox visual
        this.updateHitboxVisual();
    }

    /**
     * Actualizar hitbox visual
     */
    updateHitboxVisual() {
        if (!this.hitboxGraphics || !this.body || !this.active) {
            return;
        }

        this.hitboxGraphics.clear();

        // Dibujar el hitbox del body de física en color amarillo
        const body = this.body;
        const x = body.x;
        const y = body.y;
        const width = body.width;
        const height = body.height;

        // Color amarillo para coins
        this.hitboxGraphics.lineStyle(2, 0xFFFF00, 1); // Amarillo, 2px de grosor
        this.hitboxGraphics.strokeRect(x, y, width, height);

        // Relleno semi-transparente
        this.hitboxGraphics.fillStyle(0xFFFF00, 0.2); // Amarillo con 20% de opacidad
        this.hitboxGraphics.fillRect(x, y, width, height);
    }

    /**
     * PreUpdate (opcional, para lógica por frame)
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Actualizar hitbox visual si está activo
        if (this.showHitbox && this.hitboxGraphics) {
            this.updateHitboxVisual();
        }

        // Cleanup si está muy abajo
        if (this.scene.player && this.y > this.scene.player.y + 900) {
            this.despawn();
        }
    }

    /**
     * Despawn del coin (llamado cuando se devuelve al pool)
     */
    despawn() {
        // Limpiar hitbox visual
        if (this.hitboxGraphics) {
            this.hitboxGraphics.destroy();
            this.hitboxGraphics = null;
        }

        // Detener animación
        if (this.anims) {
            this.anims.stop();
        }

        // Deshabilitar body para evitar overlaps repetidos
        if (this.body) {
            this.body.setEnable(false);
        }

        // Resetear scale
        this.setScale(1);

        // Desactivar
        this.setActive(false);
        this.setVisible(false);
    }
}
