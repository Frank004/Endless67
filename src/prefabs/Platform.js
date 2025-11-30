/**
 * Platform - Clase para plataformas con soporte para Object Pooling
 * 
 * Extiende Phaser.Physics.Arcade.Sprite y implementa métodos spawn() y despawn()
 * para trabajar con PoolManager.
 */
import { WALLS } from '../config/GameConstants.js';

export class Platform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        // Usar textura por defecto, se cambiará en spawn()
        super(scene, 0, 0, 'platform');
        
        // Agregar a la escena y al physics world
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Configurar física básica (se ajustará en spawn())
        if (this.body) {
            this.body.allowGravity = false;
            this.body.immovable = true;
        }
        
        // Inicialmente inactivo
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Método llamado cuando el objeto es spawneado del pool
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} width - Ancho de la plataforma
     * @param {boolean} isMoving - Si la plataforma se mueve
     * @param {number} speed - Velocidad de movimiento (si es móvil)
     */
    spawn(x, y, width, isMoving = false, speed = 100) {
        // Determinar textura
        const texture = isMoving ? 'platform_moving' : 'platform';
        this.setTexture(texture);
        
        // Posición y tamaño
        this.setPosition(x, y);
        this.setDisplaySize(width, 18);
        this.refreshBody();
        this.setDepth(5);

        // Configurar física básica
        this.body.allowGravity = false;
        this.body.immovable = true;

        // Configurar plataforma móvil
        if (isMoving) {
            this.setData('isMoving', true);
            this.setData('speed', speed);
            this.setVelocityX(speed);
            this.setFrictionX(1);
            this.body.setBounce(1, 0);
            this.body.setCollideWorldBounds(true);
        } else {
            // Limpiar datos de movimiento si no es móvil
            this.setData('isMoving', false);
            this.setData('speed', 0);
            this.setVelocityX(0);
        }

        // Activar
        this.setActive(true);
        this.setVisible(true);
    }

    /**
     * Método llamado cuando el objeto es devuelto al pool
     */
    despawn() {
        // Limpiar estado
        this.setVelocityX(0);
        this.setData('isMoving', false);
        this.setData('speed', 0);
        
        // Remover del grupo legacy si existe
        if (this.scene && this.scene.platforms) {
            this.scene.platforms.remove(this);
        }
        
        // Desactivar
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Update para plataformas móviles
     * Se llama automáticamente por Phaser si el objeto está activo
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        if (this.getData('isMoving') && this.active) {
            const gameWidth = this.scene.cameras.main.width;
            const wallWidth = WALLS.WIDTH;
            const minPlatformX = wallWidth + WALLS.PLATFORM_MARGIN;
            const maxPlatformX = gameWidth - wallWidth - WALLS.PLATFORM_MARGIN;
            const speed = this.getData('speed') || 100;

            // Cambiar dirección en los límites
            if (this.x < minPlatformX) {
                this.setVelocityX(speed);
            } else if (this.x > maxPlatformX) {
                this.setVelocityX(-speed);
            }
        }
    }
}

