# 📐 Dimensiones del Juego - Endless67

## 🖥️ Resoluciones de Pantalla

### Desktop
- **Ancho**: `360px`
- **Alto**: `640px`
- **Aspecto**: 9:16 (vertical)

### Mobile
- **Ancho**: `320px`
- **Alto**: `568px`
- **Aspecto**: ~9:16 (vertical)

### Tile Size Base
- **TILE_SIZE**: `32px` (unidad base para pixel art)

---

## 🎨 Recomendación para Arte/Assets

### ⚠️ IMPORTANTE: ¿Qué resolución usar para el arte?

**Respuesta: Usa Desktop (360x640) como base**

**Razones:**
1. **Más píxeles = Mejor calidad**: 360×640 tiene más píxeles que 320×568
2. **Escalado automático**: El juego usa `Phaser.Scale.FIT`, así que se escala proporcionalmente
3. **Mejor al reducir**: El arte se verá mejor cuando se reduzca en mobile que si se amplía
4. **Código dinámico**: El juego usa `cameras.main.width/height` que se adapta automáticamente

**Cómo funciona:**
- El juego detecta el dispositivo y usa la resolución apropiada
- El modo `FIT` mantiene el aspect ratio 9:16
- Si creas arte a 360×640, funcionará perfecto en ambas resoluciones
- En mobile se escalará automáticamente a 320×568 manteniendo proporciones

**Alternativa (si quieres optimizar):**
- Puedes crear assets a ambas resoluciones y cargar según el dispositivo
- Pero para simplicidad, **360×640 es la mejor opción**

---

## 📱 DPI y Resolución Física

### ⚠️ IMPORTANTE: DPI depende del tamaño físico de la pantalla

**360×640px NO tiene un DPI fijo** - El DPI depende del tamaño físico de la pantalla donde se muestra.

**Fórmula:**
```
DPI = Píxeles / Pulgadas físicas
```

### Ejemplos Prácticos:

