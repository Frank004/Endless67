// Presets for reusable light emitters (glow + core + optional particles).
// Use getLightEmitterConfig('presetName', overrides) to customize intensity/colors/sizes/particles.
const deepMerge = (base, overrides) => {
    if (!overrides) return { ...base };
    const output = Array.isArray(base) ? [...base] : { ...base };
    Object.keys(overrides).forEach((key) => {
        const baseValue = base ? base[key] : undefined;
        const overrideValue = overrides[key];
        if (
            baseValue &&
            overrideValue &&
            typeof baseValue === 'object' &&
            typeof overrideValue === 'object' &&
            !Array.isArray(baseValue) &&
            !Array.isArray(overrideValue)
        ) {
            output[key] = deepMerge(baseValue, overrideValue);
        } else {
            output[key] = overrideValue;
        }
    });
    return output;
};

export const LIGHT_EMITTER_PRESETS = {
    lampWarm: {
        id: 'lampWarm',
        emitter: {
            offset: { x: 14, y: 3 },
            mirrorX: true
        },
        glowOuter: {
            key: 'lamp_glow_pixel_v3',
            size: 128,
            rings: [
                { radius: 60, color: 'rgba(255, 200, 100, 0.05)' },
                { radius: 40, color: 'rgba(255, 220, 150, 0.1)' },
                { radius: 20, color: 'rgba(255, 255, 200, 0.2)' }
            ],
            image: { alpha: 0.8, scale: 1.0, blendMode: 'ADD' }
        },
        glowInner: {
            key: 'lamp_core',
            size: 32,
            gradient: [
                { stop: 0, color: 'rgba(255, 255, 255, 0.95)' },
                { stop: 0.5, color: 'rgba(255, 255, 200, 0.8)' },
                { stop: 1, color: 'rgba(255, 200, 100, 0)' }
            ],
            image: { alpha: 1.0, scale: 1.2, blendMode: 'ADD' }
        },
        particle: {
            key: 'pixel_gray',
            size: 2,
            color: 0xcccccc
        },
        particles: {
            enabled: true,
            groups: [
                {
                    speed: { min: 4, max: 10 },
                    angle: { min: 0, max: 360 },
                    scale: { start: 1.0, end: 0.5 },
                    alpha: { start: 0.8, end: 0 },
                    lifespan: 600,
                    quantity: 1,
                    frequency: 120,
                    blendMode: 'ADD',
                    emitZone: {
                        radius: 13,
                        offset: { x: 0, y: 14 },
                        useEmitterOffset: true
                    }
                },
                {
                    speed: { min: 2, max: 6 },
                    angle: { min: 0, max: 360 },
                    scale: { start: 1.5, end: 0.8 },
                    alpha: { start: 0.6, end: 0 },
                    lifespan: 1000,
                    quantity: 1,
                    frequency: 200,
                    blendMode: 'ADD',
                    emitZone: {
                        radius: 17,
                        offset: { x: 0, y: 14 },
                        useEmitterOffset: true
                    }
                }
            ]
        }
    },
    lampWarmIntense: {
        id: 'lampWarmIntense',
        glowOuter: {
            image: { alpha: 1.0, scale: 1.2 }
        },
        glowInner: {
            image: { alpha: 1.0, scale: 1.4 }
        }
    },
    lampCool: {
        id: 'lampCool',
        glowOuter: {
            key: 'lamp_glow_pixel_cool',
            rings: [
                { radius: 60, color: 'rgba(140, 200, 255, 0.05)' },
                { radius: 40, color: 'rgba(170, 220, 255, 0.1)' },
                { radius: 20, color: 'rgba(210, 245, 255, 0.2)' }
            ]
        },
        glowInner: {
            key: 'lamp_core_cool',
            gradient: [
                { stop: 0, color: 'rgba(235, 250, 255, 0.95)' },
                { stop: 0.5, color: 'rgba(180, 220, 255, 0.8)' },
                { stop: 1, color: 'rgba(120, 200, 255, 0)' }
            ]
        }
    },
    lampNoParticles: {
        id: 'lampNoParticles',
        particles: { enabled: false }
    },
    streetlightSmall: {
        id: 'streetlightSmall',
        glowOuter: {
            image: { scale: 0.5 }
        },
        glowInner: {
            image: { scale: 0.5 }
        },
        particles: {
            enabled: true,
            groups: [
                {
                    speed: { min: 4, max: 10 },
                    angle: { min: 0, max: 360 },
                    scale: { start: 0.5, end: 0.25 },
                    alpha: { start: 0.8, end: 0 },
                    lifespan: 600,
                    quantity: 1,
                    frequency: 120,
                    blendMode: 'ADD',
                    emitZone: {
                        radius: 7,
                        offset: { x: 0, y: 14 },
                        useEmitterOffset: true
                    }
                },
                {
                    speed: { min: 2, max: 6 },
                    angle: { min: 0, max: 360 },
                    scale: { start: 0.75, end: 0.4 },
                    alpha: { start: 0.6, end: 0 },
                    lifespan: 1000,
                    quantity: 1,
                    frequency: 200,
                    blendMode: 'ADD',
                    emitZone: {
                        radius: 9,
                        offset: { x: 0, y: 14 },
                        useEmitterOffset: true
                    }
                }
            ]
        }
    }
};

export const getLightEmitterConfig = (presetName = 'lampWarm', overrides = null) => {
    const basePreset = LIGHT_EMITTER_PRESETS[presetName] || LIGHT_EMITTER_PRESETS.lampWarm;
    const mergedPreset = deepMerge(LIGHT_EMITTER_PRESETS.lampWarm, basePreset);
    return deepMerge(mergedPreset, overrides || {});
};
