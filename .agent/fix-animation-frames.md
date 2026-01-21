# Fix: Animation Frame Lookup for Multiple Skins

## 🎯 Objetivo
Corregir la búsqueda de frames de animación para que funcione correctamente con diferentes convenciones de nombres entre skins (default y redbasketball).

## 🔍 Problemas Identificados

### 1. **Diferencias entre Skins**

#### Skin Default:
- ✅ `idle/idle-01.png` (carpeta minúscula)
- ⚠️ `Jump/jump-01.png` (carpeta con mayúscula "Jump")
- ✅ `double-jump/double-jump-01.png` (con guiones)
- ✅ `basketball-powerup` (16 frames)

#### Skin Redbasketball:
- ✅ `idle/idle-01.png` (carpeta minúscula)
- ✅ `jump/jump-01.png` (carpeta minúscula)
- ✅ `double-jump/double-jump-01.png` (con guiones)
- ⚠️ `basketball-powerup` (solo 10 frames)

### 2. **Animación stop-running no se reproducía**
- La animación existía en ambos skins
- El problema era que el fallback hardcodeado no usaba normalización

## 🛠️ Soluciones Implementadas

### 1. **Preloader.js**
- ✅ Mejorado el sistema de normalización de frames
- ✅ Agregado fallback para `jump-03.png` faltante
- ✅ Soporte para `double-jump` con guiones y guiones bajos
- ✅ Manejo automático de frames faltantes en powerup (10 vs 16 frames)

### 2. **PlayerStateMachine.js**
- ✅ Agregada función de normalización local en `_playJumpHold`
- ✅ Mejorado el fallback de frames en stop-running
- ✅ Búsqueda robusta de frames que ignora carpetas y mayúsculas

### 3. **frameUtils.js** (Nuevo)
- ✅ Creado archivo de utilidades para búsqueda de frames
- ✅ Funciones: `findPlayerFrame`, `hasPlayerFrame`, `safeSetFrame`
- ✅ Normalización consistente en todo el código

## 📝 Cambios Específicos

### Normalización de Frames
```javascript
const normalize = (name) => {
    // "Jump/jump-01.png" -> "jump01png"
    // "idle/idle-01.png" -> "idle01png"
    const filename = name.split('/').pop();
    return filename.toLowerCase().replace(/[\s\-_]/g, '');
};
```

### Búsqueda Robusta
1. **Exact match** (más rápido)
2. **Normalized fuzzy match** (ignora carpetas, mayúsculas, separadores)

## ✅ Verificación

### Frames que ahora funcionan en ambos skins:
- ✅ `idle-01.png` → encuentra `idle/idle-01.png` o `IDLE/IDLE-01.png`
- ✅ `jump-01.png` → encuentra `Jump/jump-01.png` o `jump/jump-01.png`
- ✅ `jump-03.png` → fallback a `jump-02.png` si no existe
- ✅ `double-jump-01.png` → encuentra con guiones o guiones bajos
- ✅ `stop-running-01.png` → encuentra en ambos skins
- ✅ `basketball-powerup-01.png` → usa solo los frames disponibles

## 🎮 Resultado
- ✅ Animación `stop-running` ahora se reproduce correctamente
- ✅ Ambos skins funcionan sin errores de sprites faltantes
- ✅ Sistema robusto que soporta diferentes convenciones de nombres
- ✅ Fallbacks automáticos para frames faltantes

## 📦 Archivos Modificados
1. `/src/scenes/Preloader.js`
2. `/src/entities/player/PlayerStateMachine.js`
3. `/src/entities/player/frameUtils.js` (nuevo)
4. `/index.html` (cache buster actualizado)
