# 📁 Assets/Images

## Player Sprite

Coloca tu sprite PNG del player aquí:

**Archivo:** `player_32x32.png`
**Tamaño:** 32x32 píxeles
**Formato:** PNG con transparencia

### Uso

El juego cargará automáticamente este PNG si existe. Para activar/desactivar el uso del PNG:

1. Abre `src/managers/DebugManager.js`
2. Modifica la línea:
   ```javascript
   this.usePlayerPNG = true;  // true = usar PNG, false = usar placeholder generado
   ```

### Toggle

- **`usePlayerPNG = true`**: Usa el PNG si existe, sino usa placeholder generado
- **`usePlayerPNG = false`**: Siempre usa placeholder generado (ignora PNG)

---

**Nota:** Si el PNG no se encuentra, el juego usará automáticamente un placeholder generado programáticamente (cubo cian con borde blanco).

