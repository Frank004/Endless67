import PoolManager, { poolRegistry } from '../../src/Core/PoolManager.js';

// Mock class para testing
class MockPooledObject {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.visible = false;
        this.x = 0;
        this.y = 0;
        this.spawnCalled = false;
        this.despawnCalled = false;
    }

    setActive(value) {
        this.active = value;
        return this;
    }

    setVisible(value) {
        this.visible = value;
        return this;
    }

    spawn(x, y) {
        this.spawnCalled = true;
        this.x = x;
        this.y = y;
    }

    despawn() {
        this.despawnCalled = true;
        this.x = 0;
        this.y = 0;
    }

    destroy() {
        this.active = false;
        this.visible = false;
    }
}

describe('PoolManager', () => {
    let pool;
    let mockScene;

    beforeEach(() => {
        mockScene = { key: 'test' };
        pool = new PoolManager(mockScene, 'testPool', MockPooledObject, 5, 3);
    });

    afterEach(() => {
        if (pool) {
            pool.destroy();
        }
    });

    describe('Initialization', () => {
        test('should create pool with initial size', () => {
            expect(pool.getTotalCount()).toBe(5);
            expect(pool.getAvailableCount()).toBe(5);
            expect(pool.getActiveCount()).toBe(0);
        });

        test('should set correct properties', () => {
            expect(pool.name).toBe('testPool');
            expect(pool.scene).toBe(mockScene);
            expect(pool.growSize).toBe(3);
        });

        test('should initialize statistics', () => {
            const stats = pool.getStats();
            expect(stats.created).toBe(5);
            expect(stats.spawned).toBe(0);
            expect(stats.despawned).toBe(0);
            expect(stats.maxActive).toBe(0);
        });
    });

    describe('Spawning', () => {
        test('should spawn object from pool', () => {
            const obj = pool.spawn(100, 200);

            expect(obj).toBeDefined();
            expect(obj.active).toBe(true);
            expect(obj.visible).toBe(true);
            expect(pool.getActiveCount()).toBe(1);
            expect(pool.getAvailableCount()).toBe(4);
        });

        test('should call spawn method if it exists', () => {
            const obj = pool.spawn(100, 200);

            expect(obj.spawnCalled).toBe(true);
            expect(obj.x).toBe(100);
            expect(obj.y).toBe(200);
        });

        test('should grow pool when empty', () => {
            // Spawn todos los objetos iniciales
            for (let i = 0; i < 5; i++) {
                pool.spawn();
            }

            expect(pool.getAvailableCount()).toBe(0);
            expect(pool.getTotalCount()).toBe(5);

            // Spawn uno más debería hacer crecer el pool
            pool.spawn();

            expect(pool.getTotalCount()).toBe(8); // 5 + 3 (growSize)
            expect(pool.getActiveCount()).toBe(6);
        });

        test('should update statistics on spawn', () => {
            pool.spawn();
            pool.spawn();

            const stats = pool.getStats();
            expect(stats.spawned).toBe(2);
            expect(stats.maxActive).toBe(2);
        });
    });

    describe('Despawning', () => {
        test('should despawn object back to pool', () => {
            const obj = pool.spawn();
            pool.despawn(obj);

            expect(obj.active).toBe(false);
            expect(obj.visible).toBe(false);
            expect(pool.getActiveCount()).toBe(0);
            expect(pool.getAvailableCount()).toBe(5);
        });

        test('should call despawn method if it exists', () => {
            const obj = pool.spawn(100, 200);
            pool.despawn(obj);

            expect(obj.despawnCalled).toBe(true);
            expect(obj.x).toBe(0);
            expect(obj.y).toBe(0);
        });

        test('should handle despawning null object', () => {
            expect(() => pool.despawn(null)).not.toThrow();
        });

        test('should update statistics on despawn', () => {
            const obj = pool.spawn();
            pool.despawn(obj);

            const stats = pool.getStats();
            expect(stats.despawned).toBe(1);
        });

        test('should remove object from active list', () => {
            const obj1 = pool.spawn();
            const obj2 = pool.spawn();
            const obj3 = pool.spawn();

            pool.despawn(obj2);

            expect(pool.getActiveCount()).toBe(2);
            expect(pool.getActive()).toContain(obj1);
            expect(pool.getActive()).not.toContain(obj2);
            expect(pool.getActive()).toContain(obj3);
        });
    });

    describe('Despawn All', () => {
        test('should despawn all active objects', () => {
            pool.spawn();
            pool.spawn();
            pool.spawn();

            expect(pool.getActiveCount()).toBe(3);

            pool.despawnAll();

            expect(pool.getActiveCount()).toBe(0);
            expect(pool.getAvailableCount()).toBe(5);
        });

        test('should work with empty active list', () => {
            expect(() => pool.despawnAll()).not.toThrow();
        });
    });

    describe('Getters', () => {
        test('should get active objects', () => {
            const obj1 = pool.spawn();
            const obj2 = pool.spawn();

            const active = pool.getActive();

            expect(active).toHaveLength(2);
            expect(active).toContain(obj1);
            expect(active).toContain(obj2);
        });

        test('should get correct counts', () => {
            pool.spawn();
            pool.spawn();

            expect(pool.getActiveCount()).toBe(2);
            expect(pool.getAvailableCount()).toBe(3);
            expect(pool.getTotalCount()).toBe(5);
        });

        test('should get complete stats', () => {
            pool.spawn();
            const obj = pool.spawn();
            pool.despawn(obj);

            const stats = pool.getStats();

            expect(stats.created).toBe(5);
            expect(stats.spawned).toBe(2);
            expect(stats.despawned).toBe(1);
            expect(stats.maxActive).toBe(2);
            expect(stats.active).toBe(1);
            expect(stats.available).toBe(4);
            expect(stats.total).toBe(5);
        });
    });

    describe('Destroy', () => {
        test('should destroy all objects', () => {
            const obj1 = pool.spawn();
            const obj2 = pool.spawn();

            pool.destroy();

            expect(pool.getActiveCount()).toBe(0);
            expect(pool.getAvailableCount()).toBe(0);
            expect(pool.getTotalCount()).toBe(0);
        });
    });
});

