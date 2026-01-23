# Refactor Plan: Playground Modularization

## Objective
Refactor the monolithic `src/scenes/Playground.js` into a modular architecture to improve maintainability, verify separation of concerns, and allow for easier extension of developer tools.

## Proposed Architecture

We will introduce a new directory `src/playground/` to house the Playground-specific logic, keeping `src/scenes/Playground.js` as the lightweight entry point and container.

### 1. `src/scenes/Playground.js` (The Container)
- **Responsibility**: Entry point, Scene lifecycle (`create`, `update`), and coordination.
- **Inherits**: `Game` (from `src/scenes/Game.js`).
- **Composes**:
    - `PlaygroundRules`: Manages game state overrides and configurations.
    - `PlaygroundCleanup`: Manages scene clearing logic.
    - `PlaygroundDevMenu`: Manages the UI and user interactions.

### 2. `src/playground/logic/PlaygroundRules.js`
- **Responsibility**: Enforcing Playground-specific rules.
- **Key Methods**:
    - `applyStartRules()`: Disabling auto-generators (SlotGenerator, RiserManager, LevelManager updates).
    - `setupPlayer()`: Enforcing gravity and specialized spawn points.
    - `overrideGameLoop()`: Managing `update()` overrides.

### 3. `src/playground/logic/PlaygroundCleanup.js`
- **Responsibility**: Safe destruction of objects.
- **Key Methods**:
    - `clearScene()`: The robust "V4" cleanup logic derived from the current implementation.
    - `respawnSafePlatform()`: Logic to ensure the player always has footing after cleanup.

### 4. `src/playground/ui/PlaygroundDevMenu.js`
- **Responsibility**: Managing the visual overlay, scrolling, and category orchestration.
- **Key Methods**:
    - `createUI()`: Building the fixed UI elements (Title, ScrollZone).
    - `toggleMenu()`: Handling visibility.
    - `registerCategory(handler)`: Adding tabs dynamically.

### 5. `src/playground/handlers/` (Dev Menu Logic Handlers)
To satisfy the "Subclasses for spawning" requirement, we will create modular handlers that the Menu consumes. Each handler defines its menu items and the logic to execute them.

- `DevHandler.js` (Base Class/Interface)
    - `getCategoryLabel()`
    - `getIcon()`
    - `getItems()` -> Returns array of `{ label, icon, callback }`.

- **Subclasses**:
    - `EnemyDevHandler.js`: Logic for `spawnEnemy` (Patrol, Shooter, Jumper).
    - `ItemDevHandler.js`: Logic for `spawnPowerup` (Shield, Coin).
    - `PlatformDevHandler.js`: Logic for `spawnPlatform` (Static, Moving, Zigzag).
    - `MazeDevHandler.js`: Logic for `spawnSpecificMaze`.
    - `RiserDevHandler.js`: Logic for Riser settings.

## Implementation Steps

- [x] **Scaffold Directory Structure**:
    - Create `src/playground/`, `src/playground/ui/`, `src/playground/logic/`, `src/playground/handlers/`.

- [x] **Extract Logic (Phase 1: Rules & Cleanup)**:
    - Move initialization overrides to `PlaygroundRules.js`.
    - Move `clearScene` logic to `PlaygroundCleanup.js`.
    - wire up `Playground.js` to use these new classes.

- [x] **Extract Logic (Phase 2: Handlers)**:
    - Create the Spawner handlers (`EnemyDevHandler`, etc.).
    - Move the specific spawning code (`spawnEnemy`, `spawnPowerup`) into these handlers.
    - Ensure they have access to the `scene` reference to create GameObjects.

- [x] **Extract UI (Phase 3: DevMenu)**:
    - Create `PlaygroundDevMenu.js`.
    - Move `createDevUI`, `toggleCategory`, `updateScrollPositions` logic.
    - adapt it to consume the `DevHandler` instances instead of hardcoded `this.categories`.

- [x] **Final Integration**:
    - Clean up `src/scenes/Playground.js` to remove all legacy code.
    - Verify all features (Spawning, Scrolling, Cleanup) work as before.

## Verification
- **Dev Mode UI**: Responsive and scrollable.
- **Spawning**: Enemies/Items spawn on platforms.
- **Cleanup**: Scene clears correctly and safe platform appears.
