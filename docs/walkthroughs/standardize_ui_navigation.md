# Standardize UI Navigation Walkthrough

## Objective
Refactor the game's UI to use a consistent, DRY (Don't Repeat Yourself) approach for menu navigation and button interactions across all scenes (`MainMenu`, `PauseMenu`, `GameOverMenu`, `Leaderboard`).

## Changes

### 1. `MenuNavigation` Class
Created `src/managers/ui/MenuNavigation.js` to completely encapsulate navigation logic.
- **Responsibility**: Manages a list of buttons, tracks selected index, listens to `UI_NAV_*` and `UI_SELECT` events.
- **Methods**: `setup()`, `cleanup()`, `navigate(dir)`, `selectButton(index)`.

### 2. `UIHelpers` Enhancement
Updated `src/utils/UIHelpers.js` to standardize button objects.
- **`setupButtonBehavior`**: A new internal helper that attaches `select()`, `deselect()`, and `trigger()` methods to button objects.
- **Consistent Styling**: All buttons now use Yellow (`#ffff00`) for highlight/hover and scale up to `1.1`.

### 3. Refactored Menus
Refactored the following files to use `MenuNavigation` and `UIHelpers`:

#### `GameOverMenu.js`
- Replaced custom `showPostGameOptions` logic.
- Implemented `MenuNavigation` setup and cleanup.
- Removed manual `navListeners` for navigation (only kept cleanup logic).

#### `PauseMenu.js`
- Replaced manual `setupKeyboardNav` logic with `MenuNavigation`.
- Created buttons using `UIHelpers` and passed the result objects to `MenuNavigation`.

#### `MainMenu.js`
- Updated `createButton` usage to strictly use `UIHelpers` and store the returned wrappers.
- Removed `handleNavUp`, `handleNavDown`, etc.
- Integrated `MenuNavigation`.

#### `Leaderboard.js`
- Replaced manual text creation for "BACK TO MENU" with `UIHelpers.createTextButton`.
- Added `MenuNavigation` implementation even for a single button (consistency).

#### `Settings.js`
- Fully refactored to use `MenuNavigation` and `UIHelpers`.
- Removed manual `handleNavUp`/`handleNavDown` logic.
- Implemented consistent button styling and behavior.

### 4. Tests
- Updated `tests/scenarios/MenuNavigation.test.js` to reflect the new architecture.
- Verified that all menus correctly handle navigation events and selection states.

## Verification results
### Automated Tests
- `tests/scenarios/MenuNavigation.test.js` passed (5/5 tests).
- Confirmed that navigation events (`UI_NAV_DOWN`, `UI_SELECT`) correctly trigger button scaling and callbacks.

### Manual Verification Steps (Recommended)
1. **Main Menu**: Open game, use Arrow Keys to navigate. Confirm buttons highlight Yellow. Press Enter on "Settings".
2. **Settings**: Navigate options. Press Escape to return.
3. **Game**: Start game, press P to pause. Navigate Pause Menu.
4. **Game Over**: Die, verify "RESTART", "LEADERBOARD", "MAIN MENU" navigation works.
5. **Leaderboard**: Verify "BACK TO MENU" is selected by default and Enter works.
