import { WALLS } from '../../config/GameConstants.js';

/**
 * WallDecorator (tiles individuales)
 * - Mantiene 3 segmentos por lado, cada uno del alto del viewport aprox.
 * - Cada segmento usa un patrón precalculado de frames (pool de ~20 patrones).
 * - Recicla segmentos: si quedan debajo, los coloca arriba del más alto (y viceversa al bajar).
 * - Pool de tiles limitado (sin fugas): filas visibles * segmentos * 2 lados.
 */
export class WallDecorator {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = 32;
        this.bufferTiles = 2;
        this.decoChance = 0.1;
        this.minPlainsBetweenDeco = 2;
        this.segmentsPerSide = 3;
        this.patternPoolSize = 30; // más patrones
        this.decoChance = 0.1; // default
        this.extraDecoChance = 0.05; // prob de usar más deco en patrones específicos

        const cam = scene.cameras.main;
        const bufferPx = this.bufferTiles * this.tileSize;
        this.segmentHeight = Math.ceil((cam.height + bufferPx * 2) / this.tileSize) * this.tileSize;
        this.rowsPerSegment = Math.ceil(this.segmentHeight / this.tileSize);

        this.plainFrames = [
            'wall-01.png', 'wall-02.png', 'wall-03.png',
            'wall-04.png', 'wall-05.png', 'wall-06.png',
            'wall-07.png', 'wall-08.png', 'wall-09.png'
        ];
        this.decoFrames = [
            'wall-deco-01.png', 'wall-deco-02.png', 'wall-deco-03.png',
            'wall-deco-04.png', 'wall-deco-05.png', 'wall-deco-06.png',
            'wall-deco-07.png', 'wall-deco-08.png', 'wall-deco-09.png',
            'wall-deco-10.png'
        ];

        this.patterns = [];
        this.leftSegments = [];
        this.rightSegments = [];
        this.tilePool = [];
        this.tilesPerSegment = this.rowsPerSegment;
        this.maxTiles = this.tilesPerSegment * this.segmentsPerSide * 2; // dos lados
    }

    ensurePatterns() {
        if (this.patterns.length > 0) return;
        for (let i = 0; i < this.patternPoolSize; i++) {
            this.patterns.push(this.generatePattern());
        }
    }

    generatePattern() {
        const frames = [];
        let plainCount = this.minPlainsBetweenDeco;
        const useExtraDeco = Math.random() < this.extraDecoChance;
        const decoChance = useExtraDeco ? Math.min(0.25, this.decoChance + 0.05) : this.decoChance;
        for (let i = 0; i < this.rowsPerSegment; i++) {
            const canDeco = plainCount >= this.minPlainsBetweenDeco;
            if (canDeco && Math.random() < decoChance && this.decoFrames.length > 0) {
                frames.push(this.decoFrames[Phaser.Math.Between(0, this.decoFrames.length - 1)]);
                plainCount = 0;
            } else {
                frames.push(this.plainFrames[Phaser.Math.Between(0, this.plainFrames.length - 1)]);
                plainCount += 1;
            }
        }
        return frames;
    }

    acquireTile(frame) {
        if (!this.scene.textures.exists('walls')) return null;
        let tile = this.tilePool.find(t => !t.active);
        if (!tile && this.tilePool.length < this.maxTiles) {
            tile = this.scene.add.image(0, 0, 'walls', frame);
            tile.setOrigin(0.5, 0.5);
            tile.setDepth(0);
            this.tilePool.push(tile);
        }
        if (tile) {
            tile.setTexture('walls', frame);
            tile.setVisible(true).setActive(true);
        }
        return tile;
    }

    createSegment(side, yStart) {
        const tiles = [];
        const pattern = this.patterns[Phaser.Math.Between(0, this.patterns.length - 1)];
        for (let r = 0; r < this.rowsPerSegment; r++) {
            const frame = pattern[r];
            const tile = this.acquireTile(frame);
            if (tile) tiles.push(tile);
        }
        return { side, yStart, tiles, pattern };
    }

    positionSegment(seg, side) {
        const cam = this.scene.cameras.main;
        const x = side === 'L' ? WALLS.WIDTH / 2 : cam.width - WALLS.WIDTH / 2;
        seg.tiles.forEach((tile, r) => {
            tile.setPosition(x, seg.yStart + r * this.tileSize + this.tileSize / 2);
            tile.setVisible(true).setActive(true);
        });
    }

    initSegments(side, scrollY) {
        const list = side === 'L' ? this.leftSegments : this.rightSegments;
        const base = Math.floor(scrollY / this.segmentHeight) * this.segmentHeight;
        while (list.length < this.segmentsPerSide) {
            const idx = list.length - 1;
            const yStart = base + idx * this.segmentHeight;
            const seg = this.createSegment(side, yStart);
            if (seg) {
                list.push(seg);
                this.positionSegment(seg, side);
            } else {
                break;
            }
        }
    }

    recycle(list, side, top, bottom) {
        if (list.length === 0) return;
        let maxY = Math.max(...list.map(s => s.yStart));
        let minY = Math.min(...list.map(s => s.yStart));
        list.forEach(seg => {
            if (seg.yStart + this.segmentHeight < top) {
                seg.yStart = maxY + this.segmentHeight;
                maxY = seg.yStart;
                this.repaintSegment(seg);
            } else if (seg.yStart > bottom) {
                seg.yStart = minY - this.segmentHeight;
                minY = seg.yStart;
                this.repaintSegment(seg);
            }
            this.positionSegment(seg, side);
        });
    }

    repaintSegment(seg) {
        seg.pattern = this.patterns[Phaser.Math.Between(0, this.patterns.length - 1)];
        seg.pattern.forEach((frame, r) => {
            if (seg.tiles[r]) {
                seg.tiles[r].setTexture('walls', frame);
            } else {
                const tile = this.acquireTile(frame);
                if (tile) seg.tiles[r] = tile;
            }
        });
    }

    update(scrollY = 0) {
        if (!this.scene.textures.exists('walls')) return;
        this.ensurePatterns();
        const cam = this.scene.cameras.main;
        const bufferPx = this.bufferTiles * this.tileSize;
        const top = scrollY - bufferPx;
        const bottom = scrollY + cam.height + bufferPx;
        const extra = this.segmentHeight; // rango extendido
        const rangeTop = top - extra;
        const rangeBottom = bottom + extra;

        this.initSegments('L', scrollY);
        this.initSegments('R', scrollY);

        // asegurar conteo por si algún segmento se pierde
        this.ensureCount('L', scrollY);
        this.ensureCount('R', scrollY);

        this.recycle(this.leftSegments, 'L', rangeTop, rangeBottom);
        this.recycle(this.rightSegments, 'R', rangeTop, rangeBottom);
    }

    ensureCount(side, scrollY) {
        const list = side === 'L' ? this.leftSegments : this.rightSegments;
        while (list.length < this.segmentsPerSide) {
            const yStart = Math.floor(scrollY / this.segmentHeight) * this.segmentHeight + (list.length - 1) * this.segmentHeight;
            const seg = this.createSegment(side, yStart);
            if (seg) {
                list.push(seg);
                this.positionSegment(seg, side);
            } else {
                break;
            }
        }
    }
}
