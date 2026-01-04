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
import { ASSETS } from '../config/AssetKeys.js';

// 🔴 CONSTANTES DE DIMENSIONES
export const PLATFORM_HEIGHT = 32;
export const PLATFORM_WIDTH = 128; // Ancho ÚNICO para todas las plataformas

export class Platform extends Phaser.GameObjects.TileSprite {
    constructor(scene) {
        // Verificar que la escena existe
        if (!scene) {
            console.error('Platform.constructor: No scene provided');
            throw new Error('Platform requires a scene');
        }

        // TileSprite requiere width y height en el constructor
        // Usar textura por defecto, se cambiará en spawn()
        super(scene, 0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT, 'platform', 'plat-static-01.png');

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

        // Debug text reference (será asignado por PlatformSpawner)
        this.debugText = null;

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

        // 🎨 Usar texturas del atlas 'platform' con variación aleatoria
        const variant = Phaser.Math.Between(1, 2); // 01 o 02
        const frameName = isMoving
            ? `plat-move-0${variant}.png`
            : `plat-static-0${variant}.png`;

        // Verificar que el atlas existe
        if (!scene.textures.exists('platform')) {
            console.error('Platform.spawn: Atlas "platform" not loaded!');
            return;
        }

        // Cambiar la textura del TileSprite
        this.setTexture('platform', frameName);

        // Posición PRIMERO
        this.setPosition(x, y);

        // Configurar tamaño del TileSprite (esto repite el tile, no lo estira)
        this.setSize(width, PLATFORM_HEIGHT);

        // El tile se repite automáticamente para llenar el ancho de 128px

        // Asegurar que el body existe y configurarlo manualmente
        if (!this.body) {
            scene.physics.add.existing(this);
        }

        // TileSprite no tiene refreshBody(), configurar body manualmente
        if (this.body) {
            this.body.setSize(width, PLATFORM_HEIGHT);
            this.body.updateFromGameObject();
        }

        this.setDepth(100); // 🔴 ULTRA HIGH DEPTH FOR DEBUG

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
                this.body.friction.x = 0;  // Sin fricción (TileSprite no tiene setFrictionX)

                // Establecer velocidad inicial (siempre hacia la derecha primero)
                this.body.velocity.x = speed;

                // Asegurar que el body se actualice
                this.body.updateFromGameObject();
            } else {
                // Limpiar datos de movimiento si no es móvil
                this.setData('isMoving', false);
                this.setData('speed', 0);
                this.body.velocity.x = 0;
            }
        }

        // Activar
        this.setActive(true);
        this.setVisible(true);

        // 🔴 FORCE UPDATE LIST
        if (scene.sys) {
            scene.sys.updateList.add(this);
            scene.sys.displayList.add(this);
        }

        // FINAL VERIFICATION LOG
        console.log(`[Platform.spawn] ✅ Spawned at (${x}, ${y}) | Frame: ${frameName} | Visible: ${this.visible} | Active: ${this.active} | Body: ${!!this.body} | Depth: ${this.depth}`);

        // Double check texture
        if (this.texture.key === '__MISSING') {
            console.error('[Platform.spawn] ❌ TEXTURE MISSING even after setTexture!');
        }
    }

    /**
     * Método llamado cuando el objeto es devuelto al pool
     */
    despawn() {
        // Verificaciones de seguridad: asegurar que el objeto y su body existan
        if (!this || !this.body) {
            return;
        }

        console.log(`[Platform.despawn] 🗑️ Despawning Platform at (${this.x}, ${this.y})`);

        // Destruir debug text si existe
        if (this.debugText) {
            this.debugText.destroy();
            this.debugText = null;
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
        // TileSprite no tiene super.preUpdate() como Sprite
        // Actualizar animación del tile si es necesario

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
