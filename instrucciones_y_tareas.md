# Auditoría de Arquitectura y Tareas de Refactorización

## 1. Verificación de Principios del Sistema

### ✅ Single Responsibility (Responsabilidad Única)
*   **Estado Actual**:
    *   `CollisionManager` delega correctamente en handlers (`PlayerHandler`, etc.).
    *   `Player` delega lógica de estado a `PlayerController` (FSM), lo cual es excelente.
    *   **Problemas Detectados**:
        *   `Game.js`: Actúa como "God Class" en la inicialización. Instancia todos los managers y configura gran parte del estado inicial manualmente.
        *   `LevelManager.js`: Sobrecargado. Maneja generación de plataformas, mazes, spawn de enemigos, cálculo de dificultad y spawn de powerups. Mezcla lógica de "qué generar" con "cómo generarlo".
        *   `Player.js`: Mezcla lógica de movimiento (física pura) con lógica de gameplay (powerups, audio).

### ✅ DRY (No Repetir Código)
*   **Estado Actual**:
    *   Existen utilidades compartidas (`utils/platformRider.js`, etc.).
    *   **Problemas Detectados**:
        *   **Validación de Posición**: Lógica repetida de validación de límites (márgenes, `WALLS`, `width/2`) en `LevelManager.js`, `Platform.js` y `Player.js`.
        *   **Configuraciones Hardcodeadas**: Valores mágicos dispersos (`500`, `32`, `12000`, `0xaaaaaa`) repetidos en varios archivos en lugar de usar `GameConstants.js` o configs centralizados.
        *   **Creación de Pools**: En `Game.js`, la creación de `PoolManager` para cada entidad es repetitiva.

### ✅ Dependency Injection Ready (Inyección de Dependencias)
*   **Estado Actual**:
    *   La mayoría de clases reciben `scene` en el constructor. Esto es un "Service Locator" implícito (el `scene` tiene todo).
    *   `EventBus` desacopla la comunicación, lo cual es muy positivo.
    *   **Problemas Detectados**:
        *   Alto acoplamiento a `Phaser.Scene`. Es difícil testear `LevelManager` o `Player` sin una instancia real de escena.
        *   Uso directo de `new Class()` dentro de otras clases (e.g., `Game.js` creando managers), dificultando el intercambio de implementaciones.

### ✅ Separation of Concerns (Separación de Intereses)
*   **Estado Actual**:
    *   `CollisionManager` separa bien la detección de la respuesta.
    *   `EventBus` separa la lógica de eventos de la lógica de entidades.
    *   **Problemas Detectados**:
        *   `LevelManager.js` contiene lógica de presentación (visuales de suelo, `createMazeFloorVisual`) mezclada con lógica de juego pura.
        *   `Player.js` contiene lógica de UI (`powerupOverlay`) y Audio (`audioManager`), que debería ser reactiva a eventos o pasarse por componentes.

### ✅ Utilidades Compartidas & Constantes
*   **Estado Actual**:
    *   Se usa `GameConstants.js` y `EventBus.js`.
    *   **Problemas Detectados**:
        *   Muchos "números mágicos" aún persisten en el código (fuera de `config/`).
        *   Constantes de física (fuerzas de salto, gravedad) definidas localmente en `Player.js`.

---

## 2. Plan de Acción y Tareas

### ✅ Refactorización Prioritaria (COMPLETADA)

#### A. Limpieza de `LevelManager.js`
*   [x] **Extraer Generadores**: Crear `PlatformSpawner` y `MazeSpawner` como clases separadas.
*   [x] **Centralizar Configuración**: Mover todos los números mágicos a `LevelConfig.js` o `GameConstants.js`.
*   [x] **Eliminar Código Muerto**: Remover métodos/bloques marcados como "LEGACY" que ya no se usen (verificar con `PlatformGenerator` si existe).
*   [x] **Separar Visuales**: Mover `createMazeFloorVisual` a `WallDecorator` o un `LevelVisualsManager`. (Manejado en `MazeSpawner` por ahora).

#### B. Optimización de `Game.js`
*   [x] **Factory de Managers**: Crear un `GameContext` o método `setupManagers()` que centralice la creación e inyección de dependencias, limpiando el método `create()`. (Implementado `GameInitializer`).
*   [x] **Configuración de Pools**: Mover la configuración de pools a un array de configuración iterativo para reducir líneas repetitivas. (Implementado centralizado y con registry).

#### C. Desacoplamiento de `Player.js`
*   [x] **Externalizar Constantes**: Mover `baseJumpForce`, `baseMoveForce`, etc., a `PlayerConfig.js`.
*   [x] **Desacoplar Audio**: El player no debería llamar a `audioManager.playJumpSound()`. Debería emitir `PLAYER_JUMPED` y que `AudioManager` escuche.

