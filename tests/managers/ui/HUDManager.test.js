
import { HUDManager } from '../../../src/managers/ui/hud/HUDManager.js';

describe('HUDManager', () => {
    let hud;
    let mockScene;
    let mockText;
    let mockRect;

    beforeEach(() => {
        mockText = {
            setOrigin: jest.fn().mockReturnThis(),
            setScrollFactor: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setText: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis()
        };

        mockRect = {
            setOrigin: jest.fn().mockReturnThis(),
            setScrollFactor: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis()
        };

        mockScene = {
            isMobile: false,
            cameras: {
                main: { centerX: 200 }
            },
            currentHeight: 0,
            add: {
                text: jest.fn(() => mockText),
                rectangle: jest.fn(() => mockRect)
            }
        };

        hud = new HUDManager(mockScene);
    });

    test('should init properties', () => {
        expect(hud.scoreText).toBeNull();
        expect(hud.uiText).toBeNull();
    });

    test('create should add visual elements', () => {
        hud.create();

        expect(mockScene.add.text).toHaveBeenCalledTimes(3); // Score, Height, Title
        expect(mockScene.add.rectangle).toHaveBeenCalledTimes(2); // Score BG, Height BG

        expect(hud.scoreText).toBe(mockText);
        expect(hud.heightText).toBe(mockText);
    });

    test('updateScore should update text', () => {
        hud.create();
        hud.updateScore(500);
        expect(mockText.setText).toHaveBeenCalledWith('COINS: 500');
    });

    test('updateHeight should update text', () => {
        hud.create();
        hud.updateHeight(123);
        expect(mockText.setText).toHaveBeenCalledWith('HEIGHT: 123m');
    });

    test('showGameOver should show game over text', () => {
        hud.create();
        hud.showGameOver({ height: 999 });
        expect(mockText.setVisible).toHaveBeenCalledWith(true);
        expect(mockText.setText).toHaveBeenCalledWith(expect.stringContaining('GAME OVER'));
        expect(mockText.setText).toHaveBeenCalledWith(expect.stringContaining('999'));
    });

    test('hideUIText should hide title text', () => {
        hud.create();
        hud.hideUIText();
        expect(mockText.setVisible).toHaveBeenCalledWith(false);
    });
});