describe('PoolManagerRegistry', () => {
    let pool1, pool2;
    let mockScene;

    beforeEach(() => {
        mockScene = { key: 'test' };
        pool1 = new PoolManager(mockScene, 'pool1', MockPooledObject, 5);
        pool2 = new PoolManager(mockScene, 'pool2', MockPooledObject, 10);

        poolRegistry.register('pool1', pool1);
        poolRegistry.register('pool2', pool2);
    });

    afterEach(() => {
        poolRegistry.destroyAll();
    });

    test('should be a singleton', () => {
        expect(poolRegistry).toBeDefined();
    });

    test('should register pools', () => {
        expect(poolRegistry.has('pool1')).toBe(true);
        expect(poolRegistry.has('pool2')).toBe(true);
    });

    test('should get registered pool', () => {
        const retrieved = poolRegistry.get('pool1');
        expect(retrieved).toBe(pool1);
    });

    test('should get all stats', () => {
        pool1.spawn();
        pool2.spawn();
        pool2.spawn();

        const stats = poolRegistry.getAllStats();

        expect(stats.pool1.active).toBe(1);
        expect(stats.pool2.active).toBe(2);
    });

    test('should unregister pool', () => {
        poolRegistry.unregister('pool1');

        expect(poolRegistry.has('pool1')).toBe(false);
        expect(poolRegistry.has('pool2')).toBe(true);
    });

    test('should destroy all pools', () => {
        poolRegistry.destroyAll();

        expect(poolRegistry.has('pool1')).toBe(false);
        expect(poolRegistry.has('pool2')).toBe(false);
    });
});
