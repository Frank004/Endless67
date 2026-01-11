const resolveBlendMode = (blendMode) => {
    if (!blendMode) return undefined;
    const mode = String(blendMode).toUpperCase();
    if (mode === 'ADD') return Phaser.BlendModes.ADD;
    if (mode === 'SCREEN') return Phaser.BlendModes.SCREEN;
    if (mode === 'MULTIPLY') return Phaser.BlendModes.MULTIPLY;
    return blendMode;
};

const resolveOffset = (side, offset, mirrorX) => {
    if (!offset) return { x: 0, y: 0 };
    if (offset.left || offset.right) {
        const resolved = side === 'right' ? offset.right : offset.left;
        return { x: resolved?.x || 0, y: resolved?.y || 0 };
    }
    const x = offset.x || 0;
    const y = offset.y || 0;
    return { x: mirrorX && side === 'right' ? -x : x, y };
};

export class LightEmitterComponent {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.configId = config?.id || null;
        this.side = 'left';
        this.baseOffset = { x: 0, y: 0 };
        this.parent = null;

        this.glowOuter = null;
        this.glowInner = null;
        this.emitters = [];
    }

    ensureTextures() {
        const { glowOuter, glowInner, particle } = this.config;

        if (glowOuter && glowOuter.key && !this.scene.textures.exists(glowOuter.key)) {
            const size = glowOuter.size || 128;
            const canvas = this.scene.textures.createCanvas(glowOuter.key, size, size);
            const ctx = canvas.context;
            const cx = size / 2;
            const cy = size / 2;
            (glowOuter.rings || []).forEach((ring) => {
                ctx.fillStyle = ring.color;
                ctx.beginPath();
                ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            canvas.refresh();
        }

        if (glowInner && glowInner.key && !this.scene.textures.exists(glowInner.key)) {
            const size = glowInner.size || 32;
            const canvas = this.scene.textures.createCanvas(glowInner.key, size, size);
            const ctx = canvas.context;
            const half = size / 2;
            const grd = ctx.createRadialGradient(half, half, 0, half, half, half);
            (glowInner.gradient || []).forEach((stop) => {
                grd.addColorStop(stop.stop, stop.color);
            });
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, size, size);
            canvas.refresh();
        }

        if (particle && particle.key && !this.scene.textures.exists(particle.key)) {
            const size = particle.size || 2;
            const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(particle.color || 0xffffff, 1);
            g.fillRect(0, 0, size, size);
            g.generateTexture(particle.key, size, size);
        }
    }

    create(parent, side = 'left', baseOffset = { x: 0, y: 0 }) {
        this.parent = parent;
        this.side = side;
        this.baseOffset = { x: baseOffset.x || 0, y: baseOffset.y || 0 };

        if (!this.config) return;
        this.ensureTextures();

        const emitterOffset = resolveOffset(this.side, this.config.emitter?.offset, this.config.emitter?.mirrorX);
        const baseX = this.baseOffset.x + emitterOffset.x;
        const baseY = this.baseOffset.y + emitterOffset.y;

        if (this.config.glowOuter?.key) {
            this.glowOuter = this.scene.add.image(baseX, baseY, this.config.glowOuter.key);
            const img = this.config.glowOuter.image || {};
            this.glowOuter.setBlendMode(resolveBlendMode(img.blendMode));
            this.glowOuter.setAlpha(img.alpha ?? 1);
            this.glowOuter.setScale(img.scale ?? 1);
            parent.add(this.glowOuter);
        }

        if (this.config.glowInner?.key) {
            this.glowInner = this.scene.add.image(baseX, baseY, this.config.glowInner.key);
            const img = this.config.glowInner.image || {};
            this.glowInner.setBlendMode(resolveBlendMode(img.blendMode));
            this.glowInner.setAlpha(img.alpha ?? 1);
            this.glowInner.setScale(img.scale ?? 1);
            parent.add(this.glowInner);
        }

        if (this.config.particles?.enabled !== false) {
            (this.config.particles?.groups || []).forEach((group) => {
                const emitZone = group.emitZone || {};
                const emitOffset = resolveOffset(this.side, emitZone.offset, this.config.emitter?.mirrorX);
                const zoneX = emitZone.useEmitterOffset ? baseX + emitOffset.x : this.baseOffset.x + emitOffset.x;
                const zoneY = emitZone.useEmitterOffset ? baseY + emitOffset.y : this.baseOffset.y + emitOffset.y;
                const emitter = this.scene.add.particles(0, 0, this.config.particle.key, {
                    ...group,
                    emitZone: {
                        type: 'random',
                        source: new Phaser.Geom.Circle(zoneX, zoneY, emitZone.radius || 10)
                    }
                });
                emitter.setBlendMode(resolveBlendMode(group.blendMode));
                parent.add(emitter);
                this.emitters.push(emitter);
            });
        }
    }

    setConfig(config) {
        if (!config) return;
        const nextId = config.id || null;
        if (this.configId && nextId && this.configId === nextId) {
            this.config = config;
            return;
        }
        this.destroy();
        this.config = config;
        this.configId = nextId;
        if (this.parent) {
            this.create(this.parent, this.side, this.baseOffset);
        }
    }

    setSide(side, baseOffset = null) {
        this.side = side;
        if (baseOffset) {
            this.baseOffset = { x: baseOffset.x || 0, y: baseOffset.y || 0 };
        }
        this.updatePositions();
    }

    updatePositions() {
        if (!this.config) return;
        const emitterOffset = resolveOffset(this.side, this.config.emitter?.offset, this.config.emitter?.mirrorX);
        const baseX = this.baseOffset.x + emitterOffset.x;
        const baseY = this.baseOffset.y + emitterOffset.y;

        if (this.glowOuter) this.glowOuter.setPosition(baseX, baseY);
        if (this.glowInner) this.glowInner.setPosition(baseX, baseY);

        this.emitters.forEach((emitter, index) => {
            const group = this.config.particles?.groups?.[index];
            const emitZone = group?.emitZone;
            if (emitZone && emitter.emitZone?.source?.setPosition) {
                const emitOffset = resolveOffset(this.side, emitZone.offset, this.config.emitter?.mirrorX);
                const zoneX = emitZone.useEmitterOffset ? baseX + emitOffset.x : this.baseOffset.x + emitOffset.x;
                const zoneY = emitZone.useEmitterOffset ? baseY + emitOffset.y : this.baseOffset.y + emitOffset.y;
                emitter.emitZone.source.setPosition(zoneX, zoneY);
            }
        });
    }

    start() {
        this.emitters.forEach((emitter) => emitter.start());
    }

    stop() {
        this.emitters.forEach((emitter) => emitter.stop());
    }

    destroy() {
        this.emitters.forEach((emitter) => emitter.destroy());
        this.emitters = [];
        if (this.glowInner) this.glowInner.destroy();
        if (this.glowOuter) this.glowOuter.destroy();
        this.glowInner = null;
        this.glowOuter = null;
    }
}
