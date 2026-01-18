import { ASSETS } from '../config/AssetKeys.js';
import { StoreCard } from '../managers/ui/store/StoreCard.js';
import { StoreManager } from '../managers/store/StoreManager.js';
import { UIHelpers } from '../utils/UIHelpers.js';
import SkinCatalogService from '../managers/gameplay/SkinCatalogService.js';
import PlayerProfileService from '../managers/gameplay/PlayerProfileService.js';

/**
 * Store - "The Vault"
 * Handles the purchasing and equipping of skins.
 */
export class Store extends Phaser.Scene {
    constructor() {
        super('Store');

        // Layout constants (360×640 design)
        this.HEADER_HEIGHT = 0;  // Increased for more breathing room
        this.FOOTER_HEIGHT = 60;
        this.PADDING_SIDE = 20;
        this.COLUMN_GAP = 10;
        this.ROW_GAP = 10;
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

        // BLOCK INTERACTIONS INITIALLY (Cooldown on load)
        this._interactionBlocked = true;
        this.time.delayedCall(500, () => {
            this._interactionBlocked = false;
        });

        // --- DEBUG HELPERS ---
        // Expose debug tools for testing
        window.STORE_DEBUG = {
            addCoins: (amount) => {
                // Dynamically import service to add coins for testing
                import('../managers/gameplay/PlayerProfileService.js').then(module => {
                    const service = module.default;
                    const newProfile = service.addCoins(amount);
                    console.log(`💰 Added ${amount} coins. New Balance: ${newProfile.currency.coins}`);
                    this._refreshUI();
                });
            },
            resetProfile: () => {
                localStorage.removeItem('endless67_profile_v1');
                location.reload();
            }
        };
        console.log('🔧 STORE DEBUG: Use window.STORE_DEBUG.addCoins(50000)');
    }

