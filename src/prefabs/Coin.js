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

export class Coin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        // Determinar qué textura usar: sprite sheet o fallback
        const hasSpriteSheet = scene.textures.exists('coins');
        const textureKey = hasSpriteSheet ? 'coins' : 'coin';
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
        // Asegurar que está en el physics world
        if (!this.body) {
            this.scene.physics.add.existing(this);
        }

        // Establecer posición PRIMERO
        this.setPosition(x, y);
        
        // Configurar tamaño visual
        // Los frames están trimmed (recortados) en el sprite sheet
        // sourceSize es 32x32px según coins.json (igual que el player)
        // frame trimmed es ~9x10px (el sprite real recortado)
        // IMPORTANTE: El coin debe verse a su tamaño natural escalado
        // El body debe coincidir con el tamaño visual real del sprite, no con el displaySize completo
        const SOURCE_SIZE = 32; // Tamaño original del canvas (sourceSize en JSON)
        
        // Configurar origen al centro (0.5, 0.5) para que el sprite se centre correctamente
        this.setOrigin(0.5, 0.5);
        
        // Obtener el tamaño del frame trimmed
        const frame = this.frame;
        const trimmedWidth = frame ? frame.width : 9;  // ~9px según JSON
        const trimmedHeight = frame ? frame.height : 10; // ~10px según JSON
        
        // Calcular el scale para que el sprite visual sea ~28px
        // Usamos un scale uniforme basado en el promedio para mantener proporciones
        const VISUAL_SIZE = 24; // Tamaño visual deseado del coin (~28px)
        const HITBOX_SIZE = 10; // Tamaño del hitbox (24x24px - 25% reducido de 32px)
        const avgTrimmedSize = (trimmedWidth + trimmedHeight) / 2;
        const scale = VISUAL_SIZE / avgTrimmedSize; // Escalar para que el promedio sea ~28px
        
        // Resetear scale primero
        this.setScale(1);
        // Aplicar scale uniforme para mantener proporciones
        this.setScale(scale);
        
        // Verificar que el displaySize sea correcto
        console.log(`  🪙 Coin spawn: trimmed=${trimmedWidth}x${trimmedHeight}, visualSize=${VISUAL_SIZE}px, scale=${scale.toFixed(2)}, displaySize=${this.displayWidth.toFixed(0)}x${this.displayHeight.toFixed(0)}`);
        
        // Configurar física para colisiones
        // IMPORTANTE: El hitbox debe ser 24x24px (tamaño fijo), independiente del tamaño visual
        if (this.body) {
            // Resetear body primero
            this.body.reset(x, y);
            
            // El hitbox debe ser 24x24px (tamaño fijo), independiente del tamaño visual
            // HITBOX_SIZE ya está definido arriba (línea 73)
            this.body.setSize(HITBOX_SIZE, HITBOX_SIZE);
            
            // El offset debe centrar el hitbox de 24x24px en el sprite visual (~28px)
            // IMPORTANTE: Con origen (0.5, 0.5):
            // - El sprite visual está centrado en (x, y)
            // - this.width/height = tamaño del frame trimmed ANTES del scale (~9x10px)
            // - this.displayWidth/displayHeight = tamaño visual DESPUÉS del scale (~28px)
            // - El body se posiciona desde la esquina superior izquierda del frame trimmed
            // - Para centrar un hitbox de 32x32px en un sprite visual de ~28px:
            //   Necesitamos calcular el offset desde el frame trimmed hasta el centro del hitbox
            //   offset = (frame trimmed size - hitbox size) / 2
            const trimmedWidth = this.width;
            const trimmedHeight = this.height;
            const offsetX = (trimmedWidth - HITBOX_SIZE) / 2;
            const offsetY = (trimmedHeight - HITBOX_SIZE) / 2 - 2; // Subir el hitbox 2px
            this.body.setOffset(offsetX, offsetY);
            
            this.body.allowGravity = false;
            this.body.immovable = true;
            this.body.updateFromGameObject();
            
            // Debug: mostrar hitbox visual
            this.showHitbox = this.scene.registry.get('showCoinHitbox') !== false; // Default: true
            if (this.showHitbox) {
                this.createHitboxVisual();
            }
            
            // Debug: verificar body size y posición
            console.log(`  🎯 Coin: trimmed=${trimmedWidth.toFixed(0)}x${trimmedHeight.toFixed(0)}, displaySize=${this.displayWidth.toFixed(0)}x${this.displayHeight.toFixed(0)}, body=${this.body.width}x${this.body.height}, offset=(${this.body.offset.x.toFixed(1)}, ${this.body.offset.y.toFixed(1)}), spritePos=(${this.x.toFixed(0)}, ${this.y.toFixed(0)}), bodyPos=(${this.body.x.toFixed(0)}, ${this.body.y.toFixed(0)})`);
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
        
        // Resetear scale
        this.setScale(1);
        
        // Desactivar
        this.setActive(false);
        this.setVisible(false);
    }
}

