import { ASSETS } from '../config/AssetKeys.js';
import { StoreCard } from '../managers/ui/store/StoreCard.js';
import { StoreManager } from '../managers/store/StoreManager.js';
import { UIHelpers } from '../utils/UIHelpers.js';
import SkinCatalogService from '../managers/gameplay/SkinCatalogService.js';
import PlayerProfileService from '../managers/gameplay/PlayerProfileService.js';

/**
 * Store - "The Vault"
 * 
 * Resolución: 360×640 px
 * Layout:
 * - Header fijo (64px): Título "THE VAULT" + Coin Counter
 * - Grid scrolleable: 2 columnas × N filas (4 cards visibles)
 * - Card size: 140×160 px cada uno (reducido)
 * - Footer: Back button (estilo estándar)
 * 
 * Integra la lógica de negocio de SkinCatalogService y PlayerProfileService
 */
export class Store extends Phaser.Scene {
    constructor() {
        super('Store');

        // Layout constants (360×640 design)
        this.HEADER_HEIGHT = 0;  // Increased for more breathing room
        this.FOOTER_HEIGHT = 60;
        this.PADDING_SIDE = 20;
        this.COLUMN_GAP = 10;
        this.ROW_GAP = 20;
        this.CARD_WIDTH = 140;
        this.CARD_HEIGHT = 160; // Matched with StoreCardConstants

        // Business logic
        this._catalog = null;
        this._equipChanged = false;
        this._profile = null;
    }

    create() {
        this.cards = []; // Reset cards array to avoid stale references
        const { width, height } = this.cameras.main;

        // Background
        this.add.image(width / 2, height / 2, ASSETS.STORE, 'storebg.png')
            .setOrigin(0.5)
            .setScrollFactor(0);

        // Create fixed header
        this.createHeader();

        // Create footer with back button
        this.createFooter();

        // Setup store (async)
        this._setupStore();

        // Setup input
        this.setupInput();
    }

