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

// 🚀 OPTIMIZATION: Cache de frames de plataformas para evitar búsquedas repetidas
class PlatformTextureCache {
    constructor() {
        this.cache = new Map();
        this.initialized = false;
        this.atlasKey = 'floor'; // Nuevo atlas
    }

    initialize(scene) {
        if (this.initialized || !scene || !scene.textures.exists(this.atlasKey)) {
            return;
        }
        this.initialized = true;
    }
}

// Instancia global del cache
const platformTextureCache = new PlatformTextureCache();

/**
 * Inicializa el cache de texturas de plataformas
 * @param {Phaser.Scene} scene - La escena del juego
 */
export function initializePlatformTextureCache(scene) {
    platformTextureCache.initialize(scene);
}

export class Platform extends Phaser.GameObjects.TileSprite {
    constructor(scene) {
        // Verificar que la escena existe
        if (!scene) {
            console.error('Platform.constructor: No scene provided');
            throw new Error('Platform requires a scene');
        }

        // TileSprite requiere width y height en el constructor
        // Usar textura por defecto del atlas floor
        super(scene, 0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT, 'floor', 'beam.png');

        // Guardar referencia explícita a la escena (por si Phaser la pierde)
        this._sceneRef = scene;

        // Agregar a la escena y al physics world
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Joints (Visual attachments)
        this.leftJoint = null;
        this.rightJoint = null;

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
     * Crea o recupera los joints visuals.
     */
    ensureJoints() {
        const scene = this.getScene();
        if (!scene) return;

        if (!this.leftJoint) {
            this.leftJoint = scene.add.image(0, 0, 'floor', 'beam-joint-l-01.png');
            this.leftJoint.setOrigin(1, 0.5); // Pivot on right edge (to attach to left of platform)
            this.leftJoint.setDepth(101); // Same or slightly above platform
        }
        if (!this.rightJoint) {
            this.rightJoint = scene.add.image(0, 0, 'floor', 'beam-joint-r-01.png');
            this.rightJoint.setOrigin(0, 0.5); // Pivot on left edge (to attach to right of platform)
            this.rightJoint.setDepth(101);
        }
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
        // IMPORTANTE: Determinar tipo de body ANTES de crearlo
        // Móviles = dinámico (false), Estáticas = static (true)
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

        // 🚀 OPTIMIZATION: Inicializar cache si no está inicializado (lazy init)
        if (!platformTextureCache.initialized) {
            platformTextureCache.initialize(scene);
        }

        // 🎨 TEXTURE SELECTION LOGIC
        // 50% beam.png
        // 25% beam-deco (01-11)
        // 25% beam-broken (01-03)
        const r = Math.random();
        let frameName = 'beam.png';

        if (r < 0.5) {
            frameName = 'beam.png';
        } else if (r < 0.75) {
            const idx = Phaser.Math.Between(1, 11);
            frameName = `beam-deco-${idx.toString().padStart(2, '0')}.png`;
        } else {
            const idx = Phaser.Math.Between(1, 3);
            frameName = `beam-broken-${idx.toString().padStart(2, '0')}.png`;
        }

        // fallback if frame missing check
        if (!scene.textures.get('floor').has(frameName)) {
            console.warn(`Platform frame missing: ${frameName}, using beam.png`);
            frameName = 'beam.png';
        }

        this.setTexture('floor', frameName);

        // Posición PRIMERO
        this.setPosition(x, y);
        this.initialY = y;
        this.initialX = x;

        // Configurar tamaño del TileSprite (esto repite el tile, no lo estira)
        this.setSize(width, PLATFORM_HEIGHT);

        // --- JOINTS SETUP ---
        this.ensureJoints();

        // Randomize Left Joint
        if (this.leftJoint) {
            const lIdx = Phaser.Math.Between(1, 3);
            const lFrame = `beam-joint-l-${lIdx.toString().padStart(2, '0')}.png`;
            if (scene.textures.get('floor').has(lFrame)) {
                this.leftJoint.setTexture('floor', lFrame);
            }
            this.leftJoint.setActive(true).setVisible(true);
            this.leftJoint.setPosition(x - width / 2, y);
        }

        // Randomize Right Joint
        if (this.rightJoint) {
            const rIdx = Phaser.Math.Between(1, 3);
            const rFrame = `beam-joint-r-${rIdx.toString().padStart(2, '0')}.png`;
            if (scene.textures.get('floor').has(rFrame)) {
                this.rightJoint.setTexture('floor', rFrame);
            }
            this.rightJoint.setActive(true).setVisible(true);
            this.rightJoint.setPosition(x + width / 2, y);
        }


        // El tile se repite automáticamente para llenar el ancho de 128px

        // Asegurar que el body existe y configurarlo manualmente
        // Para plataformas móviles: usar body dinámico (false), para estáticas: static (true)
        const shouldBeStatic = !isMoving;

        if (!this.body) {
            // Crear body según tipo: static para estáticas, dinámico para móviles
            scene.physics.add.existing(this, shouldBeStatic);
        }
        // Nota: Si el body ya existe (del pool), lo reutilizamos y solo configuramos sus propiedades
        // No intentamos cambiar isStatic porque Phaser no lo permite y puede causar errores

        // TileSprite no tiene refreshBody(), configurar body manualmente
        if (this.body) {
            this.body.setSize(width, PLATFORM_HEIGHT);
            this.body.updateFromGameObject();
            this.body.setVelocity(0, 0);
            this.body.immovable = true;
            // body.moves se configura según si es móvil o no (ver más abajo)
        }

        this.setDepth(100);
        // Ensure joints have consistent depth
        if (this.leftJoint) this.leftJoint.setDepth(100);
        if (this.rightJoint) this.rightJoint.setDepth(100);

        // Configurar física básica
        if (this.body) {
            this.body.allowGravity = false;
            this.body.immovable = true; // No se mueve por colisiones, pero puede moverse por velocidad

            // Configurar plataforma móvil
            if (isMoving) {
                this.setData('isMoving', true);
                this.setData('speed', speed);
                this.setData('direction', 1); // 1 = derecha, -1 = izquierda

                // Configurar física para movimiento
                // NO usar setCollideWorldBounds - manejamos límites manualmente en preUpdate
                this.body.setCollideWorldBounds(false);
                this.body.friction.x = 0;
                this.body.moves = true;  // ✅ PERMITIR que el motor de física mueva la plataforma
                this.body.immovable = true; // ✅ No ser empujado por otros objetos
                this.body.allowGravity = false; // ✅ Asegurar sin gravedad

                // CRÍTICO: Bloquear movimiento vertical - solo movimiento horizontal
                this.body.velocity.y = 0; // Sin velocidad vertical
                this.body.setMaxVelocity(Infinity, 0); // Sin límite en X, bloqueado en Y

                // Establecer velocidad inicial (siempre hacia la derecha primero)
                this.body.velocity.x = speed;

                // Asegurar que el body se actualice
                this.body.updateFromGameObject();
            } else {
                // Limpiar datos de movimiento si no es móvil
                this.setData('isMoving', false);
                this.setData('speed', 0);
                this.body.velocity.x = 0;
                this.body.velocity.y = 0; // ✅ Asegurar sin velocidad vertical
                this.body.moves = false;  // ✅ Prevenir movimiento no deseado en plataformas estáticas
                this.body.setCollideWorldBounds(false); // No necesitamos bounds para estáticas
                this.body.setMaxVelocity(0, 0); // ✅ Bloquear todo movimiento en estáticas
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

        // Destruir debug text si existe
        if (this.debugText) {
            this.debugText.destroy();
            this.debugText = null;
        }

        // HIDE JOINTS
        if (this.leftJoint) this.leftJoint.setActive(false).setVisible(false);
        if (this.rightJoint) this.rightJoint.setActive(false).setVisible(false);

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

        // SYNC JOINTS POSITION
        if (this.leftJoint && this.leftJoint.active) {
            this.leftJoint.setPosition(this.x - PLATFORM_WIDTH / 2 + 2, this.y); // +2 pixel overlap fix
        }
        if (this.rightJoint && this.rightJoint.active) {
            this.rightJoint.setPosition(this.x + PLATFORM_WIDTH / 2 - 2, this.y); // -2 pixel overlap fix
        }

        // PROTECCIÓN UNIVERSAL: Restaurar posición Y si se desvía (para todas las plataformas)
        if (this.initialY !== undefined && Math.abs(this.y - this.initialY) > 1) {
            // Solo restaurar si la diferencia es significativa (>1px) para evitar micro-ajustes constantes
            this.y = this.initialY;
            this.body.y = this.initialY;
            this.body.velocity.y = 0; // Asegurar velocidad Y = 0
        }

        if (this.getData('isMoving') && this.active) {
            const scene = this.getScene();
            if (!scene || !this.body) return;

            // CRÍTICO: Forzar que Y se mantenga en su posición inicial
            // Esto previene cualquier movimiento vertical no deseado
            if (this.initialY !== undefined && this.y !== this.initialY) {
                this.y = this.initialY;
                this.body.y = this.initialY;
            }

            const gameWidth = scene.cameras.main.width;
            const wallWidth = WALLS.WIDTH;  // 32px
            const platformHalfWidth = PLATFORM_WIDTH / 2;  // 64px (128/2)

            // Límites: el CENTRO de la plataforma debe estar dentro de estos valores
            // Para que el borde izquierdo no entre en la pared: minX >= wallWidth + halfWidth
            // Para que el borde derecho no entre en la pared: maxX <= gameWidth - wallWidth - halfWidth
            const minPlatformX = wallWidth + platformHalfWidth;  // 32 + 64 = 96px
            const maxPlatformX = gameWidth - wallWidth - platformHalfWidth;  // 400 - 32 - 64 = 304px

            const speed = this.getData('speed') || 100;
            let direction = this.getData('direction') || 1; // 1 = derecha, -1 = izquierda

            // Verificar límites y cambiar dirección si es necesario
            if (this.x <= minPlatformX) {
                // Llegó al límite izquierdo, ir hacia la derecha
                direction = 1;
                this.x = minPlatformX; // Asegurar que no se salga
            } else if (this.x >= maxPlatformX) {
                // Llegó al límite derecho, ir hacia la izquierda
                direction = -1;
                this.x = maxPlatformX; // Asegurar que no se salga
            }

            // Guardar dirección actualizada
            this.setData('direction', direction);

            // Establecer velocidad según la dirección
            const targetVelocity = speed * direction;
            if (this.body.velocity.x !== targetVelocity) {
                this.body.velocity.x = targetVelocity;
            }

            // CRÍTICO: Asegurar que velocidad Y siempre sea 0
            if (this.body.velocity.y !== 0) {
                this.body.velocity.y = 0;
            }

            // Asegurar que el body se actualice
            this.body.updateFromGameObject();
        }
    }
}
