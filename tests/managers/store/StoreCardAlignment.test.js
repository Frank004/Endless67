/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { STORE_CARD_CONSTANTS } from '../../../src/managers/ui/store/StoreCardConstants.js';

let StoreCard; // Will be imported dynamically

// Setup basic mocks for Phaser
const mockScene = {
    add: {
        container: jest.fn(() => ({
            add: jest.fn(),
            removeAll: jest.fn(),
            destroy: jest.fn()
        })),
        image: jest.fn(() => ({
            setOrigin: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setFrame: jest.fn().mockReturnThis(),
            frame: { name: 'cardbox.png' }
        })),
        text: jest.fn(() => ({
            setOrigin: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            width: 50,
            updateText: jest.fn()
        }))
    },
    input: {
        enableDebug: jest.fn()
    },
    tweens: {
        add: jest.fn()
    },
    isDragging: false
};

// Mock Phaser Geom properties that StoreCard uses
global.Phaser = {
    GameObjects: {
        Container: class {
            constructor(scene, x, y) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.list = [];
                this.add = jest.fn((child) => this.list.push(child));
                this.setSize = jest.fn((w, h) => { this.width = w; this.height = h; });
                this.setInteractive = jest.fn((shape) => {
                    this.input = { hitArea: shape };
                    return this; // Phaser methods are chainable
                });
                this.removeInteractive = jest.fn(() => { this.input = null; });
                this.on = jest.fn();
            }
        }
    },
    Geom: {
        Rectangle: class {
            constructor(x, y, w, h) {
                this.x = x;
                this.y = y;
                this.width = w;
                this.height = h;
            }
            static Contains() { return true; }
        }
    },
    Math: {
        Distance: {
            Between: () => 0
        }
    }
};

describe('StoreCard Alignment Tests', () => {
    let storeCard;
    const skinData = {
        id: 'test_skin',
        name: 'Test Skin',
        cost: 100,
        owned: false,
        equipped: false,
        rarity: 'common'
    };

    beforeAll(async () => {
        const module = await import('../../../src/managers/ui/store/StoreCard.js');
        StoreCard = module.StoreCard;
    });

    beforeEach(() => {
        storeCard = new StoreCard(mockScene, 100, 100, skinData, 500);
    });

    test('StoreCard should set correct dimensions from constants', () => {
        expect(storeCard.width).toBe(STORE_CARD_CONSTANTS.WIDTH);
        expect(storeCard.height).toBe(STORE_CARD_CONSTANTS.HEIGHT);
    });

    test('HitArea should match background dimensions and position', () => {
        // 1. Check HitArea Rect matches Container Dimension (0,0 relative)
        const hitArea = storeCard.input.hitArea;
        expect(hitArea).toBeDefined();
        expect(hitArea.x).toBe(0);
        expect(hitArea.y).toBe(0);
        expect(hitArea.width).toBe(STORE_CARD_CONSTANTS.WIDTH);
        expect(hitArea.height).toBe(STORE_CARD_CONSTANTS.HEIGHT);

        // 2. Check Background Image is centered
        // We need to inspect the StoreCardBackground's image creation call
        // In our mock, scene.add.image was called. 
        // The first call should be for the background.
        const addImageCalls = mockScene.add.image.mock.calls;
        const bgCall = addImageCalls[0]; // [x, y, key, texture]

        const expectedCenterX = STORE_CARD_CONSTANTS.WIDTH / 2;
        const expectedCenterY = STORE_CARD_CONSTANTS.HEIGHT / 2;

        expect(bgCall[0]).toBe(expectedCenterX);
        expect(bgCall[1]).toBe(expectedCenterY);

        // 3. Confirm alignment logic
        // HitArea Center in Local Space
        const hitAreaCenterX = hitArea.x + (hitArea.width / 2);
        const hitAreaCenterY = hitArea.y + (hitArea.height / 2);

        expect(hitAreaCenterX).toBe(expectedCenterX);
        expect(hitAreaCenterY).toBe(expectedCenterY);
    });
});
