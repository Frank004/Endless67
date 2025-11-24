export class ParticleManager {
    constructor(scene) {
        this.scene = scene;
    }

    createParticles() {
        const scene = this.scene;

        // Dust Emitter (Jumping/Landing)
        scene.dustEmitter = scene.add.particles(0, 0, 'particle_dust', {
            lifespan: 400,
            speed: { min: 50, max: 100 },
            scale: { start: 1, end: 0 },
            gravityY: 100,
            emitting: false,
            depth: 20
        });

        // Spark Emitter (Wall Jump / Projectile Hit)
        scene.sparkEmitter = scene.add.particles(0, 0, 'particle_spark', {
            lifespan: 300,
            speed: { min: 200, max: 400 },
            blendMode: 'ADD',
            scale: { start: 1, end: 0 },
            emitting: false,
            depth: 20
        });

        // Burn Emitter (Lava Death)
        scene.burnEmitter = scene.add.particles(0, 0, 'particle_burn', {
            lifespan: 600,
            speed: { min: 100, max: 300 },
            angle: { min: 200, max: 340 },
            scale: { start: 1.5, end: 0 },
            blendMode: 'ADD',
            tint: [0xff0000, 0xff8800],
            emitting: false,
            depth: 51
        });

        // Aura Emitter (Powerup)
        scene.auraEmitter = scene.add.particles(0, 0, 'particle_aura', {
            speedY: { min: -100, max: -250 },
            speedX: { min: -20, max: 20 },
            scale: { start: 1.2, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            follow: scene.player,
            emitting: false,
            depth: 19
        });

        // Confetti Emitter (Celebration)
        scene.confettiEmitter = scene.add.particles(0, 0, 'confetti', {
            speed: { min: 200, max: 500 },
            angle: { min: 180, max: 360 },
            gravityY: 300,
            lifespan: 1200,
            scale: { start: 1.5, end: 0 },
            tint: [0xffd700, 0xffffff, 0xffaa00],
            emitting: false,
            depth: 200
        });
    }
}
