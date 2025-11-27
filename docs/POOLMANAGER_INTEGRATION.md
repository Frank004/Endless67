# Integración del PoolManager - Guía de Uso

## Ejemplo 1: Pooling de Plataformas

### Antes (Sin Pool)
```javascript
// En Game.js - create()
this.platforms = this.physics.add.group({ 
    allowGravity: false, 
    immovable: true 
});

// En LevelManager.js - spawnPlatform()
let p = scene.platforms.create(x, y, texture);
p.setDisplaySize(width, 20);
// ... configuración adicional

// Destrucción
platform.destroy(); // Crea garbage
```

### Después (Con Pool)
```javascript
// En Game.js - create()
import PoolManager, { poolRegistry } from '../core/PoolManager.js';
import { POOL } from '../config/GameConstants.js';

// Crear pool de plataformas
this.platformPool = new PoolManager(
    this,
    'platforms',
    Phaser.Physics.Arcade.Sprite,
    POOL.INITIAL_SIZE.PLATFORMS,
    POOL.GROW_SIZE
);

// Registrar en el registry global (opcional, para debugging)
poolRegistry.register('platforms', this.platformPool);

// En LevelManager.js - spawnPlatform()
let p = this.platformPool.spawn();
p.setTexture(texture);
p.setPosition(x, y);
p.setDisplaySize(width, 20);
p.body.immovable = true;
p.body.allowGravity = false;
// ... configuración adicional

// Despawn en lugar de destroy
this.platformPool.despawn(platform); // Reutiliza el objeto
```

## Ejemplo 2: Plataforma Personalizada con Pool

### Crear una clase Platform que soporte pooling

```javascript
// src/prefabs/Platform.js
export class Platform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        super(scene, 0, 0, 'platform');
        
        // Configuración base
        this.body.immovable = true;
        this.body.allowGravity = false;
        
        // Propiedades personalizadas
        this.isMoving = false;
        this.moveSpeed = 0;
        this.moveDirection = 1;
        this.moveRange = 0;
        this.startX = 0;
    }

    /**
     * Método llamado cuando el objeto es spawneado del pool
     */
    spawn(x, y, width, isMoving = false, moveSpeed = 50) {
        // Posición y tamaño
        this.setPosition(x, y);
        this.setDisplaySize(width, 20);
        this.refreshBody();
        
        // Configurar movimiento
        this.isMoving = isMoving;
        this.moveSpeed = moveSpeed;
        this.startX = x;
        this.moveRange = 100;
        this.moveDirection = 1;
        
        // Activar
        this.setActive(true);
        this.setVisible(true);
    }

    /**
     * Método llamado cuando el objeto es devuelto al pool
     */
    despawn() {
        // Limpiar estado
        this.isMoving = false;
        this.moveSpeed = 0;
        this.setVelocityX(0);
    }

    /**
     * Update personalizado para plataformas móviles
     */
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        if (this.isMoving && this.active) {
            // Mover plataforma
            this.x += this.moveSpeed * this.moveDirection * (delta / 1000);
            
            // Cambiar dirección en los límites
            if (this.x > this.startX + this.moveRange) {
                this.moveDirection = -1;
            } else if (this.x < this.startX - this.moveRange) {
                this.moveDirection = 1;
            }
            
            this.body.updateFromGameObject();
        }
    }
}
```

### Usar la Platform personalizada con Pool

```javascript
// En Game.js - create()
import { Platform } from '../prefabs/Platform.js';

this.platformPool = new PoolManager(
    this,
    'platforms',
    Platform,
    20,
    5
);

// Agregar al physics world
this.platformPool.getActive().forEach(platform => {
    this.physics.add.existing(platform);
});

// En LevelManager.js - spawnPlatform()
const platform = this.platformPool.spawn(x, y, width, isMoving, moveSpeed);

// Agregar al physics world si no está
if (!platform.body) {
    this.scene.physics.add.existing(platform);
}

// Colisión con player
this.scene.physics.add.collider(this.scene.player, platform);
```

## Ejemplo 3: Pooling de Enemigos

```javascript
// src/prefabs/Enemy.js
export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        super(scene, 0, 0, 'enemy');
        this.health = 1;
        this.speed = 50;
    }

    spawn(x, y, type = 'patrol') {
        this.setPosition(x, y);
        this.health = 1;
        this.type = type;
        
        if (type === 'patrol') {
            this.speed = 50;
        } else if (type === 'fast') {
            this.speed = 100;
        }
        
        this.setActive(true);
        this.setVisible(true);
    }

    despawn() {
        this.health = 0;
        this.setVelocity(0, 0);
    }

    hit() {
        this.health--;
        if (this.health <= 0) {
            // En lugar de destroy(), usar despawn
            this.scene.enemyPool.despawn(this);
        }
    }
}

// En Game.js
this.enemyPool = new PoolManager(this, 'enemies', Enemy, 10, 5);

// Spawn enemy
const enemy = this.enemyPool.spawn(x, y, 'patrol');
this.physics.add.existing(enemy);
```

## Ejemplo 4: Debugging con Pool Registry

```javascript
// En cualquier parte del código
import { poolRegistry } from '../core/PoolManager.js';

// Ver estadísticas de todos los pools
console.log(poolRegistry.getAllStats());

// Output:
// {
//   platforms: {
//     created: 20,
//     spawned: 45,
//     despawned: 30,
//     maxActive: 18,
//     active: 15,
//     available: 5,
//     total: 20
//   },
//   enemies: {
//     created: 10,
//     spawned: 25,
//     despawned: 20,
//     maxActive: 8,
//     active: 5,
//     available: 5,
//     total: 10
//   }
// }

// Ver estadísticas de un pool específico
const platformPool = poolRegistry.get('platforms');
console.log(platformPool.getStats());
```

## Ejemplo 5: Limpiar objetos fuera de pantalla

```javascript
// En LevelManager.js - update()
cleanupOffscreenObjects(limitY) {
    const scene = this.scene;
    
    // ANTES: Destruir plataformas
    // scene.platforms.children.iterate((p) => {
    //     if (p && p.y > limitY) p.destroy();
    // });
    
    // DESPUÉS: Despawn plataformas
    const platformsToRemove = scene.platformPool
        .getActive()
        .filter(p => p.y > limitY);
    
    platformsToRemove.forEach(p => {
        scene.platformPool.despawn(p);
    });
    
    // Lo mismo para enemigos
    const enemiesToRemove = scene.enemyPool
        .getActive()
        .filter(e => e.y > limitY);
    
    enemiesToRemove.forEach(e => {
        scene.enemyPool.despawn(e);
    });
}
```

## Beneficios del Object Pooling

### Performance
- ✅ Reduce Garbage Collection
- ✅ Menos allocaciones de memoria
- ✅ Mejor framerate en dispositivos móviles

### Debugging
- ✅ Estadísticas de uso de objetos
- ✅ Detección de memory leaks
- ✅ Monitoreo de pools en tiempo real

### Escalabilidad
- ✅ Pools crecen automáticamente si es necesario
- ✅ Fácil ajustar tamaños iniciales
- ✅ Reutilización eficiente de objetos

## Próximos Pasos

1. **Refactorizar LevelManager** para usar PoolManager
2. **Crear Platform class** con métodos spawn/despawn
3. **Refactorizar Enemy spawning** para usar pools
4. **Agregar pooling para Projectiles**
5. **Monitorear estadísticas** en modo debug