    createHeader() {
        const { width } = this.cameras.main;
        const headerY = this.HEADER_HEIGHT / 2 + 85; // Lowered title position

        // Header container (fixed, no scroll)
        this.headerContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

        // Title: "THE VAULT"
        const title = this.add.text(width / 2, headerY, 'THE VAULT', {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);

        // -- DYNAMIC COIN COUNTER --
        // Container anchored to Top-Right
        const cardMargin = 10;
        this.coinCounterContainer = this.add.container(width - cardMargin, cardMargin).setScrollFactor(0);

        // 1. Background Rect (Placeholder size, updated dynamically)
        this.coinBg = this.add.rectangle(0, 0, 100, 36, 0x000000, 0.85).setOrigin(1, 0);

        // 2. Coin Text (Anchor Right inside container)
        // Padding from right edge of container
        const textPaddingRight = 15;
        this.coinText = this.add.text(-textPaddingRight, 18, '0', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffdd00',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5); // Right-Center

        // 3. Coin Icon (Positioned relative to text)
        this.coinIcon = this.add.image(0, 18, ASSETS.COINS, 'coin-01.png')
            .setOrigin(0.1, 0.4)
            .setScale(2.5); // Match StoreCard scale

        this.coinCounterContainer.add([this.coinBg, this.coinText, this.coinIcon]);
        this.headerContainer.add([title, this.coinCounterContainer]);

        // Initial Layout Update
        this.updateCoinVisuals();
    }

    updateCoinVisuals() {
        if (!this.coinText || !this.coinIcon || !this.coinBg) return;

        // Ensure text metrics are fresh
        this.coinText.updateText();

        let textWidth = this.coinText.width;

        // Fallback for first frame or zero width
        if (textWidth === 0 && this.coinText.text) {
            textWidth = this.coinText.text.length * 12; // Estimate
        }

        const iconPadding = 8;
        const containerPadding = 15;

        // Layout: [ (Icon Center) ] --padding-- [Text(Right)]
        const coinDisplayWidth = this.coinIcon.displayWidth || (16 * 2.5);

        // Determine critical X positions
        const textRightX = this.coinText.x;
        const textLeftX = textRightX - textWidth;

        const iconRightX = textLeftX - iconPadding;
        const iconCenterX = iconRightX - (coinDisplayWidth / 2);

        this.coinIcon.setX(iconCenterX);

        const iconLeftX = iconCenterX - (coinDisplayWidth / 2);

        // Total from Right(0) to IconLeft(negative) + Padding
        const totalWidth = Math.abs(iconLeftX) + containerPadding;

        this.coinBg.width = totalWidth;
    }

    updateCoins(amount) {
        this.headerCoins = amount;
        if (this.coinText) {
            const formatted = UIHelpers.formatCurrency(amount);
            this.coinText.setText(formatted);
            this.updateCoinVisuals();
        }
    }

    createFooter() {
        const { width, height } = this.cameras.main;

        // Back button (estilo UIHelpers estándar)
        this.btnBack = UIHelpers.createTextButton(this, width / 2, height - 30, 'BACK', {
            textColor: '#ffffff',
            fontSize: '20px',
            callback: () => this._handleBack()
        });
        this.btnBack.container.setScrollFactor(0).setDepth(100);
    }

    async _setupStore() {
        // Initialize logic manager
        this.storeManager = new StoreManager();
        await this.storeManager.init();

        this._refreshUI();
    }

    _refreshUI() {
        // Get fresh state from manager
        const coins = this.storeManager.getCoins();
        const skinsWithState = this.storeManager.getSkinsWithState();

        // Update Header
        this.updateCoins(coins);

        // Update existing cards or create new grid
        if (this.cards && this.cards.length > 0) {
            this._updateExistingCards(skinsWithState, coins);
        } else {
            this.createScrollableGrid(skinsWithState);
        }
    }

    _updateExistingCards(skinsWithState, coins) {
        // Map of skin ID to state
        const stateMap = new Map(skinsWithState.map(s => [s.id, s]));

        this.cards.forEach(card => {
            const newState = stateMap.get(card.skinData.id);
            if (newState) {
                // Update card data
                card.skinData.owned = newState.owned;
                card.skinData.equipped = newState.equipped;
                // Update visuals
                card.updateAffordableState(coins);
            }
        });
    }

    createScrollableGrid(skins) {
        const { width, height } = this.cameras.main;

        // Calculate total grid height first
        const totalRows = Math.ceil(skins.length / 2);
        const totalGridHeight = (totalRows * this.CARD_HEIGHT) + ((totalRows - 1) * this.ROW_GAP);

        // Available vertical space (with padding from header)
        const headerPadding = 20; // Reduced space from header
        const availableHeight = height - this.HEADER_HEIGHT - this.FOOTER_HEIGHT - headerPadding;

        // Start grid below header with padding
        this.gridStartY = this.HEADER_HEIGHT + headerPadding + Math.max(0, (availableHeight - totalGridHeight) / 2);

        // Recalculate horizontal centering
        const effectiveColumnGap = 20; // Increased gap
        const totalCardWidth = (this.CARD_WIDTH * 2) + effectiveColumnGap;
        const gridStartX = (width - totalCardWidth) / 2;

        const col1X = gridStartX;
        const col2X = col1X + this.CARD_WIDTH + effectiveColumnGap;

        // Container for all cards (scrollable)
        this.gridContainer = this.add.container(0, this.gridStartY);

        // Create cards in grid
        this.cards = [];
        let row = 0;
        let col = 0;

        skins.forEach((skin, index) => {
            const x = col === 0 ? col1X : col2X;
            const y = row * (this.CARD_HEIGHT + this.ROW_GAP);

            // Skin data is already prepared by StoreManager
            const skinData = {
                id: skin.id,
                name: skin.name,
                cost: skin.priceCoins,
                owned: skin.owned,
                equipped: skin.equipped,
                rarity: skin.rarity || 'common'
            };

            const card = new StoreCard(
                this,
                x,
                y,
                skinData,
                this.storeManager.getCoins()
            );

            card.on('cardClick', (data) => this._handleCardInteraction(card, data));

            this.gridContainer.add(card);
            this.cards.push(card);

            // Move to next position
            col++;
            if (col >= 2) {
                col = 0;
                row++;
            }
        });

        // Store grid height for scroll calculations
        this.gridHeight = totalGridHeight;

        // Visible area height
        this.visibleHeight = Math.min(availableHeight, (2 * this.CARD_HEIGHT) + this.ROW_GAP);

        // Enable scroll if content exceeds visible area
        if (this.gridHeight > this.visibleHeight) {
            this.enableScroll();
        }
    }

    enableScroll() {
        const { height } = this.cameras.main;

        // Max scroll (grid can scroll up)
        this.maxScroll = Math.max(0, this.gridHeight - this.visibleHeight);
        this.currentScroll = 0;

        // Scroll bounds
        this.scrollBounds = {
            top: this.HEADER_HEIGHT,
            bottom: height - this.FOOTER_HEIGHT
        };

        // Enable drag scroll
        this.input.on('pointerdown', (pointer) => {
            if (pointer.y > this.scrollBounds.top && pointer.y < this.scrollBounds.bottom) {
                this.isDragging = true;
                this.dragStartY = pointer.y;
                this.dragStartScroll = this.currentScroll;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                const deltaY = pointer.y - this.dragStartY;
                const newScroll = Phaser.Math.Clamp(
                    this.dragStartScroll - deltaY,
                    0,
                    this.maxScroll
                );
                this.setScroll(newScroll);
            }
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        // Mouse wheel scroll
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            const newScroll = Phaser.Math.Clamp(
                this.currentScroll + deltaY * 0.5,
                0,
                this.maxScroll
            );
            this.setScroll(newScroll);
        });
    }

    setScroll(value) {
        this.currentScroll = value;
        this.gridContainer.y = this.gridStartY - this.currentScroll;
    }

    setupInput() {
        // ESC to go back
        this.input.keyboard.on('keydown-ESC', () => this._handleBack());
    }

    _handleCardInteraction(card, data) {
        const { skinData } = data;

        // 1. Is it equipped? (No action needed usually, or maybe toggle off?)
        if (skinData.equipped) {
            return;
        }

        // 2. Is it owned? (Equip it)
        if (skinData.owned) {
            if (this.storeManager.equipSkin(skinData.id)) {
                this._equipChanged = true;
                console.log(`✅ Equipped: ${skinData.name}`);

                // Visual success on card
                card.animateSuccess();

                // Refresh UI (will update all cards' equipped status)
                this._refreshUI();
            }
            return;
        }

        // 3. Not owned (Try Purchase)
        const result = this.storeManager.purchaseSkin(skinData.id, skinData.cost);
        if (result.success) {
            this._playPurchaseFx();
            console.log(`✅ Purchased: ${skinData.name}`);

            // Visual success on card
            card.animateSuccess();

            // Refresh UI
            this._refreshUI();
        } else {
            // Purchase failed (e.g. low funds)
            // Visual fail on card
            this.cameras.main.shake(100, 0.005); // Global feedback
            card.animateFail(); // Local card feedback
        }
    }

    _handleBack() {
        if (this._equipChanged) {
            // Reload assets if skin was changed
            this.scene.start('Preloader');
            return;
        }
        this.scene.start('MainMenu');
    }

    _updateCoins(profile) {
        // Deprecated by direct logic in _refreshUI, but kept if needed by inheritance or mixins
        // Can be removed if unused.
    }

    _playPurchaseFx() {
        if (!this.gridContainer) return;
        this.tweens.add({
            targets: this.gridContainer,
            scale: 1.02,
            duration: 120,
            yoyo: true
        });
    }
}
