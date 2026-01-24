import AudioSystem from '../../../src/Systems/Core/AudioSystem.js';

describe('AudioSystem', () => {
    let scene;

    const resetManager = () => {
        AudioSystem.scene = null;
        AudioSystem.bgMusic = null;
        AudioSystem.lavaSound = null;
        AudioSystem.soundEnabled = true;
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

        AudioSystem.setScene(scene);

        expect(AudioSystem.soundEnabled).toBe(false);
        expect(scene.sound.mute).toBe(true);
    });

    test('toggleSound should flip registry value and mute sound', () => {
        AudioSystem.setScene(scene);
        scene.registry.get.mockReturnValue(true);

        AudioSystem.toggleSound();

        expect(scene.registry.set).toHaveBeenCalledWith('soundEnabled', false);
        expect(AudioSystem.soundEnabled).toBe(false);
        expect(scene.sound.mute).toBe(true);
    });

    test('toggleSound with payload should set specific state', () => {
        AudioSystem.setScene(scene);

        AudioSystem.toggleSound({ enabled: false });

        expect(scene.registry.set).toHaveBeenCalledWith('soundEnabled', false);
        expect(AudioSystem.soundEnabled).toBe(false);
        expect(scene.sound.mute).toBe(true);

        AudioSystem.toggleSound({ enabled: true });

        expect(scene.registry.set).toHaveBeenCalledWith('soundEnabled', true);
        expect(AudioSystem.soundEnabled).toBe(true);
        expect(scene.sound.mute).toBe(false);
    });

    test('updateAudio should adjust lava and music volumes based on distance', () => {
        AudioSystem.scene = scene;
        AudioSystem.riserAmbientSound = {
            isPlaying: true,
            volume: 0,
            setVolume: jest.fn()
        };
        AudioSystem.bgMusic = {
            isPlaying: true,
            setVolume: jest.fn()
        };

        AudioSystem.updateAudio(100, 60);

        expect(AudioSystem.riserAmbientSound.setVolume).toHaveBeenCalledWith(expect.any(Number));
        expect(AudioSystem.bgMusic.setVolume).toHaveBeenCalledWith(expect.any(Number));
    });
});
