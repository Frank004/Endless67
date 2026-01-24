
import { StoreCard } from '../../../src/UI/Store/StoreCard.js';
import { ASSETS } from '../../../src/Config/AssetKeys.js';

// Mock Phaser
const mockScene = {
    add: {
        image: jest.fn().mockReturnValue({
            setOrigin: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setFrame: jest.fn().mockReturnThis(),
            setTint: jest.fn().mockReturnThis(),
            clearTint: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            frame: { name: 'default' }
        }),
        text: jest.fn().mockReturnValue({
            setOrigin: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            setColor: jest.fn().mockReturnThis(),
            setText: jest.fn().mockReturnThis(),
            destroy: jest.fn()
        }),
        container: jest.fn().mockReturnValue({
            add: jest.fn()
        })
    }
};

describe('StoreCard', () => {
    let storeCard;
    const skinData = {
        id: 'skin_1',
        name: 'Test Skin',
        cost: 100,
        rarity: 'rare',
        owned: false,
        equipped: false
    };

    beforeEach(() => {
        // We can't fully instantiate StoreCard because it extends Phaser.GameObjects.Container 
        // and calling super() with a mock scene usually fails if Phaser isn't fully mocked.
        // However, we can test the logic methods like getCardTexture directly if we prototype mock or just inspect the function.
        // Or cleaner: we verify logic by mocking the class methods or extracting logic.

        // Since StoreCard is a class, we can test `getCardTexture` if we instantiate it. 
        // But instantiation might fail due to `super(scene)`.
        // Let's rely on testing the logic method by creating a partial mock or attaching the method to a dummy object if it was pure.
        // But it's an instance method.
    });

    test('getCardTexture returns correct texture for states', () => {
        // Hack to test the method without full instantiation if super fails:
        // We can just look at the class prototype 
        const getCardTexture = StoreCard.prototype.getCardTexture;

        // 1. Owned -> Own Box
        expect(getCardTexture.call(null, 'common', true, false)).toBe('cardbox-own.png');
        expect(getCardTexture.call(null, 'legendary', true, true)).toBe('cardbox-own.png');

        // 2. Not Owned, Not Affordable -> Disable Box
        expect(getCardTexture.call(null, 'rare', false, false)).toBe('cardbox-disable.png');

        // 3. Not Owned, Affordable -> Rarity Box
        expect(getCardTexture.call(null, 'common', false, true)).toBe('cardbox.png');
        expect(getCardTexture.call(null, 'rare', false, true)).toBe('cardbox-rare.png');
        expect(getCardTexture.call(null, 'epic', false, true)).toBe('cardbox-epic.png');
        expect(getCardTexture.call(null, 'legendary', false, true)).toBe('cardbox-legend.png');
    });
});
