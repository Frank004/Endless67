export const FOG_CONFIG = {
    // Render order: above wall decor (<=5), below gameplay (>=10).
    depth: 9,

    // Base fog layer (full-screen gradient).
    baseAlpha: 0.28,
    baseTint: 0xb8c0cc,
    shadowAlpha: 0.18,
    shadowTint: 0x6b737f,

    // Particles (screen-space, subtle drift from walls).
    particleTint: 0xc6ced8,
    particleAlpha: { start: 0.18, end: 0 },
    particleScale: { start: 1.0, end: 1.8 },
    particleLifespan: { min: 3500, max: 6500 },
    particleFrequency: 300, // Optimized: Reduced from 200ms to 300ms (33% fewer particles)
    particleSpeedX: { min: 12, max: 28 },
    particleSpeedY: { min: -6, max: 6 },
    particleSpawnWidth: 24,
    maxParticles: 40 // Optimized: Limit total particles per emitter to prevent accumulation
};
