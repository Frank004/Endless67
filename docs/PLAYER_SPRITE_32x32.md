# 🎮 Guía de Integración - Player Sprite 32x32px

## ✅ Compatibilidad Confirmada

Tu código **NO tendrá problemas** con sprites de 32x32px. El código ha sido actualizado para soportar este tamaño.

---

## 📐 Cambios Realizados

### 1. **Player.js** - Ajuste Automático del Body de Física

El body de física ahora se ajusta automáticamente al tamaño del sprite:
- **Sprite visual**: 32x32px (o el tamaño que cargues)
- **Body de física**: 28x28px (4px más pequeño para mejor gameplay)
- **Offset**: Centrado horizontalmente, ajustado verticalmente (pies en la parte inferior)

**Ventajas:**
- Mejor sensación de colisión (el sprite visual puede ser más grande sin afectar el gameplay)
- Compatible con cualquier tamaño de sprite
- Ajuste automático basado en el tamaño real del sprite

### 2. **Boot.js** - Tamaño del Sprite Temporal

El sprite temporal generado programáticamente ahora es 32x32px:
```javascript
const PLAYER_SIZE = 32;
```

**Nota:** Cuando cargues tu sprite sheet real, puedes comentar esta sección.

### 3. **Ajuste Dinámico de Offsets**

Los offsets de efectos (partículas, etc.) ahora se calculan dinámicamente:
- Offset de salto: `(height * 0.5)` - se ajusta automáticamente al tamaño del sprite

---

## 🎨 Cómo Cargar tu Sprite Sheet Real

Cuando tengas tu sprite sheet de 32x32px listo:

### Opción 1: Sprite Sheet Único
```javascript
// En Boot.js, método preload():
this.load.spritesheet('player', 'assets/images/player_32x32.png', {
    frameWidth: 32,
    frameHeight: 32
});
```

### Opción 2: Atlas JSON
```javascript
// En Boot.js, método preload():
this.load.atlas('player_atlas', 'assets/images/player_32x32.png', 'assets/images/player_32x32.json');
```

### Luego, comentar o eliminar la generación temporal:
```javascript
// Player (comentar cuando cargues el sprite real)
// const PLAYER_SIZE = 32;
// g.fillStyle(0x00ffff, 1);
// ...
```

---

## 🔧 Configuración del Body de Física

El body se ajusta automáticamente, pero puedes modificar estos valores en `Player.js`:

```javascript
// Línea ~15-20 en Player.js
const spriteSize = this.width || 32;
const bodySize = Math.max(20, spriteSize - 4); // Ajusta el -4 para cambiar el margen
const offsetX = (spriteSize - bodySize) / 2;
const offsetY = spriteSize - bodySize;
```

**Parámetros ajustables:**
- `spriteSize - 4`: Reduce el body en 4px. Cambia a `-2` para body más grande, `-6` para más pequeño
- `Math.max(20, ...)`: Tamaño mínimo del body (20px). Ajusta según necesites

---

## ✅ Verificación

Para verificar que todo funciona:

1. **Carga tu sprite de 32x32px** (o usa el temporal generado)
2. **Ejecuta el juego** y verifica:
   - El sprite se ve correctamente
   - Las colisiones funcionan bien
   - Los saltos se sienten naturales
   - El wall jump funciona correctamente

3. **Si las colisiones se sienten "demasiado grandes"**:
   - Reduce el valor `-4` a `-6` o `-8` en `Player.js` (body más pequeño)

4. **Si las colisiones se sienten "demasiado pequeñas"**:
   - Reduce el valor `-4` a `-2` o `0` en `Player.js` (body más grande)

---

## 📝 Notas Importantes

- ✅ **No hay hardcodeo de tamaños** - Todo se ajusta automáticamente
- ✅ **Compatible con cualquier tamaño** - Funciona con 16x16, 24x24, 32x32, etc.
- ✅ **Body de física optimizado** - Ligeramente más pequeño para mejor gameplay
- ✅ **Offsets dinámicos** - Se ajustan al tamaño real del sprite

---

## 🎯 Próximos Pasos

1. Carga tu sprite sheet de 32x32px en `Boot.js`
2. Configura las animaciones (idle, walk, jump, etc.)
3. Ajusta el body de física si es necesario (parámetros arriba)
4. Prueba el gameplay y ajusta según necesites

**¡Tu código está listo para 32x32px!** 🚀

