import AudioManager from '../../src/managers/audio/AudioManager.js';

describe('AudioManager', () => {
    let scene;

    const resetManager = () => {
        AudioManager.scene = null;
        AudioManager.bgMusic = null;
        AudioManager.lavaSound = null;
        AudioManager.soundEnabled = true;
    };

    beforeEach(() => {
        resetManager();
        scene = {
            registry: {
                get: jest.fn(() => true),
                set: jest.fn()
            },
            sound: {
                mute: false,
                context: { state: 'running', resume: jest.fn() },
                cache: { audio: { exists: jest.fn(() => false) } }
            },
            input: { on: jest.fn() },
            events: { once: jest.fn() },
            cameras: { main: { scrollY: 0, height: 600 } }
        };
    });

    afterEach(() => {
        resetManager();
    });

    test('setScene should read registry and sync mute state', () => {
        scene.registry.get.mockReturnValue(false);

        AudioManager.setScene(scene);

        expect(AudioManager.soundEnabled).toBe(false);
        expect(scene.sound.mute).toBe(true);
    });

    test('toggleSound should flip registry value and mute sound', () => {
        AudioManager.setScene(scene);
        scene.registry.get.mockReturnValue(true);

        AudioManager.toggleSound();

        expect(scene.registry.set).toHaveBeenCalledWith('soundEnabled', false);
        expect(AudioManager.soundEnabled).toBe(false);
        expect(scene.sound.mute).toBe(true);
    });

    test('updateAudio should adjust lava and music volumes based on distance', () => {
        AudioManager.scene = scene;
        AudioManager.lavaSound = {
            isPlaying: true,
            volume: 0,
            setVolume: jest.fn()
        };
        AudioManager.bgMusic = {
            isPlaying: true,
            setVolume: jest.fn()
        };

        AudioManager.updateAudio(100, 60);

        expect(AudioManager.lavaSound.setVolume).toHaveBeenCalledWith(expect.any(Number));
        expect(AudioManager.bgMusic.setVolume).toHaveBeenCalledWith(expect.any(Number));
    });
});
