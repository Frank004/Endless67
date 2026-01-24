import ScoreManager from '../Systems/Gameplay/ScoreManager.js';
import { InputSystem } from '../Systems/Core/InputSystem.js';
import { UIHelpers } from '../Utils/UIHelpers.js';
import { MenuNavigation } from '../UI/Menus/MenuNavigation.js';
import EventBus, { Events } from '../Core/EventBus.js';

export class Leaderboard extends Phaser.Scene {
    constructor() {
        super('Leaderboard');
        this.menuNavigation = null;
    }

    create() {
        // --- INPUT MANAGER ---
        this.inputManager = new InputSystem(this);
        this.inputManager.setupInputs();

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x050505);

        // Title
        this.add.text(width / 2, 60, 'TOP 10 SCORES', {
            fontSize: '32px',
            color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Headers - optimized for mobile and large numbers
        const isMobile = width < 400;
        const fontSize = isMobile ? '14px' : '16px';
        const headerY = 120;

        this.add.text(20, headerY, 'RANK', { fontSize: fontSize, color: '#888' });
        this.add.text(80, headerY, 'NAME', { fontSize: fontSize, color: '#888' });
        this.add.text(isMobile ? 160 : 200, headerY, 'HEIGHT', { fontSize: fontSize, color: '#888' });
        this.add.text(isMobile ? 260 : 300, headerY, 'COINS', { fontSize: fontSize, color: '#888' });

        // Scores
        const scores = ScoreManager.getTopScores();
        let y = 160;

        if (scores.length === 0) {
            this.add.text(width / 2, height / 2, 'NO SCORES YET', {
                fontSize: '20px',
                color: '#444'
            }).setOrigin(0.5);
        } else {
            scores.forEach((score, index) => {
                const color = index === 0 ? '#ffd700' : (index === 1 ? '#c0c0c0' : (index === 2 ? '#cd7f32' : '#ffffff'));

                this.add.text(35, y, `#${index + 1}`, { fontSize: fontSize, color: color }).setOrigin(0.5, 0);
                this.add.text(95, y, score.name, { fontSize: fontSize, color: color }).setOrigin(0.5, 0);
                this.add.text(isMobile ? 195 : 235, y, `${score.height}m`, { fontSize: fontSize, color: color }).setOrigin(0.5, 0);
                this.add.text(isMobile ? 295 : 335, y, `${score.coins}`, { fontSize: fontSize, color: color }).setOrigin(0.5, 0);

                y += isMobile ? 32 : 35;
            });
        }

        // Back Button
        const backBtn = UIHelpers.createTextButton(this, width / 2, height - 60, 'BACK TO MENU', {
            textColor: '#ffffff',
            backgroundColor: '#333333',
            callback: () => this.scene.start('MainMenu')
        });

        // Navigation
        this.menuNavigation = new MenuNavigation(this, [backBtn]);
        this.menuNavigation.setup();

        // Handle specific Back action (Escape) separately if desired
        const onBack = () => this.scene.start('MainMenu');
        EventBus.on(Events.UI_BACK, onBack, this);

        // Clean up listeners
        this.events.once('shutdown', () => {
            if (this.menuNavigation) this.menuNavigation.cleanup();
            EventBus.off(Events.UI_BACK, onBack, this);
        });
    }

    update(time, delta) {
        if (this.inputManager) {
            this.inputManager.update(time, delta);
        }
    }
}