#### D. Centralización de Constantes y Strings
*   [x] Crear constantes para todas las claves de texturas (`'player'`, `'coin'`, etc.) en un archivo de recursos. (`AssetKeys.js`)
*   [x] Crear constantes para claves de registro (`registry.get('usePlayerPNG')`). (`RegistryKeys.js`)

---

## 4. Análisis de "Código Espagueti"

### ✅ Áreas Limpias (Buen Diseño)
*   **`PlayerController.js`**: Excelente uso de State Machine y Context. Lógica clara, flow lineal y métodos cortos.
*   **`Enemy.js`**: Buen uso del Strategy Pattern (`PatrolBehavior`, `ShootBehavior`). Aunque tiene algo de lógica de pooling interna (spawn/despawn), está contenida y no afecta el flujo principal.

### 🚨 Áreas Críticas (Código Espagueti Detectado) - RESUELTO
*   **`LevelManager.js`**: Refactorizado y dividido en `PlatformSpawner` y `MazeSpawner`.
    *   **Método `generatePlatformBatch`**: Movido y simplificado.
    *   **Método `spawnMazeRowFromConfig`**: Delegado.

---

## 5. Limpieza de Comentarios

Se requiere eliminar o simplificar comentarios en los siguientes archivos:

### `src/managers/LevelManager.js`
*   [x] **Lineas 12-21**: Simplificar header "LEGACY" una vez se refactorice.
*   [x] **Lineas 134-140**: Eliminar bloques de comentarios de código comentado o logs viejos.
*   [x] **Lineas 279, 366, 427, 448**: Eliminar `console.log` y `warn` verbose de producción. Usar un sistema de logs condicional si es necesario.
*   [x] **Lineas 376-377, 430**: Eliminar comentarios de deuda técnica ("TEMPORALMENTE DESACTIVADO") -> Convertir en tickets o resolver.

### `src/scenes/Game.js`
*   [x] **Lineas 209-210**: Simplificar explicación de validación.
*   [x] **Lineas 276-277**: Eliminar comentarios obvios sobre cálculo de altura.
*   [x] **Lineas 97-101, 103-105**: Simplificar explicación de setup de player. El código debe ser autoexplicativo con buenos nombres de variables.
*   [x] **Lineas 134**: Eliminar comentarios sobre código eliminado.


---

## 6. Reorganización de Directorios y Estructura (COMPLETADO)

Para mejorar la navegación y cohesión del proyecto, se propone la siguiente agrupación de archivos.
**Importante**: Al mover estos archivos, se deben actualizar todas las referencias de importación (`import ... from ...`) en `Game.js` y otros archivos dependientes.

### 📂 `src/managers/level/`
Agrupar todo lo relacionado con la generación procedural y el entorno.
*   **Mover**: `LevelManager.js`, `SlotGenerator.js`, `WallDecorator.js`, `MazeDecorator.js`.
*   **Crear Aquí**: `PlatformSpawner.js`, `MazeBuilder.js` (nuevas clases refactorizadas).

### 📂 `src/managers/collision/`
Centralizar el sistema de colisiones completo.
*   **Mover**: `CollisionManager.js` (actualmente en la raíz de `managers`).
*   **Mantener**: Ya contiene `PlayerHandler.js`, `EnemyHandler.js`, etc.

### 📂 `src/managers/audio/`
*   **Mover**: `AudioManager.js`.

### 📂 `src/managers/ui/`
*   **Mover**: `UIManager.js`.

### 📂 `src/managers/gameplay/`
Sistemas de reglas y mecanismos de juego específicos.
*   **Mover**: `ScoreManager.js`.
*   **Mover**: `RiserManager.js` y `RiserPipelineManager.js` (o crear subcarpeta `riser` si crece).
*   **Mover**: `ParticleManager.js`.

### 📂 `src/managers/debug/`
Herramientas de desarrollo.
*   **Mover**: `DebugManager.js`, `DebugRuler.js`.

### 📂 `src/managers/input/`
*   **Mover**: `InputManager.js`.

### 📝 Tareas de Migración
1.  **Crear carpetas**: `level`, `audio`, `ui`, `gameplay`, `debug`, `input` dentro de `src/managers`.
2.  **Mover archivos**: Ejecutar `mv` git-aware o mover manualmente.
3.  **Refactorizar Imports**:
    *   En `Game.js`: Actualizar rutas (ej: `../managers/LevelManager.js` -> `../managers/level/LevelManager.js`).
    *   En los mismos managers: Actualizar imports relativos si se referencian entre sí (ej: `../utils` ahora podría ser `../../utils`).

