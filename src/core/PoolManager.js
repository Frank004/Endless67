/**
 * PoolManager - Generic object pooling system
 * 
 * Gestiona pools de objetos reutilizables para reducir Garbage Collection.
 * Soporta cualquier tipo de objeto que tenga métodos setActive() y setVisible().
 * 
 * Uso:
 *   const pool = new PoolManager(scene, 'platforms', PlatformClass, 20);
 *   const platform = pool.spawn(x, y, texture);
 *   pool.despawn(platform);
 */
export class PoolManager {
    /**
     * @param {Phaser.Scene} scene - La escena de Phaser
     * @param {string} name - Nombre del pool (para debugging)
     * @param {Function} classType - Clase del objeto a poolear
     * @param {number} initialSize - Tamaño inicial del pool
     * @param {number} growSize - Cuántos objetos crear cuando el pool se vacía
     */
    constructor(scene, name, classType, initialSize = 10, growSize = 5, options = {}) {
        this.scene = scene;
        this.name = name;
        this.classType = classType;
        this.growSize = growSize;
        this.maxSize = options.maxSize || null; // límite opcional para evitar crecimiento infinito

        // Pool de objetos disponibles
        this.pool = [];

        // Objetos actualmente en uso
        this.active = [];

        // Estadísticas
        this.stats = {
            created: 0,
            spawned: 0,
            despawned: 0,
            maxActive: 0,
        };

        // Crear objetos iniciales
        this.grow(initialSize);
    }

    /**
     * Crear nuevos objetos y agregarlos al pool
     */
    grow(count) {
        for (let i = 0; i < count; i++) {
            const obj = this.createObject();
            this.pool.push(obj);
            this.stats.created++;
        }
    }

    /**
     * Crear un nuevo objeto del tipo especificado
     * Override este método si necesitas lógica de creación personalizada
     */
    createObject() {
        const obj = new this.classType(this.scene);
        obj.setActive(false);
        obj.setVisible(false);
        return obj;
    }

    /**
     * Obtener un objeto del pool (spawn)
     * Si el pool está vacío, crea más objetos automáticamente
     */
    spawn(...args) {
        let obj;

        // Si no hay objetos disponibles, crear más (respetando maxSize si existe)
        if (this.pool.length === 0) {
            const canGrow = this.maxSize === null || (this.getTotalCount() + this.growSize) <= this.maxSize;
            if (canGrow) {
                this.grow(this.growSize);
            } else if (this.getTotalCount() < this.maxSize) {
                // Crecer solo hasta el maxSize
                this.grow(this.maxSize - this.getTotalCount());
            } else {
                console.warn(`Pool ${this.name}: sin objetos disponibles y maxSize alcanzado`);
                return null;
            }
        }

        // Obtener objeto del pool
        obj = this.pool.pop();
        if (!obj) {
            console.warn(`Pool ${this.name}: no se pudo obtener objeto del pool`);
            return null;
        }

        // Activate object first
        obj.setActive(true);
        obj.setVisible(true);
        // Call custom spawn logic if defined
        if (obj.spawn && typeof obj.spawn === 'function') {
            obj.spawn(...args);
        }

        // Agregar a lista de activos
        this.active.push(obj);

        // Actualizar estadísticas
        this.stats.spawned++;
        this.stats.maxActive = Math.max(this.stats.maxActive, this.active.length);

        return obj;
    }

    /**
     * Devolver un objeto al pool (despawn)
     */
    despawn(obj) {
        if (!obj) return;

        // Remover de lista de activos
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
        }

        // Llamar método de limpieza ANTES de desactivar
        // Esto asegura que el objeto y su body todavía existan cuando se limpia el estado
        if (obj.despawn && typeof obj.despawn === 'function') {
            try {
            obj.despawn();
            } catch (e) {
                console.warn('PoolManager.despawn: Error al llamar obj.despawn():', e);
            }
        }

        // Desactivar objeto (después de limpiar estado)
        try {
            if (typeof obj.setActive === 'function') {
                obj.setActive(false);
            }
            if (typeof obj.setVisible === 'function') {
                obj.setVisible(false);
            }
        } catch (e) {
            console.warn('PoolManager.despawn: Error al desactivar objeto:', e);
        }

        // Devolver al pool
        this.pool.push(obj);

        // Actualizar estadísticas
        this.stats.despawned++;
    }

    /**
     * Despawn todos los objetos activos
     */
    despawnAll() {
        // Crear copia del array porque despawn() modifica this.active
        const activeObjects = [...this.active];
        activeObjects.forEach(obj => this.despawn(obj));
    }

    /**
     * Obtener todos los objetos activos
     */
    getActive() {
        return this.active;
    }

    /**
     * Obtener cantidad de objetos activos
     */
    getActiveCount() {
        return this.active.length;
    }

    /**
     * Obtener cantidad de objetos disponibles en el pool
     */
    getAvailableCount() {
        return this.pool.length;
    }

    /**
     * Obtener cantidad total de objetos (activos + disponibles)
     */
    getTotalCount() {
        return this.active.length + this.pool.length;
    }

    /**
     * Obtener estadísticas del pool
     */
    getStats() {
        return {
            ...this.stats,
            active: this.active.length,
            available: this.pool.length,
            total: this.getTotalCount(),
            maxSize: this.maxSize,
        };
    }

    /**
     * Podar el pool para reducir memoria, dejando 'minAvailable' objetos en standby.
     * Útil tras un cleanup masivo.
     */
    trim(minAvailable = 0) {
        while (this.pool.length > minAvailable) {
            const obj = this.pool.pop();
            if (obj?.destroy) obj.destroy();
        }
    }

    /**
     * Limpiar el pool completamente
     */
    destroy() {
        // Destruir objetos activos
        this.active.forEach(obj => {
            if (obj.destroy && typeof obj.destroy === 'function') {
                obj.destroy();
            }
        });

        // Destruir objetos en pool
        this.pool.forEach(obj => {
            if (obj.destroy && typeof obj.destroy === 'function') {
                obj.destroy();
            }
        });

        this.active = [];
        this.pool = [];
    }
}

/**
 * PoolManagerRegistry - Registro global de pools
 * 
 * Singleton que mantiene referencia a todos los pools del juego.
 * Útil para debugging y estadísticas globales.
 */
class PoolManagerRegistry {
    static instance = null;

    constructor() {
        if (PoolManagerRegistry.instance) {
            return PoolManagerRegistry.instance;
        }

        this.pools = new Map();
        PoolManagerRegistry.instance = this;
    }

    /**
     * Registrar un pool
     */
    register(name, pool) {
        this.pools.set(name, pool);
    }

    /**
     * Obtener un pool por nombre
     */
    get(name) {
        return this.pools.get(name);
    }

    /**
     * Verificar si existe un pool
     */
    has(name) {
        return this.pools.has(name);
    }

    /**
     * Eliminar un pool del registro
     */
    unregister(name) {
        const pool = this.pools.get(name);
        if (pool) {
            pool.destroy();
            this.pools.delete(name);
        }
    }

    /**
     * Obtener estadísticas de todos los pools
     */
    getAllStats() {
        const stats = {};
        this.pools.forEach((pool, name) => {
            stats[name] = pool.getStats();
        });
        return stats;
    }

    /**
     * Limpiar todos los pools
     */
    destroyAll() {
        this.pools.forEach(pool => pool.destroy());
        this.pools.clear();
    }
}

// Export singleton instance
export const poolRegistry = new PoolManagerRegistry();

export default PoolManager;
