# 🎨 Toggle de Player PNG - Guía de Uso

## 📋 Resumen

Sistema implementado para usar un PNG como placeholder visual del player, con toggle para activar/desactivar fácilmente.

---

## 🎯 Cómo Funciona

### 1. **Carga del PNG**
- El juego intenta cargar `assets/images/player_32x32.png` automáticamente
- Si el PNG no existe, no hay error - simplemente se usa el placeholder generado

### 2. **Toggle de Activación**
- Controlado por `DebugManager.usePlayerPNG`
- **Ubicación:** `src/managers/DebugManager.js` (línea ~10)

### 3. **Lógica de Selección**
- Si `usePlayerPNG = true` Y el PNG existe → Usa PNG
- Si `usePlayerPNG = false` → Usa placeholder generado (ignora PNG)
- Si PNG no existe → Usa placeholder generado (fallback automático)

---

## 🔧 Cómo Usar

### Paso 1: Colocar el PNG
Coloca tu sprite PNG en:
```
assets/images/player_32x32.png
```
**Requisitos:**
- Tamaño: 32x32 píxeles
- Formato: PNG con transparencia
- Nombre exacto: `player_32x32.png`

### Paso 2: Activar/Desactivar el Toggle

Abre `src/managers/DebugManager.js` y modifica:

```javascript
export class DebugManager {
    constructor(scene) {
        this.scene = scene;
        // ...
        
        // PLAYER SPRITE TOGGLE
        this.usePlayerPNG = true;  // ← Cambia aquí
        // true = usar PNG si existe
        // false = usar placeholder generado
    }
}
```

### Paso 3: Probar

1. **Con PNG activado (`usePlayerPNG = true`):**
   - Si el PNG existe → Verás tu sprite PNG
   - Si el PNG no existe → Verás placeholder generado + mensaje en consola

2. **Con PNG desactivado (`usePlayerPNG = false`):**
   - Siempre verás placeholder generado (cubo cian)
   - Ignora el PNG aunque exista

---

## 📝 Mensajes de Consola

El juego muestra mensajes en la consola del navegador:

- ✅ `"✅ Player PNG disponible (32x32px) - Se usará si toggle está activo"`
  - PNG cargado correctamente y toggle activo

- 🎨 `"🎨 Usando Player placeholder generado (toggle desactivado)"`
  - Toggle desactivado, usando placeholder

- ⚠️ `"⚠️ PNG no encontrado, usando placeholder generado"`
  - PNG no existe, usando placeholder como fallback

---

## 🎮 Ejemplo de Uso

### Escenario 1: Probar PNG Visual
```javascript
// DebugManager.js
this.usePlayerPNG = true;  // Activar PNG
```
→ Coloca `player_32x32.png` en `assets/images/`
→ Ejecuta el juego → Verás tu PNG

### Escenario 2: Volver al Placeholder
```javascript
// DebugManager.js
this.usePlayerPNG = false;  // Desactivar PNG
```
→ Ejecuta el juego → Verás placeholder generado (cubo cian)

---

## 🔍 Verificación

Para verificar qué textura se está usando:

1. Abre la consola del navegador (F12)
2. Busca los mensajes de log mencionados arriba
3. O inspecciona el sprite en el juego:
   ```javascript
   // En la consola del navegador (después de iniciar el juego)
   game.scene.scenes[2].player.texture.key
   // Debería mostrar: "player_png" o "player"
   ```

---

## ⚙️ Detalles Técnicos

### Archivos Modificados

1. **`src/managers/DebugManager.js`**
   - Agregado `usePlayerPNG` toggle

2. **`src/scenes/Boot.js`**
   - Carga del PNG con manejo de errores
   - Generación de placeholder siempre (como fallback)

3. **`src/prefabs/Player.js`**
   - Lógica para seleccionar textura según toggle y disponibilidad

4. **`src/scenes/Game.js`**
   - Sincronización del toggle con registry

### Flujo de Carga

```
Boot.preload()
  ↓
Carga 'player_png' (si existe, sin error si no)
  ↓
Boot.create()
  ↓
Lee toggle de DebugManager
  ↓
Genera placeholder 'player' (siempre)
  ↓
Game.create()
  ↓
Sincroniza toggle con registry
  ↓
Player constructor()
  ↓
Selecciona textura: 'player_png' o 'player'
```

---

## ✅ Ventajas

- ✅ **Sin errores si PNG no existe** - Fallback automático
- ✅ **Toggle fácil** - Un solo cambio en DebugManager
- ✅ **Compatible con cualquier tamaño** - El body se ajusta automáticamente
- ✅ **Solo para prueba visual** - Fácil de activar/desactivar

---

## 🚀 Próximos Pasos

Cuando tengas tu sprite sheet completo con animaciones:

1. Reemplaza el sistema de toggle con carga de sprite sheet
2. Configura las animaciones (idle, walk, jump, etc.)
3. El código de body de física seguirá funcionando automáticamente

**¡Listo para probar tu PNG!** 🎨

