# 📁 Assets Structure

Esta carpeta contiene todos los assets del juego organizados para compatibilidad con Phaser Editor 2D.

## 📂 Estructura

```
assets/
├── audio/              # Archivos de audio
│   ├── bg-music/       # Música de fondo
│   ├── celebration/    # Sonidos de celebración
│   ├── collecting-coins/ # Sonidos de monedas
│   ├── destroy/        # Sonidos de destrucción
│   ├── jumps/          # Sonidos de saltos
│   ├── lava/           # Sonidos de lava
│   ├── lava-drop/      # Sonidos de caída en lava
│   └── take-damage/    # Sonidos de daño
└── images/             # Imágenes y sprites (para uso futuro)
```

## 🎵 Audio

Todos los archivos de audio están organizados en subcarpetas temáticas. Los nombres de las carpetas usan kebab-case (guiones) para mejor compatibilidad.

### Formatos soportados:
- `.mp3` - Música y efectos largos
- `.wav` / `.WAV` - Efectos de sonido

## 🖼️ Images

La carpeta `images/` está preparada para futuros sprites e imágenes. Actualmente el juego genera texturas programáticamente en `Boot.js`.

## 📝 Notas para Phaser Editor

- Phaser Editor detectará automáticamente esta estructura
- Los assets se pueden gestionar visualmente desde el editor
- Las rutas en el código están configuradas para usar `assets/`

