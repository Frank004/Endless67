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
export const PLATFORM_WIDTH = 128; // Ancho ÚNICO para todas las plataformas (4 tiles de 32px)
const STATIC_PLATFORM_FRAMES = [
    'platforms-static-01.png',
    'platforms-static-02.png',
    'platforms-static-03.png',
    'platforms-static-04.png'
];

// Cache platform frame references to avoid repeated texture lookups
class PlatformTextureCache {
    constructor() {
        this.cache = new Map();
        this.initialized = false;
    }

    /**
     * Initializes the cache with frame references
     * @param {Phaser.Scene} scene - The game scene
     */
    initialize(scene) {
        if (this.initialized || !scene || !scene.textures.exists(ASSETS.PLATFORM)) {
            return;
        }

        const texture = scene.textures.get(ASSETS.PLATFORM);
        if (!texture) {
            return;
        }

        // Cache references to most used frames
        const frameNames = [
            'platforms-static-01.png',
            'platforms-static-02.png',
            'platforms-static-03.png',
            'platforms-static-04.png',
            'platforms-static-05.png',
            'platforms-static-06.png',
            'plat-move-01.png',
            'plat-move-02.png',
            'plat-move-03.png',
            'plat-move-04.png'
        ];

        frameNames.forEach(frameName => {
            if (texture.has(frameName)) {
                const frame = texture.get(frameName);
                this.cache.set(frameName, frame);
            }
        });

        this.initialized = true;
    }

    /**
     * Gets a frame from cache or looks it up
     * @param {Phaser.Scene} scene - The game scene
     * @param {string} frameName - Frame name
     * @returns {Phaser.Textures.Frame|null} The frame or null
     */
    getFrame(scene, frameName) {
        // Return directly if cached
        if (this.cache.has(frameName)) {
            return this.cache.get(frameName);
        }

        // If not cached, lookup and cache
        if (scene && scene.textures.exists(ASSETS.PLATFORM)) {
            const texture = scene.textures.get(ASSETS.PLATFORM);
            if (texture && texture.has(frameName)) {
                const frame = texture.get(frameName);
                this.cache.set(frameName, frame);
                return frame;
            }
        }

        return null;
    }

    /**
     * Clears the cache
     */
    clear() {
        this.cache.clear();
        this.initialized = false;
    }
}

// Global cache instance
const platformTextureCache = new PlatformTextureCache();

/**
 * Initializes the platform texture cache
 * @param {Phaser.Scene} scene - The game scene
 */
export function initializePlatformTextureCache(scene) {
    platformTextureCache.initialize(scene);
}

export class Platform extends Phaser.GameObjects.TileSprite {
    constructor(scene) {
        // Verify scene exists
        if (!scene) {
            console.error('Platform.constructor: No scene provided');
            throw new Error('Platform requires a scene');
        }

        // TileSprite requires width and height in constructor
        // Use default texture, will change in spawn()
        super(scene, 0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT, ASSETS.PLATFORM, 'platforms-static-01.png');

        // Save explicit scene reference
        this._sceneRef = scene;

        // Add to scene and physics world
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Configure basic physics
        if (this.body) {
            this.body.allowGravity = false;
            this.body.immovable = true;
        }

        // Debug text reference (assigned by PlatformSpawner)
        this.debugText = null;

        // Initially inactive
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Helper to get scene safely
     */
    getScene() {
        const phaserScene = this.scene || this._sceneRef;
        if (phaserScene && phaserScene.sys) {
            return phaserScene;
        }
        return this._sceneRef;
    }

    /**
     * Called when spawned from pool
     * @param {number} x - X Position
     * @param {number} y - Y Position
     * @param {number} width - Platform Width (IGNORED, always 128px)
     * @param {boolean} isMoving - If platform moves
     * @param {number} speed - Movement speed
     */
    spawn(x, y, width = PLATFORM_WIDTH, isMoving = false, speed = 100) {
        // IMPORTANT: Determine body type BEFORE creation
        // Moving = dynamic (false), Static = static (true)
        const scene = this.getScene();

        // Safety checks
        if (!scene) {
            console.error('Platform.spawn: No scene available');
            return;
        }

        if (!scene.sys) {
            console.error('Platform.spawn: Scene.sys is not available');
            return;
        }

        // FORCE width to 128px
        width = PLATFORM_WIDTH;

        // Initialize cache if needed (lazy init)
        if (!platformTextureCache.initialized) {
            platformTextureCache.initialize(scene);
        }

        // Use atlas textures
        let frameName;

        if (isMoving) {
            const variant = Phaser.Math.Between(1, 4);
            frameName = `plat-move-0${variant}.png`;
        } else {
            frameName = Phaser.Utils.Array.GetRandom(STATIC_PLATFORM_FRAMES);
        }

        // Check cache before checking textures.exists()
        if (!platformTextureCache.initialized) {
            if (!scene.textures.exists(ASSETS.PLATFORM)) {
                console.error('Platform.spawn: Atlas "platform" not loaded!');
                return;
            }
        }

        // setTexture is faster when cache is initialized
        this.setTexture(ASSETS.PLATFORM, frameName);

        // Posición PRIMERO
        this.setPosition(x, y);
        this.initialY = y;
        this.initialX = x;

        // Configurar tamaño del TileSprite (esto repite el tile, no lo estira)
        this.setSize(width, PLATFORM_HEIGHT);

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

        this.setDepth(100); // 🔴 ULTRA HIGH DEPTH FOR DEBUG

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

        // FINAL VERIFICATION LOG (solo si debug está activo)
        if (scene?.registry?.get('showSlotLogs') === true) {
            console.log(`[Platform.spawn] ✅ Spawned at (${x}, ${y}) | Frame: ${frameName} | Visible: ${this.visible} | Active: ${this.active} | Body: ${!!this.body} | Depth: ${this.depth}`);
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

        // Log removido para reducir ruido en consola

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
