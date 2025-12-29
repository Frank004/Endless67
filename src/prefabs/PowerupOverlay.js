/**
 * PowerupOverlay
 * Efecto visual que se posiciona sobre el jugador cuando activa el powerup 67.
 * Mantiene su propia animación y seguimiento del jugador.
 */
export class PowerupOverlay extends Phaser.GameObjects.Sprite {
    constructor(scene, player) {
        super(scene, 0, 0, 'basketball_powerup');
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

        const texture = this.scene.textures.get('basketball_powerup');
        if (!texture) {
            console.warn('⚠️ powerup overlay: textura "basketball_powerup" no encontrada');
            return;
        }

        // Orden explícito de frames según el atlas exportado
        // Orden completo de frames según el atlas
        const frameOrder = [
            'efecto PU 67 -1.png',
            'efecto PU 67 - 2.png',
            'basketball_powerup-01.png',
            'basketball_powerup-02.png',
            'basketball_powerup-03.png',
            'basketball_powerup-04.png',
            'basketball_powerup-05.png',
            'basketball_powerup-06.png',
            'basketball_powerup-07.png',
            'basketball_powerup-08.png',
            'basketball_powerup-09.png',
            'basketball_powerup-10.png',
            'basketball_powerup-11.png',
            'basketball_powerup-12.png',
            'basketball_powerup-13.png',
            'basketball_powerup-14.png',
            'basketball_powerup-15.png',
            'basketball_powerup-16.png'
        ];

        const frames = frameOrder.map(frame => ({ key: 'basketball_powerup', frame }));

        this.scene.anims.create({
            key: 'powerup67_overlay',
            frames,
            frameRate: 8,
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