    createHeader() {
        const { width } = this.cameras.main;
        const headerY = this.HEADER_HEIGHT / 2 + 75; // Lowered title position

        // Header container (fixed, no scroll)
        this.headerContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

        // Title: "THE VAULT" (Logo)
        const logo = this.add.image(width / 2, headerY, ASSETS.STORE_LOGO)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setScale(0.2);

        // Scale down if strictly necessary, but respecting the new base scale
        if (logo.displayWidth > 280) {
            logo.setDisplaySize(280, logo.displayHeight * (280 / logo.displayWidth));
        }

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
        this.headerContainer.add([logo, this.coinCounterContainer]);

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
            this.createPagedGrid(skinsWithState);
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

    createPagedGrid(skins) {
        const { width, height } = this.cameras.main;

        // --- Paging Setup ---
        const CARDS_PER_PAGE = 4;
        this.totalPages = Math.ceil(skins.length / CARDS_PER_PAGE);
        this.currentPage = 0;

        // --- Grid Measurements ---
        const effectiveColumnGap = 20;
        const totalCardWidth = (this.CARD_WIDTH * 2) + effectiveColumnGap;
        // Total grid height (2 rows)
        const totalGridHeight = (this.CARD_HEIGHT * 2) + this.ROW_GAP;

        // Calculate offsets to center 2x2 grid in the "Body" area
        const headerPadding = 20;
        const availableHeight = height - this.HEADER_HEIGHT - this.FOOTER_HEIGHT - headerPadding;
        const startY = this.HEADER_HEIGHT + headerPadding + Math.max(0, (availableHeight - totalGridHeight) / 2);

        // Horizontal centering
        const startX = (width - totalCardWidth) / 2;
        const col1X = startX;
        const col2X = col1X + this.CARD_WIDTH + effectiveColumnGap;

        // --- Container ---
        // We will move this container horizontally to change pages
        this.gridContainer = this.add.container(0, 0);

        // --- SWIPE AREA (Background Layer) ---
        // A transparent interactive layer BEHIND the cards to ensure swipes are caught 
        // even if starting between cards, while still allowing card clicks.
        const totalContainerWidth = width * this.totalPages;
        const swipeZoneHeight = height * 0.7; // Cover main area

        const swipeZone = this.add.rectangle(
            (width * this.totalPages) / 2 - (width / 2), // Center relative to container
            height / 2,
            totalContainerWidth,
            swipeZoneHeight,
            0x000000, 0 // Invisible (Alpha 0)
        ).setOrigin(0.5);

        // Add to container FIRST so it renders behind cards
        this.gridContainer.add(swipeZone);

        this.cards = [];

        // --- Create Cards ---
        skins.forEach((skin, index) => {
            const pageIndex = Math.floor(index / CARDS_PER_PAGE);
            const indexInPage = index % CARDS_PER_PAGE;

            const row = Math.floor(indexInPage / 2);
            const col = indexInPage % 2;

            // X Position includes Page Offset
            const x = (pageIndex * width) + (col === 0 ? col1X : col2X);
            const y = startY + (row * (this.CARD_HEIGHT + this.ROW_GAP));

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

            // Listen for card click
            card.on('cardClick', (data) => this._handleCardInteraction(card, data));

            this.gridContainer.add(card);
            this.cards.push(card);
        });

        // --- Navigation Controls ---
        this._createPageIndicators(width, height);

    }

    _createPageIndicators(width, height) {
        // Calculate grid bottom position dynamically
        const totalRows = 2; // Fixed 2x2 grid
        const totalGridHeight = (this.CARD_HEIGHT * 2) + this.ROW_GAP;
        const headerPadding = 20;
        const availableHeight = height - this.HEADER_HEIGHT - this.FOOTER_HEIGHT - headerPadding;
        const gridStartY = this.HEADER_HEIGHT + headerPadding + Math.max(0, (availableHeight - totalGridHeight) / 2);

        // Position 30px below the last row (increased spacing)
        const y = gridStartY + totalGridHeight + 30;

        this.indicatorContainer = this.add.container(width / 2, y).setScrollFactor(0).setDepth(100);
        this.pageIndicators = [];

        // Colors
        this.COLOR_ACTIVE = 0x997652;
        this.COLOR_INACTIVE = 0xCCAA88;

        for (let i = 0; i < this.totalPages; i++) {
            // Create dots (circles)
            const circle = this.add.circle(0, 0, 5, this.COLOR_INACTIVE, 1);

            // Make INDICATOR CLICKABLE (as button)
            circle.setInteractive({ cursor: 'pointer' });
            circle.on('pointerdown', () => this.goToPage(i));

            this.indicatorContainer.add(circle);
            this.pageIndicators.push(circle);
        }

        // Initialize positions IMMEDIATELY (No "Loading" animation on first show)
        this._updatePageIndicators(true); // check immediate flag
    }

    _updatePageIndicators(immediate = false) {
        if (!this.pageIndicators) return;

        const gap = 24; // Distance between dot centers

        // Center the group
        const totalW = (this.totalPages - 1) * gap;
        let currentX = -totalW / 2;

        this.pageIndicators.forEach((circle, i) => {
            const isActive = (i === this.currentPage);
            const targetScale = isActive ? 1.4 : 1.0;
            const targetColor = isActive ? this.COLOR_ACTIVE : this.COLOR_INACTIVE;

            if (immediate) {
                // Set explicitly without tween
                circle.x = currentX;
                circle.setScale(targetScale);
                circle.setFillStyle(targetColor);
            } else {
                // Animate
                this.tweens.add({
                    targets: circle,
                    scale: targetScale, // Pop effect for active dot
                    fillColor: targetColor,
                    x: currentX,
                    duration: 200,
                    ease: 'Back.out'
                });
            }

            currentX += gap;
        });
    }

    goToPage(index) {
        if (this._isModalOpen) return;
        if (index !== this.currentPage) {
            this._snapToPage(index);
        }
    }

    setupInput() {
        // ESC to go back
        this.input.keyboard.on('keydown-ESC', () => this._handleBack());

        // Swipe / Drag Handling
        this._swipeData = {
            startX: 0,
            gridStartX: 0,
            isDown: false,
            startTime: 0
        };
        this.isDragging = false;

        this.input.on('pointerdown', this._onPointerDown, this);
        this.input.on('pointermove', this._onPointerMove, this);
        this.input.on('pointerup', this._onPointerUp, this);
    }

    _onPointerDown(pointer) {
        if (this._isModalOpen) return;

        this._swipeData.isDown = true;
        this._swipeData.startX = pointer.x;
        this._swipeData.startTime = pointer.time;

        // Capture current X position of the grid
        // If a tween is running, this picks up the mid-tween position, allowing "catch"
        this._swipeData.gridStartX = this.gridContainer.x;

        // Stop any ongoing tweens to allow manual control
        this.tweens.killTweensOf(this.gridContainer);

        this.isDragging = false;
    }

    _onPointerMove(pointer) {
        if (!this._swipeData.isDown) return;
        if (this._isModalOpen) return;

        const diff = pointer.x - this._swipeData.startX;

        // Threshold to start treating as drag (prevent accidental clicks turning into drags)
        if (!this.isDragging && Math.abs(diff) > 10) {
            this.isDragging = true;
        }

        if (this.isDragging && this.gridContainer) {
            // Apply resistance at edges
            let effectiveDiff = diff;
            const isFirst = this.currentPage === 0;
            const isLast = this.currentPage === this.totalPages - 1;

            // Logarithmic-like resistance if dragging beyond bounds
            if ((isFirst && diff > 0) || (isLast && diff < 0)) {
                effectiveDiff *= 0.3;
            }

            this.gridContainer.x = this._swipeData.gridStartX + effectiveDiff;
        }
    }

    _onPointerUp(pointer) {
        if (!this._swipeData.isDown) return;
        this._swipeData.isDown = false;

        if (this.isDragging) {
            const diff = pointer.x - this._swipeData.startX;
            const duration = pointer.time - this._swipeData.startTime;
            const { width } = this.cameras.main;
            const threshold = width * 0.25; // 25% screen width to switch

            // Allow fast swipes to switch even if distance is short
            const isFast = duration < 300 && Math.abs(diff) > 30;

            let targetPage = this.currentPage;

            if (diff < -threshold || (diff < 0 && isFast)) {
                // Next page (swiped left)
                if (this.currentPage < this.totalPages - 1) {
                    targetPage++;
                }
            } else if (diff > threshold || (diff > 0 && isFast)) {
                // Prev page (swiped right)
                if (this.currentPage > 0) {
                    targetPage--;
                }
            }

            this._snapToPage(targetPage);

            // Keep isDragging true briefly to ensure card clicks originating from this interaction are ignored
            // StoreCard checks this.scene.isDragging
            this.time.delayedCall(50, () => {
                this.isDragging = false;
            });
        } else {
            // It was a click (no significant movement)
            this.isDragging = false;
        }
    }

    _snapToPage(pageIndex) {
        if (this._isModalOpen) return;

        this.currentPage = pageIndex;
        const targetX = -this.currentPage * this.cameras.main.width;

        this.tweens.add({
            targets: this.gridContainer,
            x: targetX,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this._updatePageIndicators();
            }
        });

        this._updatePageIndicators();
    }

