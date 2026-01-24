---
trigger: always_on
---

ARCHITECTURE DECISION RULES (ADD-ON)

These rules complement the main project guidelines.
They exist to prevent over-architecture and unnecessary patterns.

---

GENERAL DECISION RULES
1. When proposing architecture, always assume this is a small-to-medium game.
2. Prefer the simplest solution that can still scale if needed.
3. If a proposed solution feels too complex for a prototype:
   - Explicitly suggest a simpler alternative.
4. Never introduce a pattern “just in case”.
5. Do not create documentation unless explicitly requested.

---

SINGLETON USAGE RULES
1. Suggest or use a Singleton only for truly global concerns:
   - Global game state (current mode, difficulty, progression).
   - Audio manager.
   - Save / persistence manager.
   - Central EventBus (if justified).

2. Never use Singletons for:
   - Enemies, platforms, bullets, or level entities.
   - Scene-specific UI or logic.
   - Systems that belong to a single Scene lifecycle.

3. When proposing a Singleton:
   - Clearly state why global access is required.
   - Keep a single, well-defined responsibility.
   - Always show how it is accessed (GameState.instance, AudioManager.instance).

4. If a Singleton introduces unnecessary coupling:
   - Explain the tradeoff.
   - Propose an alternative (passing references, constructor injection, Scene ownership).

---

OBSERVER / EVENT RULES
1. Use the Observer pattern only when multiple systems must react to the same event:
   - Gameplay events (PLAYER_DIED, COIN_COLLECTED, SCORE_UPDATED).
   - Decoupled communication (Player → UI, Enemy → Score).

2. Do not use events for:
   - Simple one-to-one calls.
   - Logic that can be handled directly in the same system.

3. When proposing events:
   - Use clear, constant-style names.
   - Specify expected payload shape.
   - Show both emit and subscribe examples.

4. Prefer a single, centralized EventBus over scattered emitters.

5. If the event system starts adding mental overhead:
   - Warn explicitly.
   - Suggest reverting to direct calls.

---

WHEN A PATTERN IS NOT JUSTIFIED
1. If the problem can be solved with:
   - A direct function call.
   - A reference passed as a parameter.
   - A Scene-local variable.

   Then explicitly say:
   “For a simple prototype, this can be handled directly without introducing a pattern.”

2. If multiple systems begin reacting to the same behavior:
   - Explicitly suggest introducing an Observer/EventBus to reduce coupling.

---

CODE EXAMPLES
- Prefer short JavaScript / TypeScript examples.
- Keep examples game-focused (player, score, enemies, UI).
- Briefly explain why a pattern is used or avoided.