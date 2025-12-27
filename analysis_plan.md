# Comprehensive System Analysis & Refactor Plan

## � System Health Check Report

### 1. Critical Architecture issues
- **Hybrid Input System (Dangerous)**: The `InputManager` is currently in a "half-migrated" state. It emits events (`PLAYER_MOVE`) AND calls methods directly (`player.move()`). This caused the double-jump bug and risks causing "double movement speed" or glitchy physics if not resolved.
- **Duplicate Object Management**: `Game.js` creates Phaser Groups manually (`this.platforms`, `this.enemies`), but `PoolManager` ALSO manages these objects. This wastes memory and CPU, creating two sources of truth for the same entities.
- **Redundant Physics Checks**: `Game.js` sets up World Bounds collisions, but `Player.js` explicitly disables them (`this.body.onWorldBounds = false`). The code configuring World Bounds is dead logic.

### 2. Module-Specific Findings

#### `src/scenes/Game.js`
- **Status**: bloated with legacy code.
- **Issues**:
    -   Manual wall position updates in `updateWalls()` (inefficient).
    -   Manual group creation (Legacy).
    -   Direct management of dependencies that should be handled by Managers.

#### `src/managers/LevelManager.js`
- **Status**: Functional but dirty.
- **Issues**:
    -   Contains massive `if (pool) ... else (legacy)` blocks.
    -   The "Legacy" path is dead code since pools are now active, but it clutters logic and makes reading difficult.
    -   Hardcoded values for platform spacing and enemy chances instead of using `LevelConfig`.

#### `src/managers/InputManager.js`
- **Status**: Risk of double-execution.
- **Issues**:
    -   `player.jump()` call was removed (Fixed).
    -   `player.move()` and `player.stop()` still have direct calls alongside event emits.

#### `src/managers/ParticleManager.js`
- **Status**: Good (Refactored).
- **Notes**: Now correctly uses the Observer Pattern to listen for `PLAYER_JUMPED`.

---

## � Refactoring Plan

### Phase 1: Input System Purification (High Priority)
**Objective**: Ensure 1 Input = 1 Action.
1.  [x] Remove direct `player.jump()` calls (Completed).
2.  [x] Update `Player.js` to listen to `PLAYER_MOVE` and `PLAYER_STOP` events (Verified).
3.  [x] Remove direct `player.move()` and `player.stop()` calls from `InputManager.js` (Completed).

### Phase 2: Kill the Legacy (Cleanup)
**Objective**: Remove dead code paths to prevent confusion.
1.  [x] **LevelManager**: Remove all `else { legacy logic }` blocks. Assume `PoolManager` is always present.
2.  [x] **Game.js**: Remove manual group creation (`this.platforms = ...`). Trust `PoolManager` to handle groups (Renamed comments to clarify Physics Group usage).
3.  [x] **Game.js**: Remove `updateWalls()` and usage of `physics.world.setBounds` (use Static Bodies with correct `scrollFactor` or just rely on the `CollisionManager`).

### Phase 3: Physics & Performance
**Objective**: Optimize collision detection.
1.  [x] Verify `CollisionManager.js` relies *only* on the Pool's groups (Verified: It uses Game groups which are populated by LevelManager via Pools).
2.  [x] Ensure Walls are truly static elements that don't need per-frame CPU updates (Verified: setScrollFactor(0) implemented).

## 🚀 Execution Instructions for Agent

1.  **Execute Phase 1 Step 2 & 3**:
    -   Files: `src/prefabs/Player.js`, `src/managers/InputManager.js`.
    -   Action: Add event listeners to Player, remove direct calls in InputManager.

2.  **Execute Phase 2**:
    -   Files: `src/managers/LevelManager.js`.
    -   Action: Delete all legacy fallback code. Clean up imports.

3.  **Execute Phase 3**:
    -   Files: `src/managers/ColllsionalManager.js`, `src/scenes/Game.js`.
    -   Action: Update collision references to use `pool.getGroup()` instead of `scene.platforms`.

---
**Status**: Ready for Execution.
