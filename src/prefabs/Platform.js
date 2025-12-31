/**
 * Platform - Clase para plataformas con soporte para Object Pooling
 * 
 * REGLAS DE DIMENSIONES:
 * - Altura: 32px (fijo)
 * - Ancho: 128px (fijo) - Tamaño único para consistencia de hitbox
 * 
 * Extiende Phaser.Physics.Arcade.Sprite y implementa métodos spawn() y despawn()
 * para trabajar con PoolManager.
 */
import { WALLS } from '../config/GameConstants.js';

// 🔴 CONSTANTES DE DIMENSIONES
export const PLATFORM_HEIGHT = 32;
export const PLATFORM_WIDTH = 128; // Ancho ÚNICO para todas las plataformas

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
     * @param {number} width - Ancho de la plataforma (IGNORADO, siempre 128px)
     * @param {boolean} isMoving - Si la plataforma se mueve
     * @param {number} speed - Velocidad de movimiento (si es móvil)
     */
    spawn(x, y, width = PLATFORM_WIDTH, isMoving = false, speed = 100) {
        // 🔴 FORZAR ancho a 128px (ignorar parámetro width)
        width = PLATFORM_WIDTH;
        
        // Determinar textura
        const texture = isMoving ? 'platform_moving' : 'platform';
        this.setTexture(texture);
        
        // Posición y tamaño
        this.setPosition(x, y);
        this.setDisplaySize(width, PLATFORM_HEIGHT);
        this.refreshBody();
        this.setDepth(5);

        // Configurar física básica
        this.body.allowGravity = false;
        this.body.immovable = true;

        // Configurar plataforma móvil
        if (isMoving) {
            this.setData('isMoving', true);
            this.setData('speed', speed);
            
            // Configurar física para movimiento
            this.body.setBounce(1, 0);
            this.body.setCollideWorldBounds(true);
            this.setFrictionX(0);  // Sin fricción para movimiento continuo
            
            // Establecer velocidad inicial (siempre hacia la derecha primero)
            this.setVelocityX(speed);
            
            // Asegurar que el body se actualice
            this.body.updateFromGameObject();
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
            const wallWidth = WALLS.WIDTH;  // 32px
            const platformHalfWidth = PLATFORM_WIDTH / 2;  // 64px (128/2)
            
            // Límites: el CENTRO de la plataforma debe estar dentro de estos valores
            // Para que el borde izquierdo no entre en la pared: minX >= wallWidth + halfWidth
            // Para que el borde derecho no entre en la pared: maxX <= gameWidth - wallWidth - halfWidth
            const minPlatformX = wallWidth + platformHalfWidth;  // 32 + 64 = 96px
            const maxPlatformX = gameWidth - wallWidth - platformHalfWidth;  // 400 - 32 - 64 = 304px
            
            const speed = this.getData('speed') || 100;
            
            // Asegurar que siempre tenga velocidad
            const currentVelX = this.body.velocity.x;
            
            // Cambiar dirección en los límites
            if (this.x <= minPlatformX) {
                // Llegó al límite izquierdo, ir hacia la derecha
                this.setVelocityX(speed);
                // Asegurar que no se salga del límite
                this.x = Math.max(this.x, minPlatformX);
            } else if (this.x >= maxPlatformX) {
                // Llegó al límite derecho, ir hacia la izquierda
                this.setVelocityX(-speed);
                // Asegurar que no se salga del límite
                this.x = Math.min(this.x, maxPlatformX);
            } else if (currentVelX === 0) {
                // Si no tiene velocidad (por alguna razón), establecerla
                // Determinar dirección basada en posición inicial o aleatoria
                this.setVelocityX(speed);
            }
        }
    }
}
