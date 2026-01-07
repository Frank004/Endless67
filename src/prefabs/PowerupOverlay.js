/**
 * PowerupOverlay
 * Efecto visual que se posiciona sobre el jugador cuando activa el powerup 67.
 * Mantiene su propia animación y seguimiento del jugador.
 */
export class PowerupOverlay extends Phaser.GameObjects.Sprite {
    constructor(scene, player) {
        // Usar atlas 'basketball' como fuente de frames (ya cargado)
        super(scene, 0, 0, 'basketball', 'basketball 1.png');
        this.scene = scene;
        this.player = player;

        scene.add.existing(this);

        this.setOrigin(0.5);
        this.setDisplaySize(64, 64);
        this.setDepth(30); // Por encima del jugador (player depth 20)
        this.setBlendMode(Phaser.BlendModes.ADD);
        this.setVisible(false);
        // Seguir el mismo scroll que el jugador
        this.setScrollFactor(player.scrollFactorX, player.scrollFactorY);

        this.ensureAnimation();

        // Limpiar si destruyen al jugador
        if (this.player && this.player.once) {
            this.player.once(Phaser.GameObjects.Events.DESTROY, () => this.destroy());
        }
    }

    ensureAnimation() {
        if (this.scene.anims.exists('powerup67_overlay')) return;

        const texKey = 'basketball';
        if (!this.scene.textures.exists(texKey)) {
            console.warn('⚠️ powerup overlay: textura "basketball" no encontrada, usando sprite sin animación');
            return;
        }

        // Usar los tres frames del atlas de basketball como efecto simple
        const frameOrder = [
            'basketball 1.png',
            'basketball 2.png',
            'basketball 3.png',
            'basketball 2.png'
        ].filter(f => this.scene.textures.get(texKey).has(f));

        if (frameOrder.length === 0) {
            console.warn('⚠️ powerup overlay: frames de basketball no encontrados');
            return;
        }

        const frames = frameOrder.map(frame => ({ key: texKey, frame }));

        this.scene.anims.create({
            key: 'powerup67_overlay',
            frames,
            frameRate: 10,
            repeat: 0
        });
    }

    start(onComplete = null, holdMs = 1800) {
        if (!this.scene.anims.exists('powerup67_overlay')) {
            if (onComplete) onComplete();
            return;
        }
        if (this._holdTimer) {
            this._holdTimer.remove(false);
            this._holdTimer = null;
        }
        this.setVisible(true);
        this.play({ key: 'powerup67_overlay', repeat: 0 });
        this.updatePosition();
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            // Mantener el overlay un tiempo extra antes de desaparecer
            this._holdTimer = this.scene.time.delayedCall(holdMs, () => {
                this.stop();
                if (onComplete) onComplete();
            });
        });
    }

    stop() {
        this.setVisible(false);
        if (this.anims) {
            this.anims.stop();
        }
        if (this._holdTimer) {
            this._holdTimer.remove(false);
            this._holdTimer = null;
        }
    }

    updatePosition() {
        if (!this.player) return;
        this.setPosition(this.player.x, this.player.y - 2);
        // Mantener scroll factor en caso de que el player lo cambie
        this.setScrollFactor(this.player.scrollFactorX, this.player.scrollFactorY);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.visible) return;
        this.updatePosition();
    }
}