    _handleCardInteraction(card, data) {
        // BLOCK IF MODAL OPEN OR INTERACTION BLOCKED (Cooldown)
        if (this._isModalOpen || this._interactionBlocked) return;

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

        // 3. Not owned (Purchase Flow)
        const myCoins = this.storeManager.getCoins();
        if (myCoins >= skinData.cost) {
            // SHOW CONFIRMATION MODAL
            this._showConfirmModal(skinData, () => {
                // Actual Purchase logic inside callback
                const result = this.storeManager.purchaseSkin(skinData.id, skinData.cost);
                if (result.success) {
                    this._playPurchaseFx();
                    console.log(`✅ Purchased: ${skinData.name}`);
                    card.animateSuccess();
                    this._refreshUI();
                } else {
                    this.cameras.main.shake(100, 0.005);
                    card.animateFail();
                }
            });
        } else {
            // Not enough money
            this.cameras.main.shake(100, 0.005);
            card.animateFail();
        }
    }

    _showConfirmModal(skinData, onConfirm) {
        this._isModalOpen = true; // SET FLAG

        const { width, height } = this.cameras.main;

        // 1. Blocker (Darken bg, block clicks)
        const blocker = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(200);

        // 2. Modal Container
        const modal = this.add.container(width / 2, height / 2).setDepth(201).setScrollFactor(0);

        // Panel
        const panelW = 280;
        const panelH = 180;
        const panel = this.add.rectangle(0, 0, panelW, panelH, 0x1a1a1a)
            .setStrokeStyle(2, 0xffffff);

        // Title
        const title = this.add.text(0, -60, 'CONFIRM PURCHASE', {
            fontSize: '22px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#ffdd00'
        }).setOrigin(0.5);

        // Description
        const desc = this.add.text(0, -10, `Buy ${skinData.name}\nfor ${UIHelpers.formatCurrency(skinData.cost)} coins?`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            align: 'center',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Buttons
        const btnY = 50;

        // Cooldown flag
        let canInteract = false;

        // YES Button
        const btnYes = UIHelpers.createTextButton(this, 60, btnY, 'YES', {
            width: 100,
            fontSize: '18px',
            hoverColor: '#00ff00',
            textColor: '#00ff00', // Green text for YES
            callback: () => {
                if (!canInteract) return;
                onConfirm();
                closeModal();
            }
        });

        // NO Button
        const btnNo = UIHelpers.createTextButton(this, -60, btnY, 'NO', {
            width: 100,
            fontSize: '18px',
            hoverColor: '#ff0000',
            textColor: '#ffaaaa', // Reddish text for NO
            callback: () => {
                if (!canInteract) return;
                closeModal();
            }
        });

        // Start buttons as dim/alpha to visualize cooldown
        btnYes.container.setAlpha(0.5);
        btnNo.container.setAlpha(0.5);

        // Enable after 500ms
        this.time.delayedCall(500, () => {
            // Check if scene/modal still active (simple check if container exists)
            if (modal.active) {
                canInteract = true;
                if (btnYes.container) btnYes.container.setAlpha(1);
                if (btnNo.container) btnNo.container.setAlpha(1);
            }
        });

        modal.add([panel, title, desc, btnYes.container, btnNo.container]);

        // Animate In
        modal.setScale(0);
        this.tweens.add({
            targets: modal,
            scale: 1,
            duration: 200,
            ease: 'Back.out'
        });

        // Close Logic
        const closeModal = () => {
            blocker.destroy();
            modal.destroy();

            // Sustain block for short duration to prevent click-through
            this.time.delayedCall(300, () => {
                this._isModalOpen = false;
            });
        };
    }

    _handleBack() {
        if (this._isModalOpen) return; // BLOCK BACK IF MODAL OPEN

        if (this._equipChanged) {
            // Reload assets if skin was changed
            this.scene.start('Preloader');
            return;
        }
        this.scene.start('MainMenu');
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
