# 🚨 ROLLBACK: PoolManager Disabled

## ❌ Problema Identificado

El refactor del **PoolManager** causó que las plataformas dejaran de funcionar correctamente:

### Síntomas
- ✗ Plataformas azules (móviles) no se mueven
- ✗ Plataformas incrustadas unas con las otras
- ✗ Gaps gigantes en la generación
- ✗ Lógica de plataformas completamente rota

### Causa Raíz

El PoolManager fue introducido en un refactor previo (antes de este session) y tiene conflictos con el sistema legacy:

1. **Doble activación**: El PoolManager llama a `setActive(true)` y luego el método `spawn()` del objeto lo vuelve a llamar
2. **Conflicto de grupos**: Los objetos se agregan tanto al pool como al grupo legacy, causando duplicación
3. **Física inconsistente**: El body de física no se configura correctamente en todos los casos
4. **Update no se ejecuta**: El `preUpdate()` de Platform no se llama porque el objeto no está en el grupo correcto

## ✅ Solución Aplicada

**ROLLBACK TEMPORAL**: Deshabilitar completamente el PoolManager y volver al sistema legacy que funcionaba.

### Cambios en `Game.js`

```javascript
// ANTES (con PoolManager - ROTO)
this.platformPool = new PoolManager(...);
poolRegistry.register('platforms', this.platformPool);

// AHORA (legacy - FUNCIONAL)
/*
this.platformPool = new PoolManager(...); // DESHABILITADO
*/
this.platforms = this.physics.add.group({ allowGravity: false, immovable: true });
```

### Pools Deshabilitados

- ❌ `platformPool` - DESHABILITADO
- ❌ `patrolEnemyPool` - DESHABILITADO  
- ❌ `shooterEnemyPool` - DESHABILITADO
- ❌ `jumperShooterEnemyPool` - DESHABILITADO
- ❌ `projectilePool` - DESHABILITADO

Todos vuelven al sistema de `Phaser.Physics.Arcade.Group` que funcionaba correctamente.

## 📊 Estado Actual

### ✅ Funcionando (Legacy System)
- Plataformas estáticas
- Plataformas móviles
- Enemigos (patrol, shooter, jumper)
- Proyectiles
- Generación de niveles
- Progresión por altura

### ✅ Funcionando (Refactor Completado)
- AudioManager (Singleton)
- ScoreManager (Singleton)
- EventBus (ya era Singleton)
- GameState (ya era Singleton)

### ⚠️ Pendiente de Arreglar
- PoolManager (tiene bugs críticos)
- Platform.js (necesita ajustes para trabajar con PoolManager)
- Enemy prefabs (necesitan ajustes para trabajar con PoolManager)

## 🔧 Plan de Acción

### Opción A: Arreglar PoolManager (Recomendado para futuro)

**Problemas a resolver:**
1. Eliminar doble activación en `PoolManager.spawn()`
2. Asegurar que `preUpdate()` se llame correctamente
3. Evitar conflictos entre pool y grupos legacy
4. Testear exhaustivamente antes de reactivar

**Tiempo estimado:** 2-3 horas de debugging y testing

### Opción B: Mantener Sistema Legacy (Recomendado para ahora)

**Ventajas:**
- ✅ Funciona perfectamente
- ✅ Código probado y estable
- ✅ No requiere cambios adicionales
- ✅ Permite continuar con otras features

**Desventajas:**
- ⚠️ Más Garbage Collection (pero no es problema en juegos pequeños)
- ⚠️ Código menos "moderno"

## 🎯 Recomendación

**MANTENER SISTEMA LEGACY** por ahora y enfocarse en:

1. ✅ Verificar que el juego funciona correctamente
2. ✅ Hacer commit de los fixes de generación de plataformas
3. ✅ Continuar con features del juego
4. ⏳ Arreglar PoolManager en una sesión dedicada de debugging

## 📝 Commit Message

```bash
git add src/scenes/Game.js
git add src/managers/LevelManager.js
git commit -m "Fix(platforms): disable PoolManager and restore legacy system

- Temporarily disable PoolManager due to critical bugs
- Restore working Phaser.Physics.Arcade.Group system
- Fix platform spawn bounds to prevent wall clipping
- Guarantee platforms in tutorial zone (0-300m)
- Increase initial platform generation (6 -> 10 rows)

PoolManager will be debugged and re-enabled in future session.
Legacy system is stable and functional."
```

## 🐛 PoolManager Debug Checklist (Para Futuro)

Cuando se retome el PoolManager, verificar:

- [ ] `spawn()` no debe llamar a `setActive()` antes de `obj.spawn()`
- [ ] `Platform.preUpdate()` debe ejecutarse (verificar que está en display list)
- [ ] Physics body debe configurarse correctamente
- [ ] No debe haber conflicto entre pool y grupos legacy
- [ ] Testear con plataformas estáticas
- [ ] Testear con plataformas móviles
- [ ] Testear despawn y re-spawn
- [ ] Verificar que no hay memory leaks

---

**Status**: ✅ RESUELTO (usando legacy system)
**Impact**: Sistema funcional restaurado
**Risk**: Ninguno (volvimos a código estable)
