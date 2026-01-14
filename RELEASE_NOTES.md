# Release Notes

## v0.0.46 (2026-01-14)

### 🏗️ Architectural Refactoring
*   **Asset Key Centralization**: Eliminated all "magic strings" for assets
    *   Created comprehensive `AssetKeys.js` with texture, audio, and UI constants
    *   Updated `Preloader.js`, `MainMenu.js`, `ControlsUI.js`, and `AudioSystem.js`
*   **Singleton Audit**: Verified all singleton patterns are correctly implemented
    *   Analyzed `GameState`, `ScoreManager`, `AudioSystem`, `PoolManagerRegistry`
    *   Created detailed documentation in `docs/SINGLETON_AUDIT.md`
*   **Code Cleanup**: Removed legacy commented code from `SlotGenerator.js`

### 📚 Documentation
*   Created `docs/SINGLETON_AUDIT.md` with detailed architectural analysis
*   Updated `docs/CODEBASE_AUDIT_AND_PLAN.md` with complete progress tracking

### ✅ Quality
*   All 254 unit tests passing
*   Manual testing verified up to 4859m
*   No regressions detected

---

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
