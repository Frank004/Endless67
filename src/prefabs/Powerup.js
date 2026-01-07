/**
 * Powerup.js
 * 
 * Prefab para powerups del juego (basketball).
 * Maneja su propia animación, escala y lógica de spawn/despawn.
 * 
 * Principios:
 * - Single Responsibility: Solo lógica del powerup
 * - Encapsulation: Maneja su propia animación y visual
 */

export const POWERUP_BASE_SIZE = 32;  // Canvas original del sprite
export const POWERUP_HITBOX_SIZE = 20;

export class Powerup extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        // Determinar qué textura usar: sprite sheet o fallback
        const hasSpriteSheet = scene.textures.exists('basketball');
        const textureKey = hasSpriteSheet ? 'basketball' : 'powerup_ball';
        const frameKey = hasSpriteSheet ? 'basketball 1.png' : null;
        
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
     * Spawn del powerup (llamado desde PoolManager o directamente)
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     */
    spawn(x, y) {
        if (!this.scene || !this.scene.physics) {
            console.error('❌ Powerup.spawn: scene o physics indefinido');
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
        // sourceSize es 32x32px según basketball.json (igual que el player)
        // frame trimmed es ~17x17px o ~21x17px (el sprite real recortado)
        const SOURCE_SIZE = POWERUP_BASE_SIZE; // Tamaño original del canvas (sourceSize en JSON)
        
        // Configurar origen al centro (0.5, 0.5) para que el sprite se centre correctamente
        this.setOrigin(0.5, 0.5);
        
        // Obtener el tamaño del frame trimmed
        const frame = this.frame;
        const trimmedWidth = frame ? frame.width : 17;  // ~17px según JSON
        const trimmedHeight = frame ? frame.height : 17; // ~17px según JSON
        
        // Calcular el scale para que el sprite visual sea ~32px
        // Usamos un scale uniforme basado en el promedio para mantener proporciones
        const VISUAL_SIZE = POWERUP_BASE_SIZE; // Tamaño visual deseado del powerup
        const HITBOX_SIZE = POWERUP_HITBOX_SIZE; // Tamaño del hitbox (igual que coin)
        const avgTrimmedSize = (trimmedWidth + trimmedHeight) / 2;
        const scale = VISUAL_SIZE / avgTrimmedSize; // Escalar para que el promedio sea ~32px
        
        // Resetear scale primero
        this.setScale(1);
        // Aplicar scale uniforme para mantener proporciones
        this.setScale(scale);
        
        // Verificar que el displaySize sea correcto
        const logPowerups = this.scene?.registry?.get('logPowerups') === true;
        if (logPowerups) {
            console.log(`  ⚡ Powerup spawn: trimmed=${trimmedWidth}x${trimmedHeight}, visualSize=${VISUAL_SIZE}px, scale=${scale.toFixed(2)}, displaySize=${this.displayWidth.toFixed(0)}x${this.displayHeight.toFixed(0)}`);
        }
        
        // Configurar física para colisiones
        // IMPORTANTE: El hitbox debe ser 10x10px (tamaño fijo), independiente del tamaño visual
        if (this.body) {
            // Resetear body primero
            this.body.reset(x, y);
            
            // El hitbox debe ser 10x10px (tamaño fijo), independiente del tamaño visual
            this.body.setSize(HITBOX_SIZE, HITBOX_SIZE);
            
            // El offset debe centrar el hitbox en el sprite visual
            // IMPORTANTE: Con origen (0.5, 0.5):
            // - El sprite visual está centrado en (x, y)
            // - this.width/height = tamaño del frame trimmed ANTES del scale
            // - this.displayWidth/displayHeight = tamaño visual DESPUÉS del scale
            // - El body se posiciona desde la esquina superior izquierda del frame trimmed
            // - Para centrar un hitbox de 10x10px en un sprite visual de ~32px:
            //   offset = (frame trimmed size - hitbox size) / 2
            const trimmedWidth = this.width;
            const trimmedHeight = this.height;
            const offsetX = (trimmedWidth - HITBOX_SIZE) / 2;
            const offsetY = (trimmedHeight - HITBOX_SIZE) / 2 - 2; // Subir el hitbox 2px
            this.body.setOffset(offsetX, offsetY);
            
            this.body.allowGravity = false;
            this.body.immovable = true;
            this.body.checkCollision.none = false;
            this.body.updateFromGameObject();
        }
        
        // Activar
        this.setActive(true);
        this.setVisible(true);
        
        // Reproducir animación si está disponible
        if (this.scene.anims.exists('basketball_spin')) {
            this.anims.play('basketball_spin', true);
        }
    }

    /**
     * Despawn del powerup (llamado cuando se devuelve al pool)
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

        // Deshabilitar body para evitar overlaps múltiples
        if (this.body) {
            this.body.setEnable(false);
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
        this.hitboxGraphics.setDepth(1001); // Por encima del powerup (depth 10)
        
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
        
        // Dibujar el hitbox del body de física en color naranja (diferente de coins)
        const body = this.body;
        const x = body.x;
        const y = body.y;
        const width = body.width;
        const height = body.height;
        
        // Color naranja para powerups
        this.hitboxGraphics.lineStyle(2, 0xFF6600, 1); // Naranja, 2px de grosor
        this.hitboxGraphics.strokeRect(x, y, width, height);
        
        // Relleno semi-transparente
        this.hitboxGraphics.fillStyle(0xFF6600, 0.2); // Naranja con 20% de opacidad
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
}
