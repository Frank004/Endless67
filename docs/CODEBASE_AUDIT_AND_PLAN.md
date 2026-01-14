/# Endless67 Codebase Audit & Architecture Review

## 1. Executive Summary
The codebase allows for a solid "Endless Runner" foundation but exhibits signs of "Manager Bloat" and some tightly coupled dependencies. The recent introduction of unit tests (Coverage: Core Managers) provides a safety net for the necessary refactoring. 

**Current Status:**
- ✅ Unit Tests: Stable and Passing.
- ⚠️ Architecture: Heavy reliance on singleton/static Managers.
- ⚠️ Complexity: `GameInitializer` and `SlotGenerator` are becoming monolithic.

## 2. Architecture Review against Principles

### ✅ Single Responsibility (SRP)
*   **Good:** `ScoreManager`, `EventBus`, `PoolManager` have clear, distinct roles.
*   **Bad:** `GameInitializer.js` (15KB) handles too much: boot sequence, global event binding, debug flags, and initial scene setup. It acts as a God Object.
*   **Bad:** `SlotGenerator.js` manages generation logic, difficulty scaling, AND some visual decoration logic.

### ✅ DRY (Don't Repeat Yourself)
*   **Issues:** Repeated collision filtering identifiers in multiple managers (`filters.js`, collision managers).
*   **Issues:** Asset keys string literals repeated across `Boot.js` and consumer files.

### ✅ Dependency Injection Ready
*   **Status:** Mixed. Many managers are instantiated directly or accessed via global singletons inside other classes, making testing harder (required extensive mocking).
*   **Goal:** Move towards passing dependencies via `constructor` or `init` methods, as seen in the recent refactor of `SlotGenerator`.

## 3. "Spaghetti Code" Analysis & Hotspots

1.  **`src/core/GameInitializer.js`**
    *   *Symptom:* Contains mixed logic for Debug Mode, Device Detection, and Game Loop bootstrapping.
    *   *Fix:* Split into `DebugManager`, `DeviceConfig`, and pure `BootLoader`.

2.  **`src/managers/level/SlotGenerator.js`**
    *   *Symptom:* Logic for "Deciding what to spawn" is intertwined with "How to spawn it".
    *   *Fix:* Extract `DifficultyCurve` usage into a dedicated helper.

3.  **`src/managers/gameplay/RiserManager.js`**
    *   *Symptom:* Often coupled with multiple pipelines.
    *   *Refactor:* (Already improved with `RiserPipelineManager`, continue this pattern).

## 4. Reorganization Plan

The `src/managers` directory is overcrowded. We propose grouping by functional domain more strictly.

### Current
```
src/managers/
  audio/
  background/
  collision/
  debug/
  gameplay/
  input/
  level/
  system/
  ui/
  visuals/
```

### Proposed Changes
*   **Consolidate:** Move `input` and `audio` into `core/systems` if they are global singletons.
*   **Gameplay Domain:** Ensure `gameplay` only contains rules logic (Score, Riser, GameModes).
*   **Entities Domain:** Create `src/entities/` for logic that isn't quite a "Manager" but controls specific game objects (e.g., PlayerController, EnemyController).

## 5. Actionable Refactoring Tasks

### Phase 1: Core Cleanup (High Priority)
- [x] **Refactor `GameInitializer`**: Break down into `AppConfig.js`, `DebugSystem.js`, and `GameBoot.js` (Implemented as `EventInitializer`, `WorldInitializer`).
- [x] **Centralize Asset Keys**: Create `src/config/AssetKeys.js` to avoid magic strings for textures/audio.
  - ✅ Created `AssetKeys.js` with all texture, audio, and UI constants
  - ✅ Updated `Preloader.js` to use `ASSETS` constants
  - ✅ Updated `AudioSystem.js` to use `ASSETS` constants
  - ✅ Updated `MainMenu.js` to use `ASSETS.GAME_LOGO`
  - ✅ Updated `ControlsUI.js` to use `ASSETS.JOYSTICK_BASE`, `ASSETS.JOYSTICK_KNOB`, `ASSETS.JUMP_FEEDBACK`

### Phase 2: Manager Decoupling
- [x] **Audit Singleton Usage**: Identify Managers that *must* be singletons vs those that should be Scene-scoped.
  - ✅ Analyzed all 4 singletons: `GameState`, `ScoreManager`, `AudioSystem`, `PoolManagerRegistry`
  - ✅ Verified all are correctly implemented
  - ✅ Confirmed all other managers are correctly scene-scoped
  - ✅ Created `docs/SINGLETON_AUDIT.md` with detailed analysis
  - **Result:** No refactoring needed - architecture is correct
- [ ] **Simplify `SlotGenerator`**: Extract specific slot pattern generation to `patterns/` strategies.
  - ✅ Already started: Created `PlatformSlotStrategy` and `MazeSlotStrategy`
  - ⏳ Next: Consider extracting item generation logic

### Phase 3: Comment & Code Cleanup
- [ ] **Remove Legacy Comments**: Remove commented-out code blocks in `Game.js` and `SlotGenerator.js`.
- [ ] **JSDoc Standardization**: Ensure all public methods in Managers have concise JSDoc.

## 6. Next Step
Proceed with **Phase 1: Core Cleanup** starting with `GameInitializer.ts` refactoring.
