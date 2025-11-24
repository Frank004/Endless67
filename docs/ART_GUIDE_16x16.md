# 🎨 Guía de Arte - Migración a Pixel Art 16x16
## ENDLESS67 - Especificaciones de Sprites

---

## 📋 Índice
1. [Personaje Principal (Player)](#1-personaje-principal-player)
2. [Enemigos](#2-enemigos)
3. [Items y Powerups](#3-items-y-powerups)
4. [Entorno y Plataformas](#4-entorno-y-plataformas)
5. [Efectos y Partículas](#5-efectos-y-partículas)
6. [UI Elements](#6-ui-elements)
7. [Especificaciones Técnicas](#7-especificaciones-técnicas)

---

## 1. Personaje Principal (Player)

### 📐 Dimensiones Base
- **Tamaño del sprite**: 16x16 píxeles
- **Color de referencia**: Personaje con cabello castaño claro, sudadera gris, pantalones azules, zapatos marrones

### 🎬 Animaciones Requeridas

#### 1.1. **Idle (Reposo)**
- **Cantidad**: 2-3 frames
- **Descripción**: Personaje parado, respiración sutil
- **Uso**: Cuando el jugador no se mueve
- **Referencia**: Frame 1 del sprite sheet mostrado

#### 1.2. **Walking (Caminando)**
- **Cantidad**: 3-4 frames
- **Descripción**: Animación de caminata suave
- **Uso**: Movimiento horizontal lento
- **Referencia**: Frames 1-3 del sprite sheet (top row)

#### 1.3. **Running (Corriendo)**
- **Cantidad**: 4-6 frames
- **Descripción**: Animación de carrera rápida
- **Uso**: Movimiento horizontal rápido
- **Referencia**: Frames 6-8 del sprite sheet (top row)
- **Nota**: Boca abierta, brazos balanceándose

#### 1.4. **Jump (Salto Normal)**
- **Cantidad**: 2-3 frames
- **Descripción**: 
  - Frame 1: Preparación (crouch leve)
  - Frame 2: Despegue (brazos arriba)
  - Frame 3: En el aire (opcional, para salto sostenido)
- **Uso**: Primer salto desde el suelo
- **Referencia**: Basado en poses de salto del sprite sheet

#### 1.5. **Double Jump (Doble Salto)**
- **Cantidad**: 1-2 frames
- **Descripción**: Salto en el aire con pose más dinámica
- **Uso**: Segundo y tercer salto (máximo 3 saltos)
- **Nota**: Se combina con animación de front flip (rotación 360°)

#### 1.6. **Wall Jump (Salto de Pared)**
- **Cantidad**: 2 frames (izquierda y derecha)
- **Descripción**: 
  - Frame izquierda: Agarrándose a la pared izquierda, mirando a la derecha
  - Frame derecha: Agarrándose a la pared derecha, mirando a la izquierda
- **Uso**: Cuando el jugador toca una pared lateral
- **Referencia**: Frames 4-5 del sprite sheet (climbing poses)
- **Nota**: Puede usar el mismo frame pero con flip horizontal

#### 1.7. **Wall Cling (Agarre de Pared)**
- **Cantidad**: 1-2 frames (izquierda y derecha)
- **Descripción**: Personaje agarrado a la pared, deslizándose
- **Uso**: Cuando el jugador está tocando la pared y cayendo
- **Referencia**: Similar a wall jump pero más estático

#### 1.8. **Landing (Aterrizaje)**
- **Cantidad**: 2 frames
- **Descripción**: 
  - Frame 1: Impacto (crouch)
  - Frame 2: Recuperación (volver a idle)
- **Uso**: Al tocar una plataforma después de saltar

#### 1.9. **Powerup State (Estado de Powerup)**
- **Cantidad**: 4-5 frames (secuencia de transformación)
- **Descripción**: 
  - Frame 1: Estado normal
  - Frame 2: Inicio de transformación (aura inicial)
  - Frame 3: Transformación media (aura más intensa)
  - Frame 4: Estado completo (aura máxima, ojos brillantes)
  - Frame 5: Idle con powerup (opcional, para mantener el estado)
- **Uso**: Cuando el jugador recoge el powerup "67"
- **Referencia**: Secuencia completa del sprite sheet de powerup
- **Efectos visuales**: 
  - Aura dorada/amarilla alrededor del personaje
  - Ojos brillantes/blancos
  - Cabello más voluminoso/espiky
  - Partículas de energía

#### 1.10. **Take Damage (Recibir Daño)**
- **Cantidad**: 2-3 frames
- **Descripción**: 
  - Frame 1: Impacto (expresión de dolor, boca abierta)
  - Frame 2: Retroceso (cuerpo hacia atrás)
  - Frame 3: Recuperación (opcional)
- **Uso**: Cuando el jugador es golpeado por enemigo o proyectil
- **Referencia**: Frame 1 del sprite sheet de daño
- **Efectos visuales**: 
  - Tint rojo (0xff0000) aplicado por código
  - Partículas de impacto
  - Líneas de "shock" alrededor del personaje

#### 1.11. **Stunned (Aturdido)**
- **Cantidad**: 1-2 frames
- **Descripción**: Personaje con signos de "+" sobre la cabeza, expresión confusa
- **Uso**: Estado de aturdimiento (si se implementa)
- **Referencia**: Frame 2 del sprite sheet de daño

#### 1.12. **Death/Game Over (Muerte)**
- **Cantidad**: 2-3 frames
- **Descripción**: 
  - Frame 1: Caída en lava (expresión de shock)
  - Frame 2: Quemándose (tint negro aplicado por código)
  - Frame 3: Desaparición (opcional)
- **Uso**: Cuando el jugador toca la lava
- **Referencia**: Frame 3 del sprite sheet de daño
- **Efectos visuales**: 
  - Tint negro (0x000000) aplicado por código
  - Partículas de fuego
  - Desvanecimiento

#### 1.13. **Celebration (Celebración - Número 67)**
- **Cantidad**: 3-4 frames
- **Descripción**: Personaje celebrando con los números "6" y "7" en las manos
- **Uso**: Cuando el jugador alcanza 67 monedas o múltiplos
- **Referencia**: Frames 4-6 del sprite sheet (bust shots con números)
- **Variaciones**: 
  - Con "6" y "7" juntos
  - Solo con "7"
  - Diferentes tamaños de números (pequeño, mediano, grande)

### 📊 Resumen Player
- **Total de frames**: ~35-45 frames
- **Orientaciones**: 
  - Facing right (derecha) - principal
  - Facing left (izquierda) - puede usar flip horizontal para la mayoría
  - Excepciones: Wall jump/cling necesitan frames específicos

---

## 2. Enemigos

### 2.1. **Patrol Enemy (Enemigo Patrullero / Spike)**
- **Tamaño**: 16x16 píxeles
- **Cantidad**: 2-3 frames (walking animation)
- **Descripción**: Enemigo que patrulla plataformas
- **Color actual**: Rojo (0xff0000)
- **Animaciones**:
  - Walking left: 2-3 frames
  - Walking right: Usar flip horizontal
  - Idle: 1 frame (opcional)

### 2.2. **Shooter Enemy (Enemigo Disparador)**
- **Tamaño**: 16x16 píxeles
- **Cantidad**: 2-3 frames
- **Descripción**: Enemigo estático que dispara proyectiles
- **Color actual**: Naranja (0xff8800)
- **Animaciones**:
  - Idle: 1-2 frames
  - Shooting: 2 frames (recoil effect)
  - **Nota**: Tiene efecto de scaleX (0.9) cuando dispara

### 2.3. **Jumper Shooter Enemy (Enemigo Saltador Disparador)**
- **Tamaño**: 16x16 píxeles
- **Cantidad**: 3-4 frames
- **Descripción**: Enemigo que salta y dispara
- **Color actual**: Púrpura (0x9900ff)
- **Animaciones**:
  - Idle: 1 frame
  - Jumping: 2-3 frames (ascenso, pico, descenso)
  - Shooting: Similar a Shooter Enemy

### 📊 Resumen Enemigos
- **Total de frames**: ~10-15 frames

---

## 3. Items y Powerups

### 3.1. **Coin (Moneda)**
- **Tamaño**: 16x16 píxeles
- **Cantidad**: 4-6 frames (rotación/spin)
- **Descripción**: Moneda dorada que rota
- **Color actual**: Dorado (0xffd700)
- **Animación**: Rotación 360° continua
- **Referencia**: Puede ser un círculo simple con efecto de brillo

### 3.2. **Powerup Ball (Powerup 67)**
- **Tamaño**: 16x16 píxeles (o 24x24 para destacar)
- **Cantidad**: 4-5 frames (secuencia de aparición)
- **Descripción**: Powerup con símbolo "67" o cruz
- **Color actual**: Naranja (0xff6600) con borde negro
- **Animaciones**:
  - Spawn: 2-3 frames (pop-in effect)
  - Idle: 1-2 frames (pulsación leve)
  - Collect: 2 frames (explosión/desaparición)
- **Referencia**: Basado en el powerup del sprite sheet

### 📊 Resumen Items
- **Total de frames**: ~10-12 frames

---

## 4. Entorno y Plataformas

**⚠️ IMPORTANTE: Todos los elementos de entorno deben ser tiles modulares de 16x16 píxeles**

### 4.1. **Platform Tiles (Plataformas)**
- **Tamaño base**: 16x16 píxeles por tile
- **Sistema modular**: Las plataformas se construyen combinando tiles

#### 4.1.1. **Platform Static (Plataforma Estática)**
- **Tiles requeridos**:
  - `platform_static_left_cap.png` - Extremo izquierdo
  - `platform_static_mid.png` - Sección central (repetible)
  - `platform_static_right_cap.png` - Extremo derecho
- **Cantidad**: 3 tiles base
- **Descripción**: Plataforma rosa/magenta
- **Color actual**: Rosa (0xff00aa)
- **Uso**: Plataformas estáticas horizontales

#### 4.1.2. **Platform Moving (Plataforma Móvil)**
- **Tiles requeridos**:
  - `platform_moving_left_cap.png` - Extremo izquierdo
  - `platform_moving_mid.png` - Sección central (repetible)
  - `platform_moving_right_cap.png` - Extremo derecho
- **Cantidad**: 3 tiles base
- **Descripción**: Plataforma azul que se mueve horizontalmente
- **Color actual**: Azul (0x0088ff) con borde blanco
- **Nota**: Visualmente diferente a la estática para distinguir

#### 4.1.3. **Platform Variants por Entorno**
Cada entorno puede tener sus propias variantes de plataformas:

**Bosque Flotante:**
- `platform_forest_left_cap.png`
- `platform_forest_mid.png`
- `platform_forest_right_cap.png`
- **Decoración opcional**: Tiles de hierba/ramas que se pueden superponer

**Granja:**
- `platform_barn_left_cap.png`
- `platform_barn_mid.png`
- `platform_barn_right_cap.png`
- **Decoración opcional**: Tiles de heno/paja

**Montaña:**
- `platform_rock_left_cap.png`
- `platform_rock_mid.png`
- `platform_rock_right_cap.png`
- **Decoración opcional**: Tiles de pinchos rocosos

**Selva:**
- `platform_jungle_left_cap.png`
- `platform_jungle_mid.png`
- `platform_jungle_right_cap.png`
- **Decoración opcional**: Tiles de musgo/hojas

### 4.2. **Wall Tiles (Paredes Laterales)**
- **Tamaño base**: 16x16 píxeles por tile
- **Sistema modular**: Las paredes se construyen verticalmente con tiles

#### 4.2.1. **Wall Tiles Base (por Entorno)**
Cada entorno tiene su propio set de paredes:

**Bosque (Troncos de Árbol):**
- `wall_forest_top.png` - Parte superior del tronco
- `wall_forest_mid.png` - Sección media (repetible verticalmente)
- `wall_forest_bottom.png` - Parte inferior del tronco
- **Cantidad**: 3 tiles base
- **Descripción**: Troncos marrones con textura de corteza
- **Nota**: Debe ser tileable verticalmente sin costuras visibles

**Granja (Paredes de Granero):**
- `wall_barn_top.png` - Parte superior
- `wall_barn_mid.png` - Sección media (repetible)
- `wall_barn_bottom.png` - Parte inferior
- **Cantidad**: 3 tiles base
- **Descripción**: Tablones rojos verticales
- **Variaciones opcionales**: 
  - `wall_barn_door.png` - Tile con puerta (para variación)
  - `wall_barn_window.png` - Tile con ventana (opcional)

**Montaña (Rocas):**
- `wall_mountain_top.png` - Parte superior rocosa
- `wall_mountain_mid.png` - Sección media (repetible)
- `wall_mountain_bottom.png` - Parte inferior rocosa
- **Cantidad**: 3 tiles base
- **Descripción**: Formaciones rocosas grises con textura rugosa

**Selva (Troncos con Enredaderas):**
- `wall_jungle_top.png` - Parte superior
- `wall_jungle_mid.png` - Sección media (repetible)
- `wall_jungle_bottom.png` - Parte inferior
- **Cantidad**: 3 tiles base
- **Descripción**: Troncos marrones con enredaderas verdes
- **Decoración opcional**: Tiles de follaje que se pueden superponer

### 4.3. **Floor Tiles (Suelos)**
- **Tamaño base**: 16x16 píxeles por tile
- **Sistema modular**: Los suelos se construyen horizontalmente

#### 4.3.1. **Floor Tiles por Entorno**

**Bosque:**
- `floor_forest_grass.png` - Hierba verde (tile repetible)
- `floor_forest_grass_left.png` - Borde izquierdo (opcional)
- `floor_forest_grass_right.png` - Borde derecho (opcional)
- **Cantidad**: 1-3 tiles
- **Descripción**: Hierba verde exuberante

**Granja:**
- `floor_barn_grass.png` - Hierba verde (tile repetible)
- `floor_barn_dirt_path.png` - Camino de tierra (tile repetible)
- `floor_barn_grass_to_dirt.png` - Transición hierba-tierra (opcional)
- `floor_barn_dirt_to_grass.png` - Transición tierra-hierba (opcional)
- **Cantidad**: 2-4 tiles
- **Descripción**: Hierba con camino de tierra

**Montaña:**
- `floor_mountain_rock.png` - Terreno rocoso (tile repetible)
- `floor_mountain_rock_left.png` - Borde izquierdo (opcional)
- `floor_mountain_rock_right.png` - Borde derecho (opcional)
- **Cantidad**: 1-3 tiles
- **Descripción**: Terreno rocoso e irregular

**Selva:**
- `floor_jungle_ground.png` - Suelo de jungla (tile repetible)
- `floor_jungle_leaves.png` - Hojas grandes (tile decorativo, opcional)
- `floor_jungle_flowers.png` - Flores rosadas (tile decorativo, opcional)
- **Cantidad**: 1-3 tiles
- **Descripción**: Suelo de jungla con vegetación

### 4.4. **Maze Block Tiles (Bloques de Laberinto)**
- **Tamaño base**: 16x16 píxeles por tile
- **Sistema modular**: Los bloques se construyen con tiles modulares

#### 4.4.1. **Maze Block Tiles**
- **Tiles requeridos**:
  - `maze_block_corner_top_left.png` - Esquina superior izquierda
  - `maze_block_corner_top_right.png` - Esquina superior derecha
  - `maze_block_corner_bottom_left.png` - Esquina inferior izquierda
  - `maze_block_corner_bottom_right.png` - Esquina inferior derecha
  - `maze_block_edge_top.png` - Borde superior (repetible)
  - `maze_block_edge_bottom.png` - Borde inferior (repetible)
  - `maze_block_edge_left.png` - Borde izquierdo (repetible)
  - `maze_block_edge_right.png` - Borde derecho (repetible)
  - `maze_block_mid.png` - Centro (repetible)
- **Cantidad**: 9 tiles base
- **Descripción**: Bloques que forman laberintos
- **Color actual**: Gris muy oscuro (0x222222) con borde (0x444444)
- **Nota**: Permite construir bloques de cualquier tamaño de forma modular

### 4.5. **Background Elements (Elementos de Fondo)**
- **Tamaño base**: 16x16 píxeles por tile (o múltiplos para elementos grandes)
- **Sistema**: Tiles repetibles o sprites de fondo más grandes

#### 4.5.1. **Sky Tiles (Cielo)**
- **Tiles requeridos**:
  - `bg_sky_top.png` - Parte superior del cielo (16x16 o 16x32)
  - `bg_sky_mid.png` - Sección media del cielo (repetible verticalmente)
  - `bg_sky_bottom.png` - Parte inferior del cielo (transición a horizonte)
- **Cantidad**: 3 tiles base
- **Descripción**: Gradiente de azul claro a verde amarillento
- **Variaciones por entorno**:
  - `bg_sky_forest.png` - Cielo azul claro con nubes blancas
  - `bg_sky_barn.png` - Cielo azul con nubes gris-púrpura
  - `bg_sky_mountain.png` - Cielo dramático naranja/amarillo/púrpura
  - `bg_sky_jungle.png` - Cielo degradado azul a verde

#### 4.5.2. **Cloud Tiles (Nubes)**
- **Tiles requeridos**:
  - `bg_cloud_small.png` - Nube pequeña (16x16 o 32x16)
  - `bg_cloud_medium.png` - Nube mediana (32x16 o 48x16)
  - `bg_cloud_large.png` - Nube grande (48x16 o 64x16)
- **Cantidad**: 3-6 variaciones
- **Descripción**: Nubes pixel art para decoración de fondo
- **Nota**: Se pueden superponer sobre el cielo

#### 4.5.3. **Mountain/Background Tiles (Montañas y Elementos de Fondo)**
- **Tiles requeridos** (por entorno):

**Bosque:**
- `bg_forest_foliage.png` - Follaje verde denso (tile repetible)
- `bg_forest_trees.png` - Árboles de fondo (sprites más grandes, opcional)

**Granja:**
- `bg_barn_building.png` - Granero rojo (sprite grande, 64x64 o más)
- `bg_barn_fence.png` - Valla blanca (tile repetible)
- `bg_barn_water_tower.png` - Torre de agua (sprite grande, opcional)
- `bg_barn_field.png` - Campo verde (tile repetible)

**Montaña:**
- `bg_mountain_silhouette.png` - Silueta de montaña grande (sprite grande)
- `bg_mountain_pines.png` - Pinos (tiles o sprites medianos)

**Selva:**
- `bg_jungle_vegetation.png` - Vegetación densa (tile repetible)
- `bg_jungle_trees.png` - Árboles de jungla (sprites grandes, opcional)

- **Cantidad**: 2-4 elementos por entorno
- **Descripción**: Elementos de fondo para crear profundidad
- **Nota**: Algunos elementos pueden ser sprites más grandes que 16x16 para mejor detalle

### 4.6. **Lava Texture (Textura de Lava)**
- **Estado**: ✅ Ya implementada - Se mantendrá la textura actual con pixelación procedural
- **Tamaño actual**: 400x800 píxeles (tile repetible)
- **Descripción**: Lava animada con burbujas y ondas
- **Color actual**: Rojo oscuro (0xcc2200) con naranja (0xff6600)
- **Implementación actual**: 
  - Textura generada programáticamente en `Boot.js`
  - Se anima con `tilePositionY` para efecto de movimiento
  - Pipeline de Phaser (`LavaPipeline`) para efecto de olas (heat haze/wobble)
- **Mejora propuesta - Pixelación Procedural**: 
  - **Extender el shader actual** (`LavaPipeline`) para agregar pixelación procedural
  - Combinar el efecto de olas actual con un efecto de pixelación (downsampling)
  - El shader aplicará pixelación basada en una cuadrícula de 16x16 (o configurable)
  - Mantener la animación y efectos actuales, solo cambiar el estilo visual a pixel art
  - **Ventajas**: 
    - No requiere crear tiles modulares de lava
    - Mantiene la animación fluida y efectos actuales
    - Permite combinar ambos estilos (lava procedural + pixel art)
    - Fácil de ajustar el nivel de pixelación
- **Implementación técnica sugerida**:
  ```glsl
  // En el fragment shader, después del efecto de olas:
  // 1. Aplicar pixelación: redondear UV a cuadrícula de 16x16
  vec2 pixelSize = vec2(16.0 / textureSize.x, 16.0 / textureSize.y);
  vec2 pixelatedUV = floor(uv / pixelSize) * pixelSize;
  
  // 2. Aplicar el efecto de olas al UV pixelado
  float waveX = sin(pixelatedUV.y * 20.0 + uTime * 2.0) * 0.005;
  float waveY = cos(pixelatedUV.x * 20.0 + uTime * 3.0) * 0.005;
  vec2 distortedUV = pixelatedUV + vec2(waveX, waveY);
  
  // 3. Muestrear la textura
  gl_FragColor = texture2D(uMainSampler, distortedUV);
  ```
- **Parámetros configurables**:
  - `pixelSize`: Tamaño de los "píxeles" en píxeles de pantalla (8.0, 16.0, etc.)
  - `waveIntensity`: Intensidad del efecto de olas
  - `waveSpeed`: Velocidad de las olas
- **⚠️ IMPORTANTE - Diferencia entre Pixelación del Shader y Tamaño de Sprites**:
  - **Pixelación del shader** (`pixelSize: 8.0`): Se refiere a **píxeles de pantalla/resolución**, no a píxeles de sprite
  - **Sprites 16x16**: Se refiere al **tamaño base de los assets de arte** (personaje, enemigos, plataformas, etc.)
  - **No hay conflicto**: Son conceptos independientes
  - **Resolución del juego**: 400x600 píxeles (base), puede variar en móvil
  - **Por qué 8.0 para la lava**: 
    - La lava es procedural y necesita más detalle para mantener las burbujas y ondas visibles
    - Con 16.0 se pierde demasiado detalle de la textura procedural
    - Con 8.0 se mantiene el detalle mientras se logra el look pixel art
    - Los sprites del juego (16x16) se verán bien independientemente de la pixelación de la lava
  - **Recomendación**: Usar `pixelSize: 8.0` para la lava es perfecto, no afecta los sprites 16x16 del resto del juego
- **Nota**: No se requieren tiles modulares de lava, se usará la implementación actual con shader de pixelación procedural. Esto permite combinar el estilo procedural actual con el look pixel art.

### 📊 Resumen Entorno
- **Total de tiles base**: ~45-65 tiles modulares
  - **Platforms**: 3 tiles base × 4 entornos = 12 tiles (más variantes)
  - **Walls**: 3 tiles base × 4 entornos = 12 tiles
  - **Floors**: 2-4 tiles × 4 entornos = 8-16 tiles
  - **Maze Blocks**: 9 tiles modulares
  - **Background**: 3-6 tiles × 4 entornos = 12-24 tiles
  - **Lava**: ✅ Ya implementada (se usará shader de pixelación)
  - **Decoraciones opcionales**: ~10-15 tiles adicionales

---

## 5. Efectos y Partículas

### 5.1. **Projectile (Proyectil)**
- **Tamaño**: 8x8 o 12x12 píxeles
- **Cantidad**: 1-2 frames (opcional: rotación)
- **Descripción**: Bola roja que disparan los enemigos
- **Color actual**: Rojo brillante (0xff0000)
- **Nota**: Círculo simple, puede tener trail effect

### 5.2. **Particle Dust (Polvo)**
- **Tamaño**: 6x6 píxeles
- **Cantidad**: 1-2 frames
- **Descripción**: Partícula blanca/gris para aterrizajes
- **Color actual**: Blanco (0xffffff)

### 5.3. **Particle Spark (Chispa)**
- **Tamaño**: 6x6 píxeles
- **Cantidad**: 1-2 frames
- **Descripción**: Chispa amarilla para wall jumps
- **Color actual**: Amarillo (0xffff00)

### 5.4. **Particle Burn (Quemadura)**
- **Tamaño**: 8x8 píxeles
- **Cantidad**: 2-3 frames
- **Descripción**: Partícula naranja/roja para muerte en lava
- **Color actual**: Naranja rojizo (0xff4400)

### 5.5. **Particle Aura (Aura de Powerup)**
- **Tamaño**: 8x8 píxeles
- **Cantidad**: 2-3 frames (pulsación)
- **Descripción**: Partícula dorada para el aura del powerup
- **Color actual**: Dorado (0xffdd00)

### 5.6. **Confetti (Confeti)**
- **Tamaño**: 8x8 píxeles
- **Cantidad**: 4-6 variaciones de color
- **Descripción**: Partículas de celebración
- **Color actual**: Blanco (0xffffff)
- **Variaciones**: Múltiples colores (rojo, azul, verde, amarillo, etc.)

### 📊 Resumen Partículas
- **Total de frames**: ~15-20 frames/variaciones
- **Nota**: Las partículas actuales ya están implementadas y funcionando. Se pueden mejorar visualmente con pixel art 16x16 si se desea.

---

## 6. HUD y UI Elements (Pixel Art 16x16)

**⚠️ NOTA**: Los elementos de joystick (base, knob) y jump feedback ya están implementados y funcionando. Esta sección se enfoca en elementos de HUD, botones, iconos y textos diseñados en pixel art.

### 6.1. **HUD Elements (Durante el Juego)**

#### 6.1.1. **Score Display (Display de Puntuación)**
- **Tamaño**: Variable (texto pixel art)
- **Cantidad**: 1 sprite de fondo + números
- **Descripción**: Panel o fondo para mostrar "SCORE: X"
- **Elementos**:
  - `hud_score_panel.png` - Panel de fondo (opcional, 64x32 o similar)
  - `hud_text_score.png` - Texto "SCORE:" en pixel art (opcional, si no se usa fuente)
- **Color**: Dorado (#ffd700) para el texto
- **Uso**: Esquina superior izquierda durante el juego

#### 6.1.2. **Height Display (Display de Altura)**
- **Tamaño**: Variable (texto pixel art)
- **Cantidad**: 1 sprite de fondo + números
- **Descripción**: Panel o fondo para mostrar "ALTURA: Xm"
- **Elementos**:
  - `hud_height_panel.png` - Panel de fondo (opcional)
  - `hud_text_height.png` - Texto "ALTURA:" en pixel art (opcional)
- **Color**: Blanco (#ffffff) para el texto
- **Uso**: Debajo del score durante el juego

#### 6.1.3. **Pause Button Icon (Icono de Pausa)**
- **Tamaño**: 16x16 o 24x24 píxeles
- **Cantidad**: 2 frames (pause, play)
- **Descripción**: Icono de pausa/play en pixel art
- **Elementos**:
  - `ui_icon_pause.png` - Icono de pausa (⏸)
  - `ui_icon_play.png` - Icono de play (▶)
- **Color**: Blanco (#ffffff)
- **Uso**: Esquina superior derecha durante el juego

#### 6.1.4. **Start Prompt (Prompt de Inicio)**
- **Tamaño**: Variable (texto pixel art)
- **Cantidad**: 1-2 frames (animación opcional)
- **Descripción**: Texto "¡SUBE!" o similar al inicio
- **Elementos**:
  - `hud_text_start.png` - Texto "¡SUBE!" en pixel art
- **Color**: Cyan (#00ffff)
- **Uso**: Centro de pantalla al inicio del juego

### 6.2. **Menu Buttons (Botones de Menú)**

#### 6.2.1. **Button Base (Base de Botón)**
- **Tamaño**: Modular (mínimo 128x48 píxeles, construido con tiles)
- **Sistema**: Tiles modulares de 16x16
- **Tiles requeridos**:
  - `button_left_cap.png` - Extremo izquierdo
  - `button_mid.png` - Sección central (repetible)
  - `button_right_cap.png` - Extremo derecho
- **Cantidad**: 3 tiles base
- **Descripción**: Base genérica para todos los botones
- **Color**: Gris oscuro (#333333) con borde
- **Estados**:
  - Normal
  - Hover (opcional, cambio de color)
  - Pressed (opcional)

#### 6.2.2. **Button Variants (Variantes de Botones)**
Cada tipo de botón puede tener su propia variante de color:

- `button_green_left_cap.png`, `button_green_mid.png`, `button_green_right_cap.png` - Botón verde (START GAME, CONTINUAR)
- `button_cyan_left_cap.png`, `button_cyan_mid.png`, `button_cyan_right_cap.png` - Botón cyan (LEADERBOARD)
- `button_white_left_cap.png`, `button_white_mid.png`, `button_white_right_cap.png` - Botón blanco (SETTINGS)
- `button_red_left_cap.png`, `button_red_mid.png`, `button_red_right_cap.png` - Botón rojo (SALIR, DEV MODE)

#### 6.2.3. **Button Text (Texto de Botones)**
- **Tamaño**: Variable (texto pixel art)
- **Cantidad**: Sprites de texto para cada botón
- **Elementos**:
  - `ui_text_start_game.png` - "START GAME"
  - `ui_text_leaderboard.png` - "LEADERBOARD"
  - `ui_text_settings.png` - "SETTINGS"
  - `ui_text_continue.png` - "CONTINUAR"
  - `ui_text_exit.png` - "SALIR AL MENÚ"
  - `ui_text_back.png` - "BACK TO MENU"
  - `ui_text_restart.png` - "RESTART"
  - `ui_text_main_menu.png` - "MAIN MENU"
  - `ui_text_dev_mode.png` - "DEV MODE"
- **Nota**: Pueden ser sprites de texto o usar fuente pixel art

### 6.3. **Menu Titles (Títulos de Menú)**

#### 6.3.1. **Game Title (Título del Juego)**
- **Tamaño**: Variable (texto grande pixel art)
- **Cantidad**: 1 sprite
- **Descripción**: "ENDLESS 67" en pixel art
- **Elementos**:
  - `ui_title_endless67.png` - Título completo
- **Color**: Dorado (#ffd700) con borde marrón (#8B4500)
- **Uso**: Menú principal

#### 6.3.2. **Menu Titles (Títulos de Menús)**
- **Tamaño**: Variable (texto pixel art)
- **Cantidad**: 4 sprites
- **Elementos**:
  - `ui_title_pause.png` - "PAUSA"
  - `ui_title_settings.png` - "SETTINGS"
  - `ui_title_leaderboard.png` - "TOP 10 SCORES"
  - `ui_title_game_over.png` - "GAME OVER"
- **Color**: Dorado (#ffd700) para títulos principales

### 6.4. **Icons (Iconos)**

#### 6.4.1. **Sound Icons (Iconos de Sonido)**
- **Tamaño**: 16x16 o 24x24 píxeles
- **Cantidad**: 2 iconos
- **Elementos**:
  - `ui_icon_sound_on.png` - Altavoz con ondas (🔊)
  - `ui_icon_sound_off.png` - Altavoz tachado (🔇)
- **Color**: Blanco (#ffffff)
- **Uso**: Botones de toggle de sonido

#### 6.4.2. **Joystick Icons (Iconos de Joystick)**
- **Tamaño**: 16x16 o 24x24 píxeles
- **Cantidad**: 2 iconos
- **Elementos**:
  - `ui_icon_joystick_on.png` - Joystick visible (🕹️)
  - `ui_icon_joystick_off.png` - Joystick oculto/tachado
- **Color**: Blanco (#ffffff)
- **Uso**: Botones de toggle de joystick

#### 6.4.3. **Action Icons (Iconos de Acción)**
- **Tamaño**: 16x16 o 24x24 píxeles
- **Cantidad**: 6 iconos
- **Elementos**:
  - `ui_icon_restart.png` - Icono de reiniciar (🔄)
  - `ui_icon_trophy.png` - Icono de trofeo/leaderboard (🏆)
  - `ui_icon_home.png` - Icono de casa/menú (🏠)
  - `ui_icon_exit.png` - Icono de salida (🚪)
  - `ui_icon_confirm.png` - Icono de confirmar (✓)
  - `ui_icon_dev.png` - Icono de dev mode (👾)
- **Color**: Varios (según contexto)
- **Uso**: Botones de acción en menús

### 6.5. **Menu Overlays (Overlays de Menú)**

#### 6.5.1. **Pause Menu Overlay (Overlay de Menú de Pausa)**
- **Tamaño**: 400x600 píxeles (pantalla completa)
- **Cantidad**: 1 sprite o tiles modulares
- **Descripción**: Fondo semitransparente oscuro para menú de pausa
- **Elementos**:
  - `ui_overlay_pause.png` - Overlay completo
  - O tiles modulares: `ui_overlay_tile.png` (16x16, repetible)
- **Color**: Negro (#000000) con alpha 0.9
- **Uso**: Fondo del menú de pausa

#### 6.5.2. **Game Over Overlay (Overlay de Game Over)**
- **Tamaño**: 400x600 píxeles
- **Cantidad**: 1 sprite o tiles modulares
- **Descripción**: Fondo para pantalla de game over
- **Elementos**:
  - `ui_overlay_gameover.png` - Overlay completo
- **Color**: Negro (#000000) con alpha variable
- **Uso**: Fondo de game over

### 6.6. **Input Elements (Elementos de Input)**

#### 6.6.1. **Name Input Background (Fondo de Input de Nombre)**
- **Tamaño**: 320x240 píxeles (o tiles modulares)
- **Cantidad**: 1 sprite o tiles modulares
- **Descripción**: Panel para input de nombre en high score
- **Elementos**:
  - `ui_panel_name_input.png` - Panel completo
  - O tiles modulares para construir el panel
- **Color**: Negro (#000000) con borde dorado (#ffd700)
- **Uso**: Pantalla de entrada de nombre para high score

#### 6.6.2. **Input Field (Campo de Input)**
- **Tamaño**: Variable (tiles modulares)
- **Cantidad**: Tiles modulares
- **Descripción**: Campo visual para mostrar las iniciales
- **Elementos**:
  - `ui_input_char_placeholder.png` - Guión bajo para carácter vacío
  - `ui_input_char_filled.png` - Fondo para carácter lleno (opcional)
- **Color**: Cyan (#00ffff) para el texto, transparente para fondo
- **Uso**: Mostrar las 3 iniciales del nombre

### 6.7. **Leaderboard Elements (Elementos de Leaderboard)**

#### 6.7.1. **Leaderboard Headers (Encabezados)**
- **Tamaño**: Variable (texto pixel art)
- **Cantidad**: 4 sprites
- **Elementos**:
  - `ui_text_rank.png` - "RANK"
  - `ui_text_name.png` - "NAME"
  - `ui_text_height.png` - "HEIGHT"
  - `ui_text_coins.png` - "COINS"
- **Color**: Gris (#888)
- **Uso**: Encabezados de la tabla de leaderboard

#### 6.7.2. **Medal Icons (Iconos de Medallas)**
- **Tamaño**: 16x16 o 24x24 píxeles
- **Cantidad**: 3 iconos
- **Elementos**:
  - `ui_icon_medal_gold.png` - Medalla de oro (🥇)
  - `ui_icon_medal_silver.png` - Medalla de plata (🥈)
  - `ui_icon_medal_bronze.png` - Medalla de bronce (🥉)
- **Color**: Dorado, plata, bronce respectivamente
- **Uso**: Decoración para top 3 en leaderboard

### 6.8. **Version Text (Texto de Versión)**
- **Tamaño**: Variable (texto pequeño pixel art)
- **Cantidad**: 1 sprite o fuente pixel art
- **Descripción**: Texto de versión "v0.0.35"
- **Elementos**:
  - `ui_text_version.png` - Texto de versión (opcional, si no se usa fuente)
- **Color**: Gris (#444 o #888)
- **Uso**: Menú principal y menú de pausa

### 6.9. **Numbers (Números)**
- **Tamaño**: 16x16 o 24x24 píxeles por dígito
- **Cantidad**: 10 sprites (0-9) + símbolos
- **Elementos**:
  - `ui_number_0.png` hasta `ui_number_9.png`
  - `ui_symbol_plus.png` - "+"
  - `ui_symbol_minus.png` - "-"
  - `ui_symbol_m.png` - "m" (para metros)
  - `ui_symbol_colon.png` - ":"
- **Color**: Varios (según contexto: dorado para score, blanco para altura, etc.)
- **Uso**: Mostrar números en HUD y menús

### 6.10. **Celebration Elements (Elementos de Celebración)**

#### 6.10.1. **67 Celebration Text (Texto de Celebración 67)**
- **Tamaño**: Variable (texto grande pixel art)
- **Cantidad**: 1 sprite
- **Descripción**: "67!" en pixel art grande
- **Elementos**:
  - `ui_text_67_celebration.png` - "67!" grande
- **Color**: Dorado (#ffd700) con borde marrón (#8B4500)
- **Uso**: Celebración cuando se alcanza 67 monedas

#### 6.10.2. **Powerup Text (Texto de Powerup)**
- **Tamaño**: Variable (texto pixel art)
- **Cantidad**: 1 sprite
- **Descripción**: "POWERUP 67" en pixel art
- **Elementos**:
  - `ui_text_powerup67.png` - "POWERUP 67"
- **Color**: Dorado (#ffd700) con borde negro
- **Uso**: Cuando se recoge el powerup

#### 6.10.3. **High Score Text (Texto de High Score)**
- **Tamaño**: Variable (texto pixel art)
- **Cantidad**: 1 sprite
- **Descripción**: "NEW HIGH SCORE!" en pixel art
- **Elementos**:
  - `ui_text_new_highscore.png` - "NEW HIGH SCORE!"
- **Color**: Dorado (#ffd700)
- **Uso**: Pantalla de entrada de nombre

### 📊 Resumen HUD y UI
- **Total de elementos**: ~80-100 sprites/tiles
  - **HUD Elements**: ~5-8 elementos
  - **Buttons**: ~15-20 tiles (modulares) + textos
  - **Icons**: ~15-20 iconos
  - **Texts**: ~20-30 sprites de texto
  - **Overlays**: ~3-5 elementos
  - **Numbers**: ~14 sprites (0-9 + símbolos)
  - **Celebration**: ~3 elementos

---

## 7. Especificaciones Técnicas

### 7.1. **Formato de Archivos**
- **Formato**: PNG con transparencia
- **Profundidad de color**: 32-bit (RGBA)
- **Organización**: Sprite sheets por categoría o sprites individuales

### 7.2. **Paleta de Colores Sugerida**
Basada en las referencias proporcionadas:
- **Personaje**: 
  - Piel: Tono claro
  - Cabello: Castaño claro
  - Sudadera: Gris claro
  - Pantalones: Azul
  - Zapatos: Marrón
- **Fondo**: 
  - Cielo: Azul claro a verde amarillento
  - Montañas: Azul-verde
  - Suelo: Verde y marrón
- **Enemigos**: 
  - Spike: Rojo
  - Shooter: Naranja
  - Jumper: Púrpura
- **Items**: 
  - Moneda: Dorado
  - Powerup: Naranja con negro

### 7.3. **Naming Convention**

#### Personaje
```
player_idle_01.png
player_walk_01.png, player_walk_02.png, player_walk_03.png
player_run_01.png, player_run_02.png, player_run_03.png, player_run_04.png
player_jump_01.png, player_jump_02.png
player_walljump_left.png, player_walljump_right.png
player_powerup_01.png, player_powerup_02.png, player_powerup_03.png, player_powerup_04.png
player_damage_01.png, player_damage_02.png
player_death_01.png, player_death_02.png
player_celebration_67_01.png, player_celebration_67_02.png
```

#### Enemigos
```
enemy_spike_walk_01.png, enemy_spike_walk_02.png
enemy_shooter_idle.png, enemy_shooter_shoot.png
enemy_jumper_idle.png, enemy_jumper_jump_01.png, enemy_jumper_jump_02.png
```

#### Items
```
coin_01.png, coin_02.png, coin_03.png, coin_04.png
powerup_spawn_01.png, powerup_spawn_02.png, powerup_idle.png
```

#### Plataformas (Tiles Modulares 16x16)
```
platform_static_left_cap.png
platform_static_mid.png
platform_static_right_cap.png

platform_moving_left_cap.png
platform_moving_mid.png
platform_moving_right_cap.png

platform_forest_left_cap.png
platform_forest_mid.png
platform_forest_right_cap.png

platform_barn_left_cap.png
platform_barn_mid.png
platform_barn_right_cap.png

platform_rock_left_cap.png
platform_rock_mid.png
platform_rock_right_cap.png

platform_jungle_left_cap.png
platform_jungle_mid.png
platform_jungle_right_cap.png
```

#### Paredes (Tiles Modulares 16x16)
```
wall_forest_top.png
wall_forest_mid.png
wall_forest_bottom.png

wall_barn_top.png
wall_barn_mid.png
wall_barn_bottom.png
wall_barn_door.png (opcional)

wall_mountain_top.png
wall_mountain_mid.png
wall_mountain_bottom.png

wall_jungle_top.png
wall_jungle_mid.png
wall_jungle_bottom.png
```

#### Suelos (Tiles Modulares 16x16)
```
floor_forest_grass.png
floor_barn_grass.png
floor_barn_dirt_path.png
floor_mountain_rock.png
floor_jungle_ground.png
floor_jungle_leaves.png (opcional)
floor_jungle_flowers.png (opcional)
```

#### Bloques de Laberinto (Tiles Modulares 16x16)
```
maze_block_corner_top_left.png
maze_block_corner_top_right.png
maze_block_corner_bottom_left.png
maze_block_corner_bottom_right.png
maze_block_edge_top.png
maze_block_edge_bottom.png
maze_block_edge_left.png
maze_block_edge_right.png
maze_block_mid.png
```

#### Fondos
```
bg_sky_forest.png
bg_sky_barn.png
bg_sky_mountain.png
bg_sky_jungle.png
bg_cloud_small.png
bg_cloud_medium.png
bg_cloud_large.png
bg_forest_foliage.png
bg_barn_building.png
bg_barn_fence.png
bg_barn_field.png
bg_mountain_silhouette.png
bg_mountain_pines.png
bg_jungle_vegetation.png
```

#### Lava
```
# ✅ Ya implementada - No se requieren tiles
# Se usará shader de pixelación para efecto pixel art
# Ver sección 4.6 para más detalles
```

#### Partículas
```
projectile.png
particle_dust.png
particle_spark.png
particle_burn.png
particle_aura.png
confetti_red.png, confetti_blue.png, confetti_green.png, confetti_yellow.png
```

#### HUD y UI
```
# HUD Elements
hud_score_panel.png
hud_text_score.png
hud_height_panel.png
hud_text_height.png
hud_text_start.png

# Icons
ui_icon_pause.png
ui_icon_play.png
ui_icon_sound_on.png
ui_icon_sound_off.png
ui_icon_joystick_on.png
ui_icon_joystick_off.png
ui_icon_restart.png
ui_icon_trophy.png
ui_icon_home.png
ui_icon_exit.png
ui_icon_confirm.png
ui_icon_dev.png
ui_icon_medal_gold.png
ui_icon_medal_silver.png
ui_icon_medal_bronze.png

# Buttons (Tiles Modulares)
button_left_cap.png
button_mid.png
button_right_cap.png
button_green_left_cap.png
button_green_mid.png
button_green_right_cap.png
button_cyan_left_cap.png
button_cyan_mid.png
button_cyan_right_cap.png
button_white_left_cap.png
button_white_mid.png
button_white_right_cap.png
button_red_left_cap.png
button_red_mid.png
button_red_right_cap.png

# Button Texts
ui_text_start_game.png
ui_text_leaderboard.png
ui_text_settings.png
ui_text_continue.png
ui_text_exit.png
ui_text_back.png
ui_text_restart.png
ui_text_main_menu.png
ui_text_dev_mode.png

# Menu Titles
ui_title_endless67.png
ui_title_pause.png
ui_title_settings.png
ui_title_leaderboard.png
ui_title_game_over.png

# Overlays
ui_overlay_pause.png
ui_overlay_gameover.png
ui_overlay_tile.png

# Input Elements
ui_panel_name_input.png
ui_input_char_placeholder.png
ui_input_char_filled.png

# Leaderboard
ui_text_rank.png
ui_text_name.png
ui_text_height.png
ui_text_coins.png

# Numbers
ui_number_0.png hasta ui_number_9.png
ui_symbol_plus.png
ui_symbol_minus.png
ui_symbol_m.png
ui_symbol_colon.png

# Celebration
ui_text_67_celebration.png
ui_text_powerup67.png
ui_text_new_highscore.png

# Version
ui_text_version.png
```

### 7.4. **Sprite Sheets Recomendados**
Para optimización, se pueden crear sprite sheets:
- `player_spritesheet.png` - Todas las animaciones del jugador
- `enemies_spritesheet.png` - Todos los enemigos
- `items_spritesheet.png` - Monedas y powerups
- `tiles_platforms_spritesheet.png` - Todos los tiles de plataformas (por entorno)
- `tiles_walls_spritesheet.png` - Todos los tiles de paredes (por entorno)
- `tiles_floors_spritesheet.png` - Todos los tiles de suelos (por entorno)
- `tiles_maze_spritesheet.png` - Todos los tiles modulares de laberinto
- **Lava**: Ya implementada (no requiere sprite sheet, se usará shader)
- `background_spritesheet.png` - Elementos de fondo (cielo, nubes, elementos grandes)
- `particles_spritesheet.png` - Todas las partículas (ya implementadas, opcional mejorar)
- `ui_buttons_spritesheet.png` - Todos los tiles modulares de botones
- `ui_icons_spritesheet.png` - Todos los iconos de UI
- `ui_texts_spritesheet.png` - Todos los textos de UI (opcional, si se usan sprites)
- `ui_numbers_spritesheet.png` - Números 0-9 y símbolos
- `ui_hud_spritesheet.png` - Elementos de HUD (paneles, overlays)

**Nota**: Los tiles modulares se pueden organizar en sprite sheets separados por categoría para facilitar la carga y el uso en el juego. Los textos pueden ser sprites o usar una fuente pixel art.

### 7.5. **Consideraciones de Animación**
- **Frame Rate**: 8-12 FPS para animaciones suaves
- **Loop**: La mayoría de animaciones deben ser loop (idle, walk, run)
- **One-shot**: Algunas animaciones son de una sola vez (jump, damage, death)
- **Transiciones**: Considerar frames de transición entre estados

### 7.6. **Escalado**
- **Base**: 16x16 píxeles
- **Escalado en juego**: 1.5x o 2x para pantallas modernas (24x24 o 32x32 en pantalla)
- **Mantener**: Aspectos de pixel art nítidos (sin filtrado)

---

## 📝 Checklist de Producción

### Fase 1: Personaje Principal
- [ ] Idle (2-3 frames)
- [ ] Walking (3-4 frames)
- [ ] Running (4-6 frames)
- [ ] Jump (2-3 frames)
- [ ] Double Jump (1-2 frames)
- [ ] Wall Jump Left/Right (2 frames)
- [ ] Wall Cling Left/Right (1-2 frames)
- [ ] Landing (2 frames)
- [ ] Powerup State (4-5 frames)
- [ ] Take Damage (2-3 frames)
- [ ] Death (2-3 frames)
- [ ] Celebration 67 (3-4 frames)

### Fase 2: Enemigos
- [ ] Patrol Enemy walking (2-3 frames)
- [ ] Shooter Enemy idle + shoot (2-3 frames)
- [ ] Jumper Shooter Enemy (3-4 frames)

### Fase 3: Items
- [ ] Coin rotation (4-6 frames)
- [ ] Powerup spawn + idle (4-5 frames)

### Fase 4: Entorno (Tiles Modulares 16x16)
- [ ] Platform static (left_cap, mid, right_cap)
- [ ] Platform moving (left_cap, mid, right_cap)
- [ ] Platform variants por entorno (forest, barn, rock, jungle)
- [ ] Wall tiles por entorno (top, mid, bottom para cada uno)
- [ ] Floor tiles por entorno (grass, dirt, rock, jungle)
- [ ] Maze block tiles (9 tiles modulares: corners, edges, mid)
- [ ] Background sky tiles (top, mid, bottom)
- [ ] Background clouds (small, medium, large)
- [ ] Background elements por entorno (mountains, buildings, vegetation)
- [x] Lava (ya implementada - se usará shader de pixelación)

### Fase 5: Efectos
- [ ] Projectile
- [ ] Particle dust
- [ ] Particle spark
- [ ] Particle burn
- [ ] Particle aura
- [ ] Confetti (múltiples colores)

### Fase 6: HUD y UI
- [ ] HUD Elements (score panel, height panel, pause icon, start prompt)
- [ ] Button tiles modulares (left_cap, mid, right_cap) + variantes de color
- [ ] Button texts (START GAME, LEADERBOARD, SETTINGS, etc.)
- [ ] Menu titles (ENDLESS 67, PAUSA, SETTINGS, etc.)
- [ ] Icons (sound, joystick, restart, trophy, home, exit, medals, etc.)
- [ ] Menu overlays (pause, game over)
- [ ] Input elements (name input panel, character placeholders)
- [ ] Leaderboard elements (headers, medal icons)
- [ ] Numbers (0-9) + símbolos (+, -, m, :)
- [ ] Celebration texts (67!, POWERUP 67, NEW HIGH SCORE!)
- [ ] Version text

---

## 🎯 Prioridades de Implementación

### Alta Prioridad (MVP)
1. Player: Idle, Walk, Run, Jump, Wall Jump
2. Enemigos básicos (1 frame cada uno si es necesario)
3. Coin y Powerup básicos
4. Plataformas y paredes
5. Lava básica

### Media Prioridad
1. Player: Powerup state, Damage, Death
2. Animaciones completas de enemigos
3. Background elements
4. Partículas básicas

### Baja Prioridad (Polish)
1. Player: Celebration, todas las variaciones
2. Partículas avanzadas
3. UI elements mejorados
4. Efectos visuales adicionales

---

## 📚 Referencias Visuales

Basarse en los sprite sheets proporcionados:
1. **Personaje principal**: Sprite sheet completo con todas las animaciones
2. **Fondo**: Composición con cielo, montañas, columnas, suelo
3. **Powerup**: Secuencia de transformación completa
4. **Daño**: Estados de impacto, aturdimiento, muerte
5. **Celebración**: Personaje con números 6 y 7

---

## 🔄 Notas de Migración

1. **Reemplazo gradual**: Se puede migrar por fases, empezando por el personaje
2. **Compatibilidad**: Mantener los nombres de texturas actuales para facilitar el cambio
3. **Testing**: Probar cada sprite individualmente antes de crear sprite sheets
4. **Optimización**: Una vez completado, crear sprite sheets para mejor rendimiento
5. **Backup**: Mantener los sprites actuales como backup hasta completar la migración

### 🎯 Consideraciones Especiales para Tiles Modulares

1. **Tileability**: Todos los tiles deben ser perfectamente tileables (sin costuras visibles cuando se repiten)
2. **Consistencia**: Mantener el mismo estilo y paleta de colores dentro de cada entorno
3. **Variaciones**: Crear suficientes variaciones de tiles para evitar repetición excesiva
4. **Transiciones**: Considerar tiles de transición entre diferentes tipos de terreno
5. **Decoraciones**: Los elementos decorativos (hierba, heno, musgo) pueden ser tiles separados que se superponen
6. **Testing de Construcción**: Probar que los tiles modulares se pueden combinar para crear plataformas y paredes de diferentes tamaños
7. **Entornos**: Cada entorno (Bosque, Granja, Montaña, Selva) debe tener su propio set completo de tiles para mantener coherencia visual

---

**Última actualización**: v0.0.35
**Versión del documento**: 1.0

