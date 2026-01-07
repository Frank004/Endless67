import EventBus, { Events } from '../../core/EventBus.js';
import { ASSETS } from '../../config/AssetKeys.js';

export class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.eventListeners = [];
    }

    createParticles() {
        const scene = this.scene;

        // Dust Emitter (Jumping/Landing)
        scene.dustEmitter = scene.add.particles(0, 0, ASSETS.PARTICLE_DUST, {
            lifespan: 400,
            speed: { min: 50, max: 100 },
            scale: { start: 1, end: 0 },
            gravityY: 100,
            emitting: false,
            depth: 20
        });

        // Spark Emitter (Wall Jump / Projectile Hit)
        scene.sparkEmitter = scene.add.particles(0, 0, ASSETS.PARTICLE_SPARK, {
            lifespan: 300,
            speed: { min: 200, max: 400 },
            blendMode: 'ADD',
            scale: { start: 1, end: 0 },
            emitting: false,
            depth: 20
        });

        // Setup Event Listener for Jump Particles
        const jumpListener = (data) => {
            if (data.type === 'wall_jump') {
                scene.sparkEmitter.emitParticleAt(data.x, data.y, 10);
            } else {
                scene.dustEmitter.emitParticleAt(data.x, data.y, 10);
            }
        };
        EventBus.on(Events.PLAYER_JUMPED, jumpListener);
        this.eventListeners.push({ event: Events.PLAYER_JUMPED, listener: jumpListener });

        // Burn Emitter (Lava Death)
        scene.burnEmitter = scene.add.particles(0, 0, ASSETS.PARTICLE_BURN, {
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
        scene.auraEmitter = scene.add.particles(0, 0, ASSETS.PARTICLE_AURA, {
            speedY: { min: -100, max: -250 },
            speedX: { min: -20, max: 20 },
            scale: { start: 1.2, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            follow: scene.player,
            emitting: false,
            depth: 19
        });
        this.auraEmitter = scene.auraEmitter;
    }

    startAura() {
        if (this.auraEmitter) {
            if (this.scene.player) {
                this.auraEmitter.startFollow(this.scene.player);
            }
            this.auraEmitter.start();
        }
    }

    stopAura() {
        if (this.auraEmitter) {
            this.auraEmitter.stop();
        }
    }

    emitDust(x, y) {
        if (this.scene.dustEmitter) {
            this.scene.dustEmitter.emitParticleAt(x, y, 10);
        }
    }

    emitSpark(x, y) {
        if (this.scene.sparkEmitter) {
            this.scene.sparkEmitter.emitParticleAt(x, y, 10);
        }
    }

    explodeConfetti(x, y) {
        const scene = this.scene;
        // Lazy initialization
        if (!scene.confettiEmitter) {
            scene.confettiEmitter = scene.add.particles(0, 0, ASSETS.CONFETTI, {
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

        scene.confettiEmitter.setPosition(x, y);
        scene.confettiEmitter.explode(80);
    }

    destroy() {
        this.eventListeners.forEach(({ event, listener }) => {
            EventBus.off(event, listener);
        });
        this.eventListeners = [];
    }
}