#### Pantalla Desktop (Monitor 24" Full HD)
- Tamaño físico: ~20.5" × 11.5" (diagonal 24")
- Resolución lógica del juego: 360×640px
- **DPI aproximado**: ~96-120 DPI (estándar desktop)
- **Tamaño físico del juego**: ~3.75" × 6.67" (si se muestra a tamaño real)

#### iPhone (ejemplo iPhone 12/13)
- Tamaño físico: 2.53" × 5.78" (diagonal 6.1")
- Resolución física: 1170×2532px (@3x DPR)
- Resolución lógica: 390×844px
- **DPI aproximado**: ~460 DPI (Retina)
- El juego se escalaría a ~320×568px lógicos

#### Android (ejemplo Galaxy S21)
- Tamaño físico: 2.8" × 6.2" (diagonal 6.2")
- Resolución física: 1080×2400px (@3x DPR)
- Resolución lógica: 360×800px
- **DPI aproximado**: ~420 DPI
- El juego se escalaría a ~320×568px lógicos

### Cómo funciona en el juego:

1. **Resolución Lógica**: 360×640px (Desktop) o 320×568px (Mobile)
   - Esta es la resolución "virtual" del juego
   - No cambia según el DPI físico

2. **Device Pixel Ratio (DPR)**: 1, 2, o 3
   - El juego detecta `window.devicePixelRatio`
   - Usa `getHiDpiScale()` que limita a máximo 3x
   - Esto afecta la **calidad del renderizado**, no el tamaño lógico

3. **Renderizado Real**:
   - Desktop (DPR 1): Renderiza a 360×640px
   - Mobile Retina (DPR 2): Renderiza a 720×1280px (pero se muestra como 360×640px lógicos)
   - Mobile Super Retina (DPR 3): Renderiza a 1080×1920px (pero se muestra como 360×640px lógicos)

### Para el Arte de la Tienda:

**Crea tus assets a 360×640px a 72 DPI** (estándar web):
- Esto es una resolución lógica, no física
- El DPI en archivos de imagen es solo metadata
- Lo importante son los **píxeles**: 360×640px
- El juego se encargará del escalado según el dispositivo

**Si quieres máxima calidad para Retina:**
- Puedes crear assets a 720×1280px (2x) o 1080×1920px (3x)
- Pero el juego los escalará de vuelta a 360×640px lógicos
- Para pixel art, **360×640px es suficiente**

---

## 🎮 Layout del Juego

### Ad Banner
- **Altura**: `50px`
- **Posición**: Top (siempre visible)
- **Color de fondo**: `0x1a1a1a`
- **Sticky**: `true`

### Stage Floor
- **Altura**: `32px` (1 tile)
- **Color**: `0x4a4a4a`
- **Posición**: Bottom de la pantalla

### Área de Juego (Playable Area)
- **Ancho efectivo**: `360px` (Desktop) / `320px` (Mobile)
- **Alto efectivo**: `640px` (Desktop) / `568px` (Mobile)
- **Margen desde paredes**: `28px` (para generación de nivel)
- **Margen para plataformas móviles**: `50px`

### Paredes Laterales
- **Ancho**: `32px` cada pared
- **Altura**: `1200px` (TileSprite)
- **Profundidad (Depth)**: `60`

---

## 🔘 Botones

### Ancho por Defecto
- **DEFAULT_BUTTON_WIDTH**: `260px`

### Botones de Texto (Text Buttons)
- **Padding X**: `20px`
- **Padding Y**: `10px`
- **Ancho mínimo**: `260px` (o ancho natural del texto + padding)
- **Alto**: Altura del texto + `20px` (padding Y × 2)
- **Fondo**: Rectángulo `0x333333`
- **Stroke del texto**: `#000000` con grosor `4px`
- **Font**: `Pixelify Sans`

### Botones con Icono (Icon Buttons)
- **Padding X**: `20px`
- **Padding Y**: `10px`
- **Ancho mínimo**: `260px` (o ancho natural: icono + texto + padding)
- **Alto**: Máximo entre altura del icono y altura del texto + `20px` (padding Y × 2)
- **Escala del icono**: `0.5` (por defecto)
- **Espaciado entre icono y texto**: `10px`
- **Fondo**: Rectángulo `0x333333`

### Tamaños de Texto en Botones
- **Pequeño**: `16px` (usado en Store para botones de acción)
- **Mediano**: `20px` (usado en Store para botón BACK)
- **Estándar**: `24px` (por defecto en UIHelpers)
- **Grande**: `28px` (usado en MainMenu)
- **Extra Grande**: `32px` (usado en títulos)

### Separación entre Botones

#### MainMenu
- **Separación vertical**: `80px` entre botones
- **Posición inicial**: `height / 2` (centro vertical)
- **Botones**:
  - START GAME: `height / 2`
  - LEADERBOARD: `height / 2 + 80`
  - STORE: `height / 2 + 160`
  - SETTINGS: `height / 2 + 240`

#### PauseMenu
- **Separación vertical**: `70px` entre botones
- **Posición inicial**: `280px` desde arriba
- **Botones**:
  - CONTINUE: `280px`
  - SOUND: `350px` (280 + 70)
  - JOYSTICK: `420px` (350 + 70)
  - EXIT TO MENU: `490px` (420 + 70)

#### Store (SkinStoreScene)
- **Botón BACK**: `height - 40px` (40px desde abajo)
- **Separación entre cards de skins**: `12px` (gapY)

---

## 📝 Textos

### Tamaños de Fuente (UI.FONTS.SIZE)
- **SMALL**: `16px`
- **MEDIUM**: `24px`
- **LARGE**: `32px`
- **XLARGE**: `48px`

### Fuentes
- **Principal**: `Arial` (para textos generales)
- **Botones**: `Pixelify Sans` (para todos los botones)

### Stroke (Contorno)
- **Grosor estándar**: `4px` (botones principales)
- **Grosor medio**: `3px` (textos secundarios)
- **Grosor pequeño**: `2px` (textos pequeños)
- **Color**: `#000000` (negro)

### Colores de Texto (UI.COLORS)
- **PRIMARY**: `#00ff00` (verde)
- **SECONDARY**: `#ffff00` (amarillo)
- **DANGER**: `#ff0000` (rojo)
- **WHITE**: `#ffffff` (blanco)
- **BLACK**: `#000000` (negro)

### Padding General
- **UI.PADDING**: `20px`

---

## 🏪 Store (SkinStoreScene)

### Dimensiones de la Escena
- **Ancho**: `400px` (en Phaser Editor)
- **Alto**: `600px` (en Phaser Editor)
- **Color de fondo**: `0x050505`

### Título
- **Texto**: "SKIN STORE"
- **Posición Y**: `60px` desde arriba
- **Tamaño de fuente**: `26px`
- **Color**: `#ffffff`
- **Stroke**: `4px` negro

### Contador de Monedas
- **Posición**: `width - 20px, 20px` (esquina superior derecha)
- **Tamaño de fuente**: `18px`
- **Color**: `#ffff00` (amarillo)
- **Stroke**: `3px` negro
- **Origen**: `(1, 0)` (alineado a la derecha)

### Cards de Skins
- **Ancho**: `width - 40px` (margen de 20px a cada lado)
- **Alto**: `110px` por card
- **Posición inicial Y**: `130px` desde arriba
- **Separación vertical (gapY)**: `12px` entre cards
- **Fondo**: Rectángulo `0x111111`
- **Borde**: Stroke `2px`, color `0x2a2a2a`

#### Textos dentro de las Cards
- **Nombre del Skin**:
  - Posición: `-cardWidth / 2 + 20, -30` (izquierda, arriba)
  - Tamaño: `20px`
  - Color: `#ffffff`
  - Stroke: `3px` negro

- **Rareza (Rarity)**:
  - Posición: `-cardWidth / 2 + 20, 0` (izquierda, centro)
  - Tamaño: `14px`
  - Color: Variable según rareza
  - Stroke: `2px` negro

- **Precio**:
  - Posición: `-cardWidth / 2 + 20, 30` (izquierda, abajo)
  - Tamaño: `14px`
  - Color: `#cccccc`
  - Stroke: `2px` negro

#### Botón de Acción en Cards
- **Ancho**: `140px`
- **Posición X**: `cardWidth / 2 - 80` (derecha de la card)
- **Posición Y**: `0` (centro vertical de la card)
- **Tamaño de fuente**: `16px`
- **Texto**: "EQUIPPED" / "EQUIP" / "BUY"

### Toast (Mensajes)
- **Posición Y**: `height - 90px` (90px desde abajo)
- **Tamaño de fuente**: `16px`
- **Color**: `#ffffff`
- **Stroke**: `3px` negro
- **Duración de animación**: `1200ms` (fade out después de 900ms)

### Botón BACK
- **Posición Y**: `height - 40px` (40px desde abajo)
- **Tamaño de fuente**: `20px`
- **Color**: `#ffffff`
- **Ancho**: `260px` (por defecto)

### Colores de Rareza
- **Common**: `#a0a0a0` (gris)
- **Rare**: `#4aa3ff` (azul)
- **Epic**: `#ff7ad9` (rosa/magenta)
- **Legendary**: `#ffd700` (dorado)

---

## 🎯 MainMenu

### Logo
- **Posición Y**: `120px` desde arriba
- **Escala**: `0.28`

### Versión
- **Posición Y**: `height - 30px` (30px desde abajo)
- **Tamaño de fuente**: `14px`
- **Color**: `#444`
- **Área táctil invisible**: `300px × 120px` (para activar Dev Mode)

---

## ⏸️ PauseMenu

### Botón de Pausa (Icono)
- **Posición**: `width - 16px, 40px + adBannerHeight` (esquina superior derecha)
- **Tamaño del círculo de fondo**: Radio `16px`
- **Escala del icono**: `0.375`
- **Profundidad**: `200-201`

### Título del Menú
- **Posición Y**: `180px` desde arriba
- **Tamaño de fuente**: `48px`
- **Color**: `#ffd700` (dorado)
- **Font Style**: `bold`

### Texto de Versión
- **Posición Y**: `220px` desde arriba
- **Tamaño de fuente**: `14px`
- **Color**: `#888888`

### Overlay de Fondo
- **Color**: `0x000000` (negro)
- **Alpha**: `0.9` (90% opaco)
- **Cubre**: Toda la pantalla

---

## 📊 Resumen de Espaciados

### Separaciones Verticales Principales
- **Entre botones en MainMenu**: `80px`
- **Entre botones en PauseMenu**: `70px`
- **Entre cards en Store**: `12px`
- **Padding estándar de botones**: `20px` (X) × `10px` (Y)

### Márgenes y Padding
- **UI.PADDING general**: `20px`
- **Margen desde paredes**: `28px`
- **Margen para plataformas móviles**: `50px`
- **Margen lateral en Store cards**: `20px` (cada lado)

---

## 🎨 Profundidad (Depth/Z-Index)

### Capas de Renderizado
- **Background**: `-100` (TileSprite base)
- **Wall Decorations**: `-98` a `-50`
- **Fog Effect**: `9`
- **Gameplay**: `10-20`
- **Pause Button**: `200-201`
- **UI Overlays**: `201+`

---

**Última actualización**: v0.0.43
**Incluye**: Store (SkinStoreScene) completo
