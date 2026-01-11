# Release Notes

## v0.0.45 (2026-01-11)

### 🌟 New Features
*   **Streetlight Prop**: Added a new standard streetlight decoration to the Stage Floor (start screen).
    *   Dynamic positioning (Left/Right mirroring).
    *   Integrated with the new `LightEmitterComponent` for realistic glow and particle effects.
*   **Stage Stage Depth Ordering**: Fixed the visual hierarchy of the starting area elements.
    *   **Foreground (Depth 30)**: Tires, Trashcan, and Floor now properly obscure the Player's feet, creating better depth perception.
    *   **Background (Depth 5)**: Streetlight is correctly placed behind the player.

### 🛠 Visual Improvements
*   **Pixelated Fog**: Enhanced the center vignette with a pixelated retro shader effect.
*   **Riser Effects**: Added pixelation and color banding to Lava, and pixel distortion to Water/Acid shaders for a cohesive retro aesthetic.
*   **Wall Decorations**: Adjusted spawn height for Lamps/Signs to appear earlier (150px from floor), removing the empty gap at the start of the game.

### ♻️ Refactoring
*   **LightEmitterComponent**: Extracted lighting logic (Glow + Bug Particles) from `LampDecoration` into a reusable component.
*   **WallDecorManager**: Tuned parallax and spawn logic.
