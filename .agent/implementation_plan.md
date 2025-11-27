# Architectural Refactoring Plan - Endless67

## Goal Description
Refactor the entire codebase to adhere to strict software engineering principles: Single Responsibility, DRY, Dependency Injection, Separation of Concerns, and Decoupling. The goal is to separate Gameplay Logic from UI, eliminate "Mega Classes", and create a scalable, maintainable architecture using a Service Locator (Manager) pattern and Event Bus.

## User Review Required
> [!IMPORTANT]
> This is a massive refactor. It will touch almost every file in `src/`.
> **Breaking Changes**: The way scenes and objects communicate will be completely changed.
> **Risk**: High risk of temporary regressions during the transition. Verification will be crucial.

## Proposed Architecture

### 0. Unit Testing ✅ (COMPLETED)
*   **Goal**: Establish a safety net before refactoring.
*   **Tools**: Jest, Babel (for ES6 modules), jest-canvas-mock.
*   **Status**: ✅ **READY**
    *   Jest is configured with ES6 module support.
    *   Phaser mock engine is implemented (`tests/mocks/phaserMock.js`).
    *   Test infrastructure is in place for:
        *   `managers/*.js`: Logic verification with mocked dependencies.
        *   `utils/*.js`: Pure function testing.
        *   `prefabs/*.js`: State change and behavior testing.
    *   Run tests with: `npm test`
    *   **Note**: Visual tests (rendering) are out of scope for Unit Tests.

### 1. Core Infrastructure (New)
*   **`src/core/GameManager.js`**: A Singleton/Service Locator that holds references to all services (Input, Audio, Level, UI, State).
*   **`src/core/GameState.js`**: Manages game state (score, height, game over, pause) and emits events on change.
*   **`src/core/EventBus.js`**: A central event emitter for decoupled communication.
*   **`src/core/PoolManager.js`**: Generic object pool to handle `platforms`, `enemies`, `projectiles` and reduce Garbage Collection.

### 2. Constants (New)
*   **`src/config/GameConstants.js`**: Centralized constants for physics, gameplay values, UI colors, etc.

### 3. Manager Refactoring
*   **`LevelManager`**:
    *   Remove direct references to `scene.platforms`, etc.
    *   Use `PoolManager` to request objects.
    *   Focus solely on generation logic (Maze, Pattern selection).
*   **`UIManager`**:
    *   Decouple from `Game.js` update loop.
    *   Subscribe to `EventBus` events (`SCORE_UPDATED`, `GAME_OVER`, `PAUSE_TOGGLED`).
    *   Remove any game logic (e.g., pausing physics).
*   **`InputManager`**:
    *   Standardize input events.

### 4. Entity Refactoring
*   **`Player`**:
    *   Refactor into `PlayerController` (Logic/Physics) and `PlayerView` (Visuals/Animations).
    *   Remove direct input polling in `update` if possible, or use `InputManager` abstraction.
*   **`Enemy`**:
    *   Implement Strategy Pattern for behaviors (`PatrolBehavior`, `ShootBehavior`).
    *   Use `PoolManager` for spawning/despawning.

### 5. Scene Refactoring
*   **`Game.js`**:
    *   Become a thin orchestrator.
    *   Initialize `GameManager`.
    *   Delegate `update` to `GameManager`.

## Proposed Changes

### Core
#### [NEW] `src/core/GameManager.js`
#### [NEW] `src/core/GameState.js`
#### [NEW] `src/core/EventBus.js`
#### [NEW] `src/core/PoolManager.js`

### Config
#### [NEW] `src/config/GameConstants.js`

### Managers
#### [MODIFY] `src/managers/LevelManager.js`
#### [MODIFY] `src/managers/UIManager.js`
#### [MODIFY] `src/managers/InputManager.js`

### Prefabs
#### [MODIFY] `src/prefabs/Player.js`
#### [MODIFY] `src/prefabs/Enemy.js`

### Scenes
#### [MODIFY] `src/scenes/Game.js`

## Verification Plan

### Automated Tests ✅
*   **Unit Tests**: Available and ready to run with `npm test`
*   Tests cover:
    *   Core managers (Level, UI, Input)
    *   Utility functions
    *   Prefab logic (Player, Enemy behaviors)
*   **Strategy**: Run tests before and after each refactoring step to catch regressions early.

### Manual Verification
1.  **Gameplay Loop**:
    *   Start game.
    *   Verify Player movement (WASD/Arrows + Jump).
    *   Verify Platform generation (Infinite scrolling).
    *   Verify Enemy spawning and interaction (Collision/Death).
    *   Verify Score/Height updates.
2.  **UI Interaction**:
    *   Pause/Resume game.
    *   Toggle Sound.
    *   Game Over screen -> Name Input -> Leaderboard.
3.  **Performance**:
    *   Monitor FPS.
    *   Check for object pooling (no increasing memory usage).

## Next Steps

Now that unit tests are in place, we can proceed with confidence:

1. **Phase 1**: Create Core Infrastructure
   - Implement `EventBus.js`
   - Implement `GameState.js`
   - Implement `GameConstants.js`
   - Run tests to verify no regressions

2. **Phase 2**: Implement Object Pooling
   - Create `PoolManager.js`
   - Refactor platform/enemy spawning
   - Run tests to verify pooling logic

3. **Phase 3**: Refactor Managers
   - Decouple `UIManager` from game loop
   - Simplify `LevelManager` responsibilities
   - Run tests after each manager refactor

4. **Phase 4**: Refactor Entities
   - Split `Player` into Controller/View
   - Implement Enemy Strategy Pattern
   - Run tests to verify behavior preservation

5. **Phase 5**: Final Integration
   - Refactor `Game.js` scene
   - Wire up `GameManager`
   - Full manual verification pass
