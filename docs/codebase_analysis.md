# Codebase Analysis & Unit Test Plan

## 1. Executive Summary

This document analyzes the current state of unit testing in the **Endless67** codebase. While a solid foundation of tests exists for core managers (`GameState`, `PoolManager`, `EventBus`) and some gameplay handlers, significant gaps remain, particularly in the recently refactored UI system and the complex procedural generation logic.

**Current Test Count:** ~109 tests passing.
**Coverage Check:** Core Systems (High), Gameplay Logic (Medium), UI & Rendering (Low/None), Procedural Generation (Low).

## 2. Existing Coverage Analysis

The following areas are **well-covered** and stable:

*   **Core Systems**: `PoolManager`, `GameState`, `EventBus`. These are critical singletons/utilities and are well tested.
*   **Collision Handlers**: `EnemyHandler`, `itemHandler`, `CollisionManager` have basic interaction tests.
*   **Basic Managers**: `inputManager`, `AudioManager`, `RiserManager`.
*   **Utils**: `DeviceDetection`, `platformRider`.
*   **Prefabs**: `Enemy.js` (basic behavioral checks).

## 3. High Priority Missing Tests

The following areas are **critical** for gameplay stability and are currently unprotected or under-tested.

### A. Procedural Generation (Critical)
*   **`src/managers/level/SlotGenerator.js`**: **HIGH PRIORITY**. This class controls the entire level layout.
    *   *What to test:* Platform density rules, ensure `generateNextSlot` produces valid Y coordinates, verify `MAZE` vs `PLATFORM_BATCH` ratios, ensure powerups don't spawn too close to each other.
*   **`src/managers/level/MazeSpawner.js` & `PlatformSpawner.js`**:
    *   *What to test:* That they correctly request objects from pools and set initial properties (positions, active state).

### B. Player Control System (High)
*   **`src/player/PlayerController.js`**: The new brain of the player.
    *   *What to test:* `update()` loop flow, delegating to context and FSM.
*   **`src/player/PlayerStateMachine.js`**:
    *   *What to test:* State transitions (e.g., `GROUND` -> `JUMP` -> `FALL` -> `GROUND`), ensuring flags like `inputLocked` are respected during Death/Hit states.
*   **`src/player/PlayerContext.js`**:
    *   *What to test:* Sensor logic (floor/wall detection), Intent interpretation from flags.

### C. Refactored UI System (Medium-High)
We recently split `UIManager`. Each new component needs verification.
*   **`src/managers/ui/UIManager.js`**:
    *   *What to test:* Integration test—does calling `updateScore` actually call `HUDManager.updateScore`? Does `destroy` clean up event listeners?
*   **`src/managers/ui/hud/HUDManager.js`**:
    *   *What to test:* `create()` adds text objects, `updateScore()` updates text content.
*   **`src/managers/ui/menus/PauseMenu.js`**:
    *   *What to test:* `toggle()`, `show()`, `hide()` visibility logic. Button callbacks.
*   **`src/managers/ui/controls/ControlsUI.js`**:
    *   *What to test:* Mobile vs PC layout logic.
*   **`src/managers/ui/menus/GameOverMenu.js`**:
    *   *What to test:* High score input validation logic, submitting scores.

## 4. Proposed Test Plan

We recommend creating the following test files in this order of priority:

1.  **`tests/managers/SlotGenerator.test.js`**
    *   Mock `LevelManager` and `Scene`.
    *   Test `generateNextSlot` multiple times to verify `yStart` decreases correctly (moves up).
    *   Verify `determineSlotType` probabilities.

2.  **`tests/player/PlayerController.test.js`**
    *   Mock `PlayerContext` and `PlayerStateMachine`.
    *   Test input handling (processing `intent.moveX`).

3.  **`tests/player/PlayerStateMachine.test.js`**
    *   Test transitions: `JUMP` logic (velocity application), `WALL_SLIDE` logic, `DEATH` state locking.

4.  **`tests/managers/ui/UIManager.test.js`**
    *   Test the orchestration/delegation.
    *   Ensure `EventBus` listeners are registered and unregistered.

5.  **`tests/managers/ui/components.test.js`** (Composite or individual files)
    *   Basic "render" tests for HUD, PauseMenu, etc. (Mocking `scene.add.text`, `scene.add.image`).

## 5. Refactoring Recommendations for Testability

*   **`SlotGenerator`**: Currently has some complex internal dependencies (`PatternTransformer`). It injects `scene`, which is good. Ensure `PatternTransformer` logic is isolated enough or mocked in tests.
*   **`Player` Prefab**: The `Player.js` class is still a bit heavy, mixing physics setup with some state. The extraction of `PlayerController` was a great step. Tests should focus on the *Controller* logic rather than the Phaser-heavy *Sprite* class where possible.

## 6. Actionable Next Steps
1.  **Create `tests/managers/SlotGenerator.test.js`**. (Immediate impact on stability).
2.  **Create `tests/player/PlayerStateMachine.test.js`**. (Ensures movement logic is solid).
3.  **Refactor `UIManager.test.js`** (if it exists, otherwise create it) to reflect the new sub-manager structure.
