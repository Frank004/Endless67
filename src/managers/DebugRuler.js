/**
 * DebugRuler - overlay opcional para medir distancias entre plataformas.
 * - Dibuja líneas horizontales cada GRID px.
 * - Muestra dx/dy entre plataformas cercanas y la distancia a la siguiente plataforma por encima del jugador.
 */
export class DebugRuler {
    constructor(scene) {
        this.scene = scene;
        this.enabled = false;
        this.graphics = null;
        this.texts = [];
        // Grid de referencia en px (ajustado a 32px)
        this.GRID = 32;
        this.FONT_STYLE = { fontSize: '10px', color: '#ff0' };
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clear();
        }
    }

    clear() {
        if (this.graphics) {
            this.graphics.clear();
            this.graphics.destroy();
            this.graphics = null;
        }
        this.texts.forEach(t => t.destroy());
        this.texts = [];
    }

    update(platforms, player) {
        if (!this.enabled) return;
        if (!this.graphics) {
            this.graphics = this.scene.add.graphics({ lineStyle: { width: 1, color: 0x00ff00, alpha: 0.25 } });
        }
        this.graphics.clear();
        this.texts.forEach(t => t.destroy());
        this.texts = [];

        const cam = this.scene.cameras.main;
        const top = cam.scrollY - 20;
        const bottom = cam.scrollY + cam.height + 20;

        // Líneas horizontales cada GRID px
        for (let y = Math.floor(bottom / this.GRID) * this.GRID; y >= top; y -= this.GRID) {
            this.graphics.lineStyle(1, 0x00ff00, y % 100 === 0 ? 0.5 : 0.2);
            this.graphics.beginPath();
            this.graphics.moveTo(0, y);
            this.graphics.lineTo(cam.width, y);
            this.graphics.closePath();
            this.graphics.strokePath();
        }

        if (!platforms) return;

        // Ordenar plataformas activas visibles
        const plats = platforms
            .filter(p => p.active && p.y > top && p.y < bottom)
            .sort((a, b) => a.y - b.y);

        // dy entre plataformas consecutivas
        for (let i = 1; i < plats.length; i++) {
            const dy = plats[i].y - plats[i - 1].y;
            const midX = (plats[i].x + plats[i - 1].x) / 2;
            const midY = (plats[i].y + plats[i - 1].y) / 2;
            const txt = this.scene.add.text(midX - 10, midY, `${Math.round(dy)}y`, this.FONT_STYLE).setDepth(2000);
            this.texts.push(txt);
        }

        // Distancia desde el jugador a la siguiente plataforma superior
        if (player) {
            const above = plats.find(p => p.y < player.y);
            if (above) {
                const dy = player.y - above.y;
                const txt = this.scene.add.text(player.x + 20, (player.y + above.y) / 2, `↑${Math.round(dy)}`, this.FONT_STYLE).setDepth(2000);
                this.texts.push(txt);
                this.graphics.lineStyle(1, 0xff00ff, 0.5);
                this.graphics.beginPath();
                this.graphics.moveTo(player.x, player.y);
                this.graphics.lineTo(player.x, above.y);
                this.graphics.strokePath();
            }
        }
    }
}

export default DebugRuler;

