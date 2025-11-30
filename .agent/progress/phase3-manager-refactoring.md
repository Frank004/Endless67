# Fase 3: Manager Refactoring - EN PROGRESO 🔄

## Fecha: 2025-11-27

## Resumen Ejecutivo
Refactorización de los managers para desacoplar la lógica de juego de la UI, eliminar dependencias directas y usar el EventBus para comunicación. Esta fase prepara el terreno para una arquitectura más escalable y mantenible.

## Objetivos de la Fase
Según el plan de implementación (`.agent/implementation_plan.md`):
- [x] Desacoplar `UIManager` del game loop
- [x] Hacer que `UIManager` escuche eventos del `EventBus`
- [x] Remover lógica de juego de `UIManager` (pausar physics)
- [ ] Integrar `PoolManager` en `LevelManager` (requiere crear clase Platform - Fase 4)
- [x] Refactorizar `InputManager` para emitir eventos estandarizados
- [x] Actualizar `Game.js` para usar eventos en lugar de llamadas directas

## Estado Actual

### UIManager ✅ COMPLETADO
**Problemas identificados:**
- ❌ Tiene método `update()` que se llama desde el game loop
- ❌ `togglePauseMenu()` pausa/resume physics directamente
- ❌ Actualiza UI directamente desde `scene.currentHeight`
- ❌ No usa EventBus para recibir actualizaciones

**Cambios realizados:**
- ✅ Removido método `update()` del game loop
- ✅ Suscrito a eventos: `SCORE_UPDATED`, `HEIGHT_UPDATED`, `GAME_PAUSED`, `GAME_RESUMED`, `GAME_OVER`
- ✅ Lógica de pausa de physics movida a `Game.js` (maneja eventos de GameState)
- ✅ Usa `GameState` para leer estado en lugar de `scene`
- ✅ Método `setupEventListeners()` para configurar listeners
- ✅ Método `destroy()` para limpiar listeners

### LevelManager
**Problemas identificados:**
- ❌ Usa directamente `scene.platforms.create()`, `scene.coins.create()`, etc.
- ❌ No usa `PoolManager` para reutilizar objetos
- ❌ Mezcla lógica de generación con creación de objetos

**Cambios necesarios:**
- [ ] Integrar `PoolManager` para plataformas
- [ ] Usar `spawn()` y `despawn()` en lugar de `create()` y `destroy()`
- [ ] Preparar para pools de enemigos y proyectiles (Fase 4)

### InputManager ✅ COMPLETADO
**Problemas identificados:**
- ❌ Llama directamente a `scene.player.move()` y `scene.player.jump()`
- ❌ No emite eventos estandarizados

**Cambios realizados:**
- ✅ Emite eventos: `PLAYER_MOVE`, `PLAYER_JUMPED`, `PLAYER_STOP`
- ✅ Mantiene compatibilidad temporal con llamadas directas (hasta Fase 4)
- ✅ Eventos agregados a `EventBus.js`

## Plan de Implementación

### Paso 1: Refactorizar UIManager ✅ COMPLETADO
1. ✅ Suscribirse a eventos del EventBus en `setupEventListeners()`
2. ✅ Removido método `update()` del game loop
3. ✅ Lógica de pausa de physics movida a `Game.js` (escucha eventos de GameState)
4. ✅ Usa `GameState` para leer estado

### Paso 2: Refactorizar LevelManager
1. Crear pools de plataformas usando `PoolManager`
2. Refactorizar `spawnPlatform()` para usar pool
3. Refactorizar cleanup para usar `despawn()`

### Paso 3: Refactorizar InputManager ✅ COMPLETADO
1. ✅ Emite eventos: `PLAYER_MOVE`, `PLAYER_JUMPED`, `PLAYER_STOP`
2. ✅ Mantiene compatibilidad temporal con llamadas directas (hasta Fase 4)
3. ✅ Eventos agregados a `EventBus.js`

### Paso 4: Actualizar Game.js ✅ COMPLETADO
1. ✅ Manejar pausa/resume de physics en `Game.js` (escucha eventos de GameState)
2. ✅ Setup de event listeners para pausa/resume
3. ✅ Removida llamada a `uiManager.update()`
4. ✅ Actualización de altura ahora usa `GameState.updateHeight()`

## Tests
- [x] Ejecutar tests existentes para verificar que no hay regresiones ✅ 80/80 passing
- [ ] Crear tests para verificar que UIManager escucha eventos correctamente
- [ ] Verificar que LevelManager usa PoolManager correctamente

## Archivos Modificados

### Core
- ✅ `src/core/EventBus.js` - Agregados eventos `PLAYER_MOVE`, `PLAYER_STOP`

### Managers
- ✅ `src/managers/UIManager.js` - Refactorizado para usar EventBus
- ✅ `src/managers/InputManager.js` - Emite eventos estandarizados

### Scenes
- ✅ `src/scenes/Game.js` - Maneja eventos de pausa/resume, actualiza GameState

## Próximos Pasos
- Fase 4: Entity Refactoring
- Fase 5: Final Integration

---

## Resumen de Cambios

### Principios Aplicados ✅
- **Single Responsibility**: UIManager solo maneja UI, no lógica de juego
- **Separation of Concerns**: Lógica de pausa movida a Game.js
- **Dependency Injection Ready**: UIManager escucha eventos, no depende de Game.js directamente
- **DRY**: EventBus centraliza comunicación entre sistemas

### Beneficios
- ✅ UIManager desacoplado del game loop
- ✅ Comunicación mediante eventos (EventBus)
- ✅ GameState centraliza estado del juego
- ✅ InputManager preparado para Fase 4 (Player escuchará eventos)
- ✅ Tests pasando (80/80)

### Pendiente para Fase 4
- Integración de PoolManager en LevelManager (requiere crear clase Platform con spawn/despawn)

---

**Status**: ✅ MAYORMENTE COMPLETADA (LevelManager pooling pendiente para Fase 4)
**Branch**: `refactor-code`
**Tests**: 80/80 passing

