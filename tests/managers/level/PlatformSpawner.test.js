jest.mock('../../../src/prefabs/Platform.js', () => ({
    PLATFORM_WIDTH: 128,
    PLATFORM_HEIGHT: 32,
    Platform: class { }
}));

import { PlatformSpawner } from '../../../src/managers/level/PlatformSpawner.js';

describe('PlatformSpawner diagnostics', () => {
    beforeEach(() => {
        global.Phaser = {
            Math: {
                Clamp: (v, min, max) => Math.max(min, Math.min(max, v))
            }
        };
    });

    test('returns null and warns when pool spawn fails', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        const scene = {
            cameras: { main: { width: 400 } },
            platformPool: {
                spawn: jest.fn(() => null),
                getStats: jest.fn(() => ({ available: 0, active: 0 }))
            },
            physics: { add: { existing: jest.fn() } },
            platforms: { add: jest.fn() },
            add: { text: jest.fn() }
        };

        const spawner = new PlatformSpawner(scene);
        const result = spawner.spawn(100, 200, 128, false, 0);

        expect(result).toBeNull();
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    test('spawns platform and attaches debug text when pool provides object', () => {
        const textMock = { setOrigin: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis() };
        const platform = {
            spawn: jest.fn(function (x, y) { this.x = x; this.y = y; }),
            setActive: jest.fn(),
            setVisible: jest.fn(),
            setDepth: jest.fn(),
            setData: jest.fn(),
            body: { setSize: jest.fn(), updateFromGameObject: jest.fn(), setVelocityX: jest.fn(), velocity: {} }
        };
        const scene = {
            cameras: { main: { width: 400 } },
            platformPool: {
                spawn: jest.fn(() => platform),
                getStats: jest.fn(() => ({ available: 1, active: 0 }))
            },
            physics: { add: { existing: jest.fn() } },
            platforms: { add: jest.fn() },
            add: { text: jest.fn(() => textMock) }
        };

        const spawner = new PlatformSpawner(scene);
        const result = spawner.spawn(100, 200, 128, false, 0);

        expect(result).toBe(platform);
        expect(scene.platforms.add).toHaveBeenCalledWith(platform, true);
        expect(platform.debugText).toBe(textMock);
    });
});
