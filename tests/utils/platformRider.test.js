
import { enablePlatformRider, handlePlatformRiderCollision, updatePlatformRider } from '../../src/utils/platformRider.js';

describe('platformRider', () => {
    let rider;
    let platform;

    beforeEach(() => {
        // Mock Rider
        rider = {
            x: 100,
            y: 50,
            body: {
                width: 20,
                velocity: { x: 0, y: 0 },
                touching: { down: false },
                blocked: { down: false, left: false, right: false },
                setCollideWorldBounds: jest.fn()
            },
            setFlipX: jest.fn()
        };

        // Mock Platform
        platform = {
            x: 100,
            y: 100,
            body: {
                x: 100,
                y: 100,
                width: 200,
                velocity: { x: 50, y: 0 },
                touching: { up: true }
            }
        };
    });

    test('enablePlatformRider should set default properties', () => {
        enablePlatformRider(rider);
        expect(rider.isPlatformRider).toBe(true);
        expect(rider.riderMode).toBe('carry');
        expect(rider.riderMarginX).toBe(2);
        expect(rider.body.setCollideWorldBounds).toHaveBeenCalledWith(false);
    });

    test('handlePlatformRiderCollision should link rider to platform', () => {
        enablePlatformRider(rider);
        rider.body.touching.down = true;

        handlePlatformRiderCollision(rider, platform);

        expect(rider.ridingPlatform).toBe(platform);
        expect(rider.localOffsetX).toBeDefined();
    });

    test('updatePlatformRider (carry mode) should move rider with platform', () => {
        enablePlatformRider(rider, { mode: 'carry' });
        rider.body.touching.down = true;
        rider.body.blocked.down = true; // Blocked down means standing on something

        handlePlatformRiderCollision(rider, platform);

        // Move platform
        platform.body.x += 10;
        platform.body.velocity.x = 50;

        updatePlatformRider(rider);

        expect(rider.x).toBe(platform.body.x + rider.localOffsetX); // Should maintain offset
        expect(rider.body.velocity.x).toBe(50); // Should match velocity
    });

    test('updatePlatformRider (patrol mode) should patrol within bounds', () => {
        enablePlatformRider(rider, { mode: 'patrol', autoPatrol: true, patrolSpeed: 60 });
        rider.body.touching.down = true;
        rider.body.blocked.down = true;

        handlePlatformRiderCollision(rider, platform);

        // Simulate moving right
        rider.riderDir = 1;
        updatePlatformRider(rider);
        expect(rider.body.velocity.x).toBe(platform.body.velocity.x + 60);

        // Simulate hitting right edge
        rider.x = rider.maxX + 10; // Past right edge
        updatePlatformRider(rider);
        expect(rider.x).toBe(rider.maxX); // Clamped
        expect(rider.riderDir).toBe(-1); // Reversed
    });
});
