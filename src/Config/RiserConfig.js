import { ASSETS } from './AssetKeys.js';

export const RISER_TYPES = {
    LAVA: 'lava',
    WATER: 'water',
    ACID: 'acid',
    FIRE: 'fire'
};

export class RiserSpeedConfig {
    constructor(baseSpeed, maxSpeed, acceleration) {
        this.baseSpeed = baseSpeed;
        this.maxSpeed = maxSpeed;
        this.acceleration = acceleration;
    }
}

export class RiserConfiguration {
    constructor(type) {
        this.type = type;
        this.texture = 'lava_texture';
        this.soundKey = ASSETS.LAVA_AMBIENT;
        this.dropSoundKey = ASSETS.LAVA_DROP;
        this.speedConfig = new RiserSpeedConfig(-54, -180, 0.08);
        this.displayName = 'LAVA';
        this.color = '#ff6600'; // Orange-red

        this.configure(type);
    }

    configure(type) {
        switch (type) {
            case RISER_TYPES.LAVA:
                this.texture = 'lava_texture';
                this.soundKey = ASSETS.LAVA_AMBIENT;
                this.dropSoundKey = ASSETS.LAVA_DROP;
                this.displayName = 'LAVA';
                this.color = '#ff6600'; // Orange-red
                break;
            case RISER_TYPES.WATER:
                this.texture = 'water_texture';
                this.soundKey = ASSETS.WATER_AMBIENT;
                this.dropSoundKey = ASSETS.WATER_DROP;
                this.displayName = 'WATER';
                this.color = '#3399ff'; // Blue
                break;
            case RISER_TYPES.ACID:
                this.texture = 'acid_texture';
                this.soundKey = ASSETS.ACID_AMBIENT;
                this.dropSoundKey = ASSETS.ACID_DROP;
                this.displayName = 'ACID';
                this.color = '#66ff33'; // Acid green
                break;
            case RISER_TYPES.FIRE:
                this.texture = 'fire_texture';
                this.soundKey = ASSETS.FIRE_AMBIENT;
                this.dropSoundKey = ASSETS.FIRE_DROP;
                this.displayName = 'FIRE';
                this.color = '#ffaa00'; // Bright orange
                break;
        }

        // Force a single speed profile across all riser types for now.
        this.speedConfig = new RiserSpeedConfig(-54, -180, 0.08);
    }
}
