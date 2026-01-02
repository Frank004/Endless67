/**
 * MazeDecorator
 * Crea un skin 32x32 sobre los bloques del maze usando el atlas 'walls'.
 * Mantiene la colisión existente (solo visual).
 */
export class MazeDecorator {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = 32;
        this.buffer = 0;
        this.pool = [];
        // Usamos siempre tiles de debug (placeholder) para visualizar cobertura del maze
        this.debugTiles = true;
        this.debugTextureKey = 'maze_debug_tile';
        // Frames
        this.plainFrames = [
            'wall-01.png', 'wall-02.png', 'wall-03.png',
            'wall-04.png', 'wall-05.png', 'wall-06.png',
            'wall-07.png', 'wall-08.png', 'wall-09.png'
        ];
        // Deco deshabilitado temporalmente en maze (solo esquinas, top/bottom y plain)
        this.decoFrames = [];
        this.cornerFrames = {
            tl: ['wall-corners-left_top-01.png', 'wall-corners-left_top-02.png', 'wall-corners-left_top-03.png'],
            tr: ['wall-corners-right_top-01.png', 'wall-corners-right_top-02.png', 'wall-corners-right_top-03.png', 'wall-corners-right_top-04.png'],
            bl: ['wall-corners-left_botton-01.png', 'wall-corners-left_botton-02.png', 'wall-corners-left_botton-03.png', 'wall-corners-left_botton-04.png'],
            br: ['wall-corners-right_botton-01.png', 'wall-corners-right_botton-02.png', 'wall-corners-right_botton-03.png']
        };
        this.topFrames = ['wall-top-01.png', 'wall-top-02.png', 'wall-top-03.png'];
        this.bottomFrame = 'wall-botton.png'; // nombre en atlas viene con typo
        this.decoChance = 0;
    }

    getTile(frame) {
        if (this.debugTiles) {
            this.ensureDebugTexture();
            frame = this.debugTextureKey;
        } else if (!this.scene.textures.exists('walls')) {
            return null;
        }
        let tile = this.pool.find(t => !t.active);
        if (!tile) {
            tile = this.scene.add.image(0, 0, this.debugTiles ? frame : 'walls', frame);
            tile.setOrigin(0.5, 0.5);
            tile.setDepth(11); // encima del bloque del maze (depth 10)
            this.pool.push(tile);
        }
        tile.setTexture(this.debugTiles ? frame : 'walls', frame);
        tile.setActive(true);
        tile.setVisible(true);
        return tile;
    }

    pickFillFrame() {
        return this.plainFrames[Phaser.Math.Between(0, this.plainFrames.length - 1)];
    }

    pickRandom(list) {
        if (!list || list.length === 0) return null;
        return list[Phaser.Math.Between(0, list.length - 1)];
    }

    decorateBlock(block, width, height) {
        if (!block || !block.active) return;
        const ts = this.tileSize;
        // Usamos displayWidth/displayHeight y origin del bloque para alinear el skin exactamente al sprite.
        const displayW = block.displayWidth || width;
        const displayH = block.displayHeight || height;
        const cols = Math.max(1, Math.ceil(displayW / ts));
        const rows = Math.max(1, Math.ceil(displayH / ts));
        const startX = block.x - displayW * block.originX + ts / 2;
        const startY = block.y - displayH * block.originY + ts / 2;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let frame = this.pickFillFrame();
                const isTop = r === 0;
                const isBottom = r === rows - 1;
                const isLeft = c === 0;
                const isRight = c === cols - 1;
                // Esquinas
                if (isTop && isLeft && this.cornerFrames.tl) frame = this.pickRandom(this.cornerFrames.tl);
                else if (isTop && isRight && this.cornerFrames.tr) frame = this.pickRandom(this.cornerFrames.tr);
                else if (isBottom && isLeft && this.cornerFrames.bl) frame = this.pickRandom(this.cornerFrames.bl);
                else if (isBottom && isRight && this.cornerFrames.br) frame = this.pickRandom(this.cornerFrames.br);
                // Bordes superiores/ inferiores
                else if (isTop && this.topFrames && this.topFrames.length > 0) frame = this.pickRandom(this.topFrames);
                else if (isBottom && this.bottomFrame) frame = this.bottomFrame;

                const tile = this.getTile(frame);
                if (tile) tile.setPosition(startX + c * ts, startY + r * ts);
            }
        }
    }

    hideAll() {
        this.pool.forEach(t => {
            t.setActive(false);
            t.setVisible(false);
        });
    }

    ensureDebugTexture() {
        if (this.scene.textures.exists(this.debugTextureKey)) return;
        const g = this.scene.make.graphics({ x: 0, y: 0 });
        g.fillStyle(0x2222ff, 0.15);
        g.fillRect(0, 0, this.tileSize, this.tileSize);
        g.lineStyle(1, 0x00ff00, 0.6);
        g.strokeRect(0.5, 0.5, this.tileSize - 1, this.tileSize - 1);
        g.generateTexture(this.debugTextureKey, this.tileSize, this.tileSize);
        g.destroy();
    }
}
