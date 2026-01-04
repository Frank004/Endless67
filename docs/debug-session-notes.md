# Debug Session Notes – Platform Generation (Current State)

## Context
- Issue: Platforms stopped appearing after Y ≈ -1362; some were drifting far off-screen (both vertically and horizontally).
- Environment: Phaser 3.87, logs enabled via `?logs=1`.
- Observed drift: Platforms spawned at `x=180` ended up at `x=360` or doubled Y positions.

## Key Fixes Applied
- **Platform bodies static**: In `src/prefabs/Platform.js`, platform bodies are created as static (`physics.add.existing(this, true)`) with `moves=false`, `velocity=0`, and `immovable=true` to avoid unintended physics movement.
- **Position restore**: In `src/managers/level/SlotGenerator.js`, each update restores platform `x`/`y` to `initialX`/`initialY`.
- **Drift detector**: With `showSlotLogs` true, SlotGenerator logs and traces any platform whose position differs from its initial spawn.
- **Disable moving platforms in debug**: When `showSlotLogs` is true, moving platforms are disabled to simplify debugging (can be re-enabled later).
- **Clamp safety**: PlatformSpawner clamps X only when truly out-of-bounds; no unnecessary shift to the right.

## Current Behavior (after fixes)
- Platforms render correctly and stay in place; no drift observed in the latest run.
- Cleanup is effectively disabled in debug mode; platforms remain for inspection.
- Moving platforms are disabled in debug mode; all platforms are static for now.

## Next Steps (per user request)
- Re-enable platform patterns and random selection via the pool to confirm they work under normal conditions.
- Optionally re-enable moving platforms once drift is confirmed resolved, and remove defensive restores if desired.

## Latest change (re-enable variety)
- GridGenerator `_determineType` now picks PLATFORM_BATCH for the first 3 slots, then randomly mixes PLATFORM_BATCH (60%), SAFE_ZONE (20%), MAZE (20%). Moving platforms can be toggled via registry (`disableMovingPlatforms`), but are not forced off. Drift logging is gated behind `logPlatformDrift`. Platform lock safety (restore X/Y) is opt-in via `enablePlatformLock`.

## Fresh updates
- Cleanup now stays OFF by default in both `CleanupManager` and `SlotGenerator`; only enable if you set `registry.disableCleanup = false` (or `scene.disableCleanup = false`). Logs mode (`showSlotLogs`) also keeps cleanup skipped.
- Platform bounds margin relaxed when a camera width is provided, so patterns can use the full playable width instead of clamping to the right (previous 236px ceiling).
- HiDPI sizing: `getHiDpiScale` now clamps `window.devicePixelRatio` for Phaser `config.resolution` so the render es más nítido sin cambiar el tamaño lógico (GAME_WIDTH/GAME_HEIGHT siguen en 360x640 base). Base sizing se conserva; solo sube la resolución de render.
