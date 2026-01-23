# Singleton Audit - Phase 2 Refactoring

## Current Singletons

### ✅ **CORRECT Singletons** (Should remain singletons)

#### 1. `GameState` 
- **Location:** `src/core/GameState.js`
- **Justification:** 
  - Global game state (score, height, sound settings)
  - Persists across scene transitions
  - Single source of truth for game progression
- **Status:** ✅ Correctly implemented as singleton

#### 2. `ScoreManager`
- **Location:** `src/managers/gameplay/ScoreManager.js`
- **Justification:**
  - Manages persistent leaderboard data
  - Accesses localStorage
  - Must survive scene restarts
- **Status:** ✅ Correctly implemented as singleton

#### 3. `AudioSystem`
- **Location:** `src/core/systems/AudioSystem.js`
- **Justification:**
  - Global audio context (browser limitation)
  - Music/sound state persists across scenes
  - Single audio manager prevents conflicts
- **Status:** ✅ Correctly implemented as singleton
- **Note:** Currently uses `new AudioSystem()` in ManagerInitializer, which returns the singleton instance

---

### ✅ **CORRECT Singleton** (Debugging Only)

#### 4. `PoolManagerRegistry`
- **Location:** `src/core/PoolManager.js`
- **Justification:**
  - Global registry for debugging/stats
  - Used only in `PoolInitializer` to register pools
  - Doesn't affect game logic
- **Status:** ✅ Correctly implemented as singleton
- **Note:** `PoolManager` itself is NOT a singleton (correctly scene-scoped)

---

## Scene-Scoped Managers (Correctly NOT Singletons)

These managers are correctly instantiated per scene:

### ✅ Scene-Specific Managers
1. **DifficultyManager** - Tracks progression per game session
2. **CollisionManager** - Scene-specific collision setup
3. **LevelManager** - Manages current level state
4. **WallDecorManager** - Scene-specific decorations
5. **SlotGenerator** - Generates slots for current scene
6. **InputSystem** - Scene-specific input handling
7. **UIManager** - Scene-specific UI elements
8. **ParticleManager** - Scene-specific particle effects
9. **RiserManager** - Scene-specific riser (lava/water/etc)
10. **DebugManager** - Scene-specific debug tools
11. **WallDecorator** - Scene-specific wall rendering
12. **InteractableManager** - Scene-specific interactables

**Status:** ✅ All correctly implemented as scene-scoped

---

## Testing Strategy
1. ✅ Run all 254 unit tests
2. ✅ Manual test: Start game → Game Over → Restart
3. ✅ Verify no pool leaks or conflicts
4. ✅ Check memory usage in DevTools

---

## Summary

| Manager | Current | Should Be | Action |
|---------|---------|-----------|--------|
| GameState | Singleton | Singleton | ✅ Keep |
| ScoreManager | Singleton | Singleton | ✅ Keep |
| AudioSystem | Singleton | Singleton | ✅ Keep |
| PoolManagerRegistry | Singleton | Singleton | ✅ Keep (Debug only) |
| PoolManager | Scene-Scoped | Scene-Scoped | ✅ Correct |
| All Other Managers | Scene-Scoped | Scene-Scoped | ✅ Correct |

**Conclusion:** All singletons are correctly implemented. No refactoring needed for Phase 2.1.

**Next Step:** Phase 2.2 - Simplify `SlotGenerator` (already in progress with strategies)
