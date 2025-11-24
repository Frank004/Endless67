# Platform Rider System - Usage Guide

## Overview
The Platform Rider system provides reusable platform-riding behavior for any sprite in the game. It handles both moving and static platforms automatically.

## Modes

### 1. **Patrol Mode** (for enemies)
Objects walk/patrol on platforms with automatic edge detection and reversal.

### 2. **Carry Mode** (for coins, powerups)
Objects are carried by platforms without relative movement.

## How to Use

### Step 1: Enable Platform Rider on a Sprite

```javascript
import { enablePlatformRider } from './utils/platformRider.js';

// For enemies (patrol mode)
const enemy = this.spikeEnemies.get(x, y);
enablePlatformRider(enemy, { 
    mode: 'patrol', 
    patrolSpeed: 60,
    marginX: 5 
});

// For coins/powerups (carry mode)
const coin = this.coins.create(x, y, 'coin');
enablePlatformRider(coin, { 
    mode: 'carry',
    marginX: 2
});
```

### Step 2: Set Up Collision Handler

```javascript
import { handlePlatformRiderCollision } from './utils/platformRider.js';

// In your scene's create() method
this.physics.add.collider(
    this.spikeEnemies, 
    this.platforms, 
    handlePlatformRiderCollision, 
    null, 
    this
);

this.physics.add.collider(
    this.coins, 
    this.platforms, 
    handlePlatformRiderCollision, 
    null, 
    this
);
```

### Step 3: Update Riders Each Frame

```javascript
import { updatePlatformRider } from './utils/platformRider.js';

// In your scene's update() method
update(time, delta) {
    // Update enemies
    this.spikeEnemies.children.iterate(enemy => {
        if (!enemy || !enemy.active) return;
        updatePlatformRider(enemy);
        // Add enemy-specific logic here
    });

    // Update coins
    this.coins.children.iterate(coin => {
        if (!coin || !coin.active) return;
        updatePlatformRider(coin);
    });
}
```

## Integration with Existing Classes

### Example: SpikeEnemy

```javascript
import { enablePlatformRider, updatePlatformRider } from '../utils/platformRider.js';

export class SpikeEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_spike');
        this.setDepth(20);
        
        // Enable platform rider
        enablePlatformRider(this, { 
            mode: 'patrol', 
            patrolSpeed: 60, 
            marginX: 5 
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        // Update platform rider behavior first
        updatePlatformRider(this);

        // Then add custom logic
        if (this.y > this.scene.player.y + 900) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | string | `'patrol'` | `'patrol'` or `'carry'` |
| `patrolSpeed` | number | `60` | Speed for patrol mode (pixels/sec) |
| `marginX` | number | `2` | Margin from platform edges (pixels) |

## How It Works

### Patrol Mode
1. When the sprite lands on a platform, it stores the platform reference
2. Each frame, it calculates world bounds from the platform's current position
3. Velocity = platform velocity + (direction × patrol speed)
4. Automatically reverses direction at platform edges

### Carry Mode
1. When the sprite lands on a platform, it stores the platform reference
2. Each frame, it matches the platform's velocity exactly
3. Position is clamped to stay within platform bounds

## Benefits

- ✅ **Reusable**: One system for all platform-riding objects
- ✅ **No "Turbo" Bug**: Velocity is always controlled (platform + relative)
- ✅ **Works with Moving Platforms**: Automatically tracks platform movement
- ✅ **Clean Code**: Separates platform logic from object-specific logic
- ✅ **Arcade Physics Native**: Uses only standard Phaser physics, no hacks
