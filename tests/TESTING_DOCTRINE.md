# Testing Guidelines

## Phaser Component Testing

### 1. Extending Phaser Classes
When defining a class that extends a Phaser Game Object (e.g., `class CoinCounter extends Phaser.GameObjects.Container`), you cannot rely solely on `jest.mock`. The `super()` call requires the base class to exist in the global scope during test execution.

**Pattern:**
Define a global mock in your test file (or setup file) BEFORE instantiating the component:

```javascript
global.Phaser = {
    GameObjects: {
        Container: class {
            constructor(scene) {
                this.scene = scene;
                this.add = jest.fn();
                // Add methods used by the component
                this.setName = jest.fn().mockReturnThis();
                this.setDepth = jest.fn().mockReturnThis();
            }
        }
    }
};
```

### 2. HitArea Validation
When testing `hitArea`, remember that `Phaser.Geom.Rectangle` is often used. 
- If `hitAreaCallback` is `Phaser.Geom.Rectangle.Contains`, coords are **LOCAL** to the Game Object.
- Ensure HitArea origin matches component visual alignment (usually 0,0 for standard containers).

