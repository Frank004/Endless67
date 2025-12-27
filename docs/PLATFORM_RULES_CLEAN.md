# Reglas de Plataformas - Sistema Limpio

## 📏 Reglas Físicas Absolutas

### 1. Dimensiones de Plataformas
```javascript
ALTURA: 32px (fijo, siempre)
ANCHO: 96px o 160px (solo estos 2 valores)
```

### 2. Spacing Vertical Entre Plataformas
```javascript
MÍNIMO: 160px (de tope a tope)
MÁXIMO: 320px (de tope a tope)
```

**Ejemplo**:
```
Plataforma A en Y = 100
Plataforma B debe estar entre:
  - Y = -60  (100 - 160 = -60, mínimo)
  - Y = -220 (100 - 320 = -220, máximo)
```

### 3. Límites Horizontales (Paredes)

**Constantes del juego**:
```javascript
GAME_WIDTH = 600px
WALL_WIDTH = 20px
WALL_MARGIN = 10px
```

**Para plataforma de ancho W**:
```javascript
halfWidth = W / 2

// El CENTRO de la plataforma debe estar entre:
minX = WALL_WIDTH + WALL_MARGIN + halfWidth + 10
maxX = GAME_WIDTH - WALL_WIDTH - WALL_MARGIN - halfWidth - 10

// Para W=96:  minX ≈ 78,  maxX ≈ 522
// Para W=160: minX ≈ 110, maxX ≈ 490
```

**Regla simple**: El centro X debe estar en el rango [minX, maxX]

### 4. Capacidad de Salto del Jugador
```javascript
Salto normal: ~200px vertical
Doble salto: ~350px vertical
Wall jump: Permite alcanzar paredes opuestas
```

**Por eso el spacing máximo es 320px** (alcanzable con doble salto)

## 🎯 Arquitectura del Sistema

### Clase 1: PlatformGenerator
**Responsabilidad**: Decidir CUÁNDO y DÓNDE generar plataformas

```javascript
class PlatformGenerator {
    - lastY (última Y generada)
    
    update() {
        if (necesitamos más plataformas) {
            generar grupo
        }
    }
}
```

### Clase 2: PlatformGroupPool
**Responsabilidad**: Proveer grupos pre-definidos de plataformas

```javascript
class PlatformGroupPool {
    - grupos[] (array de grupos pre-definidos)
    
    getRandomGroup() {
        return grupo aleatorio
    }
}
```

**Formato de un grupo**:
```javascript
{
    name: "zigzag_basic",
    platforms: [
        { xOffset: -100, yOffset: 0, width: 96 },
        { xOffset: 100, yOffset: -180, width: 160 },
        { xOffset: -100, yOffset: -360, width: 96 },
        // ...
    ]
}
```

### Clase 3: PlatformValidator
**Responsabilidad**: Validar que las plataformas cumplan las reglas

```javascript
class PlatformValidator {
    validatePosition(x, y, width) {
        // 1. Verificar límites de paredes
        // 2. Verificar spacing vertical (opcional, si es necesario)
        return true/false
    }
    
    clampToWalls(x, width) {
        // Forzar X a estar dentro de límites
        return clampedX
    }
}
```

## 📦 Grupos de Plataformas Pre-definidos

### Grupo 1: Zigzag Básico (5 plataformas)
```
[-100, 0, 96]      Izquierda
[100, -180, 160]   Derecha
[-100, -360, 96]   Izquierda
[0, -540, 160]     Centro
[100, -720, 96]    Derecha

Altura total: ~720px
```

### Grupo 2: Escalera Izquierda (5 plataformas)
```
[-120, 0, 96]      Izquierda arriba
[-80, -200, 96]    Izquierda medio
[0, -380, 160]     Centro
[80, -560, 96]     Derecha medio
[120, -740, 96]    Derecha abajo

Altura total: ~740px
```

### Grupo 3: Centro Alternado (5 plataformas)
```
[0, 0, 160]        Centro
[-100, -190, 96]   Izquierda
[100, -380, 96]    Derecha
[0, -570, 160]     Centro
[-100, -760, 96]   Izquierda

Altura total: ~760px
```

## 🔄 Flujo de Generación

```
1. PlatformGenerator.update()
   ↓
2. ¿Necesitamos plataformas? (lastY > cameraY - 800)
   ↓ Sí
3. PlatformGroupPool.getRandomGroup()
   ↓
4. Para cada plataforma del grupo:
   ↓
5. Calcular posición final:
   x = centerX + xOffset + variación
   y = lastY + yOffset
   ↓
6. PlatformValidator.clampToWalls(x, width)
   ↓
7. Spawnear plataforma
   ↓
8. Actualizar lastY al tope del grupo
```

## ✅ Validaciones SIMPLES

### Validación 1: Clamp a Paredes (SIEMPRE)
```javascript
x = Phaser.Math.Clamp(x, minX, maxX)
```

### Validación 2: Spacing Vertical (OPCIONAL)
Solo si queremos verificar que los grupos pre-definidos cumplen las reglas.
En realidad, si los grupos están bien diseñados, NO necesitamos validar.

## 🚫 Lo que NO Hacemos

- ❌ NO validar contra plataformas activas
- ❌ NO calcular overlaps AABB
- ❌ NO verificar same-line
- ❌ NO sistemas de emergencia
- ❌ NO múltiples referencias de Y
- ❌ NO cambiar dificultad por altura (por ahora)
- ❌ NO generar plataformas individuales

## 📊 Ejemplo Completo

```javascript
// 1. Generator decide generar
lastY = 450

// 2. Pool provee grupo "zigzag_basic"
grupo = {
    platforms: [
        { xOffset: -100, yOffset: 0, width: 96 },
        { xOffset: 100, yOffset: -180, width: 160 }
    ]
}

// 3. Para cada plataforma:
// Plataforma 1:
x = 300 + (-100) + 20 = 220  // centerX + offset + variación
y = 450 + 0 = 450
width = 96
x = clamp(220, 78, 522) = 220 ✅
spawn(220, 450, 96)

// Plataforma 2:
x = 300 + 100 + 20 = 420
y = 450 + (-180) = 270
width = 160
x = clamp(420, 110, 490) = 420 ✅
spawn(420, 270, 160)

// 4. Actualizar lastY
lastY = 270 (la más alta del grupo)
```

## 🎯 Objetivos

1. **Simple**: <300 líneas de código total
2. **Predecible**: Mismos grupos = mismo resultado
3. **Sin bugs**: Grupos pre-validados
4. **Mantenible**: Código fácil de leer
5. **Escalable**: Agregar grupos = agregar objeto

## 📝 Resumen de Archivos

```
Mantener:
✅ src/prefabs/Platform.js (actualizar dimensiones)
✅ src/core/PoolManager.js (para pools de plataformas)

Crear:
📄 src/managers/PlatformGenerator.js
📄 src/data/PlatformGroups.js
📄 src/utils/PlatformValidator.js

Eliminar:
❌ src/managers/LevelManager.js (generación)
❌ src/managers/SimplePlatformGenerator.js
❌ src/managers/PatternBasedGenerator.js
❌ src/data/PlatformPatterns.js
❌ src/data/PlatformPatternsFromImages.js
❌ src/managers/DifficultyManager.js (por ahora)
❌ Cualquier chunk/pattern relacionado
```

## 🔧 Próximo Paso

1. Actualizar `Platform.js` con dimensiones correctas
2. Crear las 3 clases nuevas
3. Integrar en `Game.js`
4. Testing básico

---

**Filosofía**: Mantenerlo SIMPLE. Si funciona, no lo compliques.

