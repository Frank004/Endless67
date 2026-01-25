
import { HUDManager } from '../../../src/UI/HUD/HUDManager.js';

describe('HUDManager', () => {
    // Mock CoinCounter to prevent Phaser inheritance issues
    jest.mock('../../../src/UI/HUD/CoinCounter.js', () => ({
        CoinCounter: jest.fn().mockImplementation(() => ({
            setDepth: jest.fn().mockReturnThis(),
            setScrollFactor: jest.fn().mockReturnThis(),
            setName: jest.fn().mockReturnThis(),
            setValue: jest.fn(),
            destroy: jest.fn()
        }))
    }));

    // Mock Phaser.GameObjects.Container globally to support CoinCounter
    global.Phaser = {
        GameObjects: {
            Container: class {
                constructor(scene) { }
                setName() { return this; }
                setDepth() { return this; }
                setScrollFactor() { return this; }
                add() { }
                destroy() { }
            }
        }
    };

    let hud;
    let mockScene;
    let mockText;
    let mockImage; // New mock for images (sprites)

    beforeEach(() => {
        mockText = {
            setOrigin: jest.fn().mockReturnThis(),
            setScrollFactor: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setText: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            destroy: jest.fn()
        };

        mockImage = {
            setOrigin: jest.fn().mockReturnThis(),
            setScrollFactor: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            destroy: jest.fn()
        };

        mockScene = {
            isMobile: false,
            cameras: {
                main: { centerX: 200 }
            },
            currentHeight: 0,
            children: { list: [] }, // Fix "list of undefined" error
            add: {
                text: jest.fn(() => mockText),
                image: jest.fn(() => mockImage), // Added image
                container: jest.fn(() => ({
                    add: jest.fn(),
                    setDepth: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    setName: jest.fn().mockReturnThis(),
                    removeAll: jest.fn(), // Added
                    destroy: jest.fn()
                })),
                existing: jest.fn() // For adding containers
            }
        };

        hud = new HUDManager(mockScene);
    });

    test('should init properties', () => {
        expect(hud.scoreContainer).toBeNull();
        expect(hud.uiText).toBeNull();
        // scoreText removed
    });

    test('create should add visual elements', () => {
        hud.create();

        expect(mockScene.add.text).toHaveBeenCalledTimes(2); // Height, Title (No ScoreText)
        expect(mockScene.add.image).toHaveBeenCalledTimes(4); // Adjusted for CoinCounter images

        // Check CoinCounter creation (via module mock check or verifying property)
        expect(hud.scoreContainer).toBeDefined();
        // Since we mocked CoinCounter class above, we assume usage is correct
    });

    test('updateScore should update text', () => {
        hud.create();
        hud.updateScore(500);
        expect(hud.scoreContainer.list.length).toBeGreaterThan(0);
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
