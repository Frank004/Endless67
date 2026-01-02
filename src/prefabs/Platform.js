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
        // Verificar que la escena existe
        if (!scene) {
            console.error('Platform.constructor: No scene provided');
            throw new Error('Platform requires a scene');
        }
        
        // Usar textura por defecto, se cambiará en spawn()
        super(scene, 0, 0, 'platform');
        
        // Guardar referencia explícita a la escena (por si Phaser la pierde)
        this._sceneRef = scene;
        
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
     * Método helper para obtener la escena de forma segura
     * Si Phaser perdió la referencia, usar la guardada
     */
    getScene() {
        // Intentar obtener la escena de Phaser primero (this.scene es la propiedad de Phaser)
        const phaserScene = this.scene || this._sceneRef;
        if (phaserScene && phaserScene.sys) {
            return phaserScene;
        }
        // Fallback a la referencia guardada
        return this._sceneRef;
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
        // Obtener escena de forma segura
        const scene = this.getScene();
        
        // Verificaciones de seguridad: asegurar que la escena existe y está activa
        if (!scene) {
            console.error('Platform.spawn: No scene available');
            return;
        }
        
        // Verificar que la escena tiene sys (necesario para setTexture)
        if (!scene.sys) {
            console.error('Platform.spawn: Scene.sys is not available');
            return;
        }
        
        // 🔴 FORZAR ancho a 128px (ignorar parámetro width)
        width = PLATFORM_WIDTH;
        
        // Determinar textura
        const texture = isMoving ? 'platform_moving' : 'platform';
        
        // Verificar que la textura existe antes de usarla
        try {
            if (scene.textures && scene.textures.exists(texture)) {
                this.setTexture(texture);
            } else {
                console.warn(`Platform.spawn: Texture '${texture}' does not exist, using default 'platform'`);
                if (scene.textures && scene.textures.exists('platform')) {
                    this.setTexture('platform');
                } else {
                    console.error('Platform.spawn: Default texture "platform" does not exist');
                    return;
                }
            }
        } catch (e) {
            console.error('Platform.spawn: Error setting texture:', e);
            // Si falla, intentar con la textura por defecto
            if (scene.textures && scene.textures.exists('platform')) {
                try {
                    this.setTexture('platform');
                } catch (e2) {
                    console.error('Platform.spawn: Could not set default texture:', e2);
                    return;
                }
            } else {
                console.error('Platform.spawn: Cannot recover from texture error');
                return;
            }
        }
        
        // Posición y tamaño
        this.setPosition(x, y);
        this.setDisplaySize(width, PLATFORM_HEIGHT);
        
        // Asegurar que el body existe antes de refreshBody
        if (!this.body) {
            scene.physics.add.existing(this);
        }
        
        if (this.body) {
            this.refreshBody();
        }
        
        this.setDepth(5);

        // Configurar física básica
        if (this.body) {
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
                if (typeof this.setVelocityX === 'function') {
                    this.setVelocityX(speed);
                }
                
                // Asegurar que el body se actualice
                this.body.updateFromGameObject();
            } else {
                // Limpiar datos de movimiento si no es móvil
                this.setData('isMoving', false);
                this.setData('speed', 0);
                if (typeof this.setVelocityX === 'function') {
                    this.setVelocityX(0);
                }
            }
        }

        // Activar
        this.setActive(true);
        this.setVisible(true);
    }

    /**
     * Método llamado cuando el objeto es devuelto al pool
     */
    despawn() {
        // Verificaciones de seguridad: asegurar que el objeto y su body existan
        if (!this || !this.body) {
            return;
        }
        
        // Limpiar estado de movimiento
        try {
            if (this.body && typeof this.setVelocityX === 'function') {
                this.setVelocityX(0);
            }
        } catch (e) {
            // Si falla, el objeto ya está destruido, ignorar
            console.warn('Platform.despawn: Error al limpiar velocidad:', e);
        }
        
        // Limpiar datos
        try {
            if (typeof this.setData === 'function') {
                this.setData('isMoving', false);
                this.setData('speed', 0);
            }
        } catch (e) {
            // Ignorar si el objeto ya está destruido
        }
        
        // Remover del grupo legacy si existe
        try {
            const scene = this.getScene();
            if (scene && scene.platforms) {
                scene.platforms.remove(this);
            }
        } catch (e) {
            // Ignorar si ya fue removido
        }
        
        // Desactivar (esto ya se hace en PoolManager, pero por seguridad)
        try {
            if (typeof this.setActive === 'function') {
                this.setActive(false);
            }
            if (typeof this.setVisible === 'function') {
                this.setVisible(false);
            }
        } catch (e) {
            // Ignorar si el objeto ya está destruido
        }
    }

    /**
     * Update para plataformas móviles
     * Se llama automáticamente por Phaser si el objeto está activo
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Verificaciones de seguridad antes de actualizar
        if (!this.active || !this.body) {
            return;
        }
        
        const scene = this.getScene();
        if (!scene) {
            return;
        }
        
        if (this.getData('isMoving') && this.active) {
            const scene = this.getScene();
            if (!scene) return;
            
            const gameWidth = scene.cameras.main.width;
            const wallWidth = WALLS.WIDTH;  // 32px
            const platformHalfWidth = PLATFORM_WIDTH / 2;  // 64px (128/2)
            
            // Límites: el CENTRO de la plataforma debe estar dentro de estos valores
            // Para que el borde izquierdo no entre en la pared: minX >= wallWidth + halfWidth
            // Para que el borde derecho no entre en la pared: maxX <= gameWidth - wallWidth - halfWidth
            const minPlatformX = wallWidth + platformHalfWidth;  // 32 + 64 = 96px
            const maxPlatformX = gameWidth - wallWidth - platformHalfWidth;  // 400 - 32 - 64 = 304px
            
            const speed = this.getData('speed') || 100;
            
            // Asegurar que siempre tenga velocidad
            const currentVelX = this.body.velocity ? this.body.velocity.x : 0;
            
            // Cambiar dirección en los límites
            if (this.x <= minPlatformX) {
                // Llegó al límite izquierdo, ir hacia la derecha
                if (typeof this.setVelocityX === 'function') {
                    this.setVelocityX(speed);
                }
                // Asegurar que no se salga del límite
                this.x = Math.max(this.x, minPlatformX);
            } else if (this.x >= maxPlatformX) {
                // Llegó al límite derecho, ir hacia la izquierda
                if (typeof this.setVelocityX === 'function') {
                    this.setVelocityX(-speed);
                }
                // Asegurar que no se salga del límite
                this.x = Math.min(this.x, maxPlatformX);
            } else if (currentVelX === 0) {
                // Si no tiene velocidad (por alguna razón), establecerla
                // Determinar dirección basada en posición inicial o aleatoria
                if (typeof this.setVelocityX === 'function') {
                    this.setVelocityX(speed);
                }
            }
        }
    }
}
