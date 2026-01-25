
import { StoreCardBackground } from '../../../src/UI/Store/StoreCardBackground.js';
import { STORE_CARD_CONSTANTS } from '../../../src/UI/Store/StoreCardConstants.js';

describe('StoreCardBackground', () => {
    let background;
    let mockScene;
    let mockContainer;
    let mockImage;

    beforeEach(() => {
        mockImage = {
            setOrigin: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setFrame: jest.fn().mockReturnThis(),
            frame: { name: 'default' }
        };

        mockScene = {
            add: {
                image: jest.fn(() => mockImage)
            }
        };

        mockContainer = {
            add: jest.fn()
        };

        background = new StoreCardBackground(mockScene, mockContainer);
        // Manually trigger create to setup image
        background.create();
    });

    test('updateTexture sets correct texture for states', () => {
        // 1. Owned -> Still Rarity/Common (OWNED logic currently disabled)
        background.updateTexture('common', true, false);
        expect(mockImage.setFrame).toHaveBeenCalledWith(STORE_CARD_CONSTANTS.TEXTURES.COMMON);

        // 2. Not Owned, Not Affordable -> Still shows Rarity Box (Lock icon handles disabled state)
        background.updateTexture('rare', false, false);
        expect(mockImage.setFrame).toHaveBeenCalledWith(STORE_CARD_CONSTANTS.TEXTURES.RARE);

        // 3. Not Owned, Affordable -> Rarity Box
        background.updateTexture('common', false, true);
        expect(mockImage.setFrame).toHaveBeenCalledWith(STORE_CARD_CONSTANTS.TEXTURES.COMMON);

        background.updateTexture('rare', false, true);
        expect(mockImage.setFrame).toHaveBeenCalledWith(STORE_CARD_CONSTANTS.TEXTURES.RARE);

        background.updateTexture('epic', false, true);
        expect(mockImage.setFrame).toHaveBeenCalledWith(STORE_CARD_CONSTANTS.TEXTURES.EPIC);

        background.updateTexture('legendary', false, true);
        expect(mockImage.setFrame).toHaveBeenCalledWith(STORE_CARD_CONSTANTS.TEXTURES.LEGENDARY);
    });
});
