# Sistema de Decoraciones de Pared (Wall Decorations)

## Descripción General

Sistema para generar decoraciones visuales en las paredes del juego (lightboxes, señales, graffiti, etc.). Las decoraciones se pegan al **borde interior de las paredes** (wall inset / inner wall edge).

## Terminología

- **Wall Inset** / **Inner Wall Edge**: El borde interior de las paredes donde se montan las decoraciones
- **Wall Decor**: Cualquier elemento decorativo montado en las paredes (lightboxes, señales, etc.)

## Arquitectura

### 1. WallDecorConfig.js
**Ubicación**: `/src/config/WallDecorConfig.js`

Configuración centralizada para todas las decoraciones de pared:
- Posicionamiento (offset desde el wall inset)
- Spawn rates (cantidad por slot, probabilidad)
- Depth/Z-index (layering visual)
- Tipos de decoraciones disponibles (lightboxes, etc.)

```javascript
// Ejemplo de configuración
WALL_DECOR_CONFIG = {
    wallInsetOffset: 32,  // Posición del borde interior
    perSlot: { min: 1, max: 2 },  // 1-2 decoraciones por slot
    spawnChance: 0.6,  // 60% probabilidad
    depth: { base: 5 }  // Arriba de cables (depth 3)
}
```

### 2. WallDecorManager.js
**Ubicación**: `/src/managers/visuals/WallDecorManager.js`

Manager responsable de:
- Generar decoraciones para cada slot
- Posicionar correctamente en wall insets
- Alternar entre pared izquierda/derecha
- Cleanup de decoraciones off-screen

**Métodos principales**:
- `generateForSlot(slotY, slotHeight)` - Genera decoraciones para un slot
- `cleanup(playerY, cleanupDistance)` - Limpia decoraciones fuera de pantalla
- `destroy()` - Destruye todas las decoraciones

### 3. Integración con SlotGenerator
**Ubicación**: `/src/managers/level/SlotGenerator.js`

El SlotGenerator llama automáticamente a WallDecorManager:
- En `generatePlatformBatch()` - Genera decoraciones para slots de plataformas
- En `generateMaze()` - Genera decoraciones para slots de maze
- En `update()` - Limpia decoraciones viejas

## Tipos de Decoraciones

### Lightboxes
**Atlas**: `props.json`
**Frames disponibles**:
- Pared izquierda: `lightbox-l-01.png` a `lightbox-l-06.png` (6 variantes)
- Pared derecha: `lightbox-r-01.png` a `lightbox-r-06.png` (6 variantes)

**Configuración**:
```javascript
LIGHTBOX: {
    atlas: ASSETS.PROPS,
    frames: {
        left: ['lightbox-l-01.png', ...],
        right: ['lightbox-r-01.png', ...]
    },
    alpha: 1.0,
    scale: 1.0
}
```

## Cómo Agregar Nuevos Tipos de Decoraciones

1. **Agregar sprites al atlas** (`props.json`)
2. **Definir tipo en WallDecorConfig.js**:
```javascript
types: {
    NEON_SIGN: {
        name: 'NEON_SIGN',
        atlas: ASSETS.PROPS,
        frames: {
            left: ['neon-l-01.png', ...],
            right: ['neon-r-01.png', ...]
        },
        alpha: 0.9,
        scale: 1.2
    }
}
```

3. **Actualizar WallDecorManager** si necesitas lógica especial de spawn

## Configuración de Spawn

### Cantidad por Slot
```javascript
perSlot: {
    min: 1,  // Mínimo 1 decoración
    max: 2   // Máximo 2 decoraciones
}
```

### Probabilidad de Spawn
```javascript
spawnChance: 0.6  // 60% de probabilidad por slot
```

### Distribución entre Paredes
```javascript
wallDistribution: {
    left: 0.5,   // 50% pared izquierda
    right: 0.5   // 50% pared derecha
}
```

### Separación Vertical
```javascript
minVerticalGap: 160  // Mínimo 160px entre decoraciones
```

## Depth/Z-Index Layering

El sistema usa depth para controlar el orden de renderizado:

```
Depth 1-2: Background effects (cables)
Depth 3:   Cables
Depth 5:   Wall Decorations (lightboxes) ← AQUÍ
Depth 10+: Platforms, Player, Enemies
```

## Posicionamiento

Las decoraciones se posicionan en el **wall inset** (borde interior de las paredes):

```javascript
// Pared izquierda
x = wallInsetOffset + insetMargin
  = 32 + 2 = 34px

// Pared derecha
x = gameWidth - wallInsetOffset - insetMargin
  = 360 - 32 - 2 = 326px
```

**Origin**:
- Pared izquierda: `(0, 0.5)` - origen a la izquierda, centrado verticalmente
- Pared derecha: `(1, 0.5)` - origen a la derecha, centrado verticalmente

## Performance

### Cleanup Automático
Las decoraciones se limpian automáticamente cuando están fuera de pantalla:
- Distancia de cleanup: 1800px por debajo del jugador
- Se ejecuta en cada frame del `SlotGenerator.update()`

### Memory Management
- Las decoraciones se destruyen completamente (no se reciclan en pool)
- El array `decorations` se filtra para remover referencias

## Debugging

Para ver logs de decoraciones, activa el flag de debug:
```javascript
this.scene.registry.set('showSlotLogs', true);
```

## Ejemplo de Uso

```javascript
// El sistema funciona automáticamente, pero puedes usarlo manualmente:

// 1. Crear manager
const wallDecorManager = new WallDecorManager(scene);

// 2. Generar decoraciones para un slot
wallDecorManager.generateForSlot(slotY, slotHeight);

// 3. Limpiar decoraciones viejas (en update loop)
wallDecorManager.cleanup(playerY, 1800);

// 4. Destruir todas las decoraciones
wallDecorManager.destroy();
```

## Futuras Mejoras

- [ ] Animaciones para lightboxes (parpadeo, glow)
- [ ] Más tipos de decoraciones (graffiti, señales, ventanas)
- [ ] Decoraciones específicas por altura/dificultad
- [ ] Efectos de partículas para algunas decoraciones
- [ ] Decoraciones interactivas (que reaccionen al jugador)
