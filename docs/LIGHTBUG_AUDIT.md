# Auditoría: Sistema de Interacción LightBug

## 📋 Resumen del Sistema

### Flujo de Interacción:

1. **Inicialización**:
   - `GameInitializer.createManagers()` crea `InteractableManager` (línea 129)
   - Se guarda en `scene.interactableManager`

2. **Registro de Interactables**:
   - **Lámparas**: `WallDecorManager.spawnDecoration()` registra cada lámpara (línea 224-228)
   - **Streetlight**: `StageFloor.addStreetlight()` registra el streetlight (línea 103-115)
   - Cada registro llama a `interactableManager.register(id, interactable)`

3. **Update Loop**:
   - Se inicia cuando se registra el primer interactable
   - Usa `scene.events.on('update')` + `time.addEvent()` (cada 16ms)
   - Llama a `interactable.onUpdate(player)` en cada frame

4. **Detección de Proximidad**:
   - `LightBugInteractable.onUpdate()` calcula distancia euclidiana: `√((player.x - lampX)² + (player.y - lampY)²)`
   - Si `distance < detectionRadius` (60px) → Player está cerca
   - Usa **State Machine** para gestionar estados

5. **Modificación de Partículas**:
   - Estado FLEEING: Modifica `particle.vx/vy` o posición directamente
   - Accede a partículas via: `particleManager.emitters[].alive[]`

## 🔍 Problemas Potenciales

### 1. Timing de Registro
- ❓ ¿Se registran las lámparas ANTES de que el player exista?
- ❓ ¿El InteractableManager se crea ANTES de las lámparas?

### 2. Acceso a Partículas
- ❓ ¿`particleManager.emitters` existe y es un array?
- ❓ ¿`emitter.alive` existe y tiene partículas?
- ❓ ¿Las partículas tienen `vx/vy` modificables?

### 3. Cálculo de Posición
- ❓ ¿La posición de la luz se calcula correctamente?
- ❓ ¿Las coordenadas del player y la luz están en el mismo espacio?

### 4. Update Loop
- ❓ ¿El update loop se está ejecutando?
- ❓ ¿El player está disponible cuando se llama `onUpdate()`?

## 🛠️ Qué Estamos Usando

### Proximity Detection (Detección de Proximidad)
- **NO usa física/collision** - Solo cálculo de distancia euclidiana
- **Más eficiente** que overlap/collision para este caso
- **Fórmula**: `distance = √((dx)² + (dy)²)`
- **Radio de detección**: 60px

### State Machine
- **NORMAL**: Comportamiento normal
- **FLEEING**: Partículas huyen del player
- **RETURNING**: Partículas vuelven a posición original

### Modificación de Partículas
- Intenta múltiples métodos:
  1. `particle.vx/vy` (directo)
  2. `particle.velocityX/velocityY`
  3. `particle.setVelocity()`
  4. Modificar `particle.x/y` directamente (fallback)
