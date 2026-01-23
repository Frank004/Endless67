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
        this.PADDING_SIDE = 20;
        this.COLUMN_GAP = 10;
        this.ROW_GAP = 10;
        this.CARD_WIDTH = 120;
        this.CARD_HEIGHT = 184;

        // Business logic
        this._catalog = null;
        this._equipChanged = false;
        this._profile = null;
    }

    create() {
        this.cards = [];
        const { width, height } = this.cameras.main;

        // Background
        const bg = this.add.image(width / 2, height / 2, ASSETS.STORE, 'storebg.png')
            .setOrigin(0.5)
            .setScrollFactor(0);

        // Ensure background covers screen
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);

        // Setup Header (Logo + Coins + Back Button)
        this.createHeader();

        // Setup store (async)
        this._setupStore();

        // Setup input
        this.setupInput();

        // BLOCK INTERACTIONS INITIALLY (Cooldown on load)
        this._interactionBlocked = true;
        this.time.delayedCall(500, () => {
            this._interactionBlocked = false;
        });

        // Debug
        window.STORE_DEBUG = {
            addCoins: (amount) => {
                import('../managers/gameplay/PlayerProfileService.js').then(module => {
                    const service = module.default;
                    const newProfile = service.addCoins(amount);
                    console.log(`💰 Added ${amount} coins. New Balance: ${newProfile.currency.coins}`);
                    this._refreshUI();
                });
            },
            resetProfile: () => {
                import('../managers/gameplay/PlayerProfileService.js').then(module => {
                    const service = module.default;
                    // Reset Skins
                    service.debugResetSkins();
                    // Reset Coins
                    const profile = service.loadOrCreate();
                    profile.currency.coins = 0;
                    service.save(profile);

                    console.log('🗑️ Profile Reset (Skins & Coins cleared).');
                    this._refreshUI();
                });
            }
        };
    }

    createHeader() {
        const { width } = this.cameras.main;

        // Header container (fixed)
        this.headerContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

        // 1. Back Button (Top Left - Circle with Arrow)
        const btnRadius = 24;
        const btnX = 30 + btnRadius; // Margin left
        const btnY = 35; // Top margin

        const btnBg = this.add.circle(0, 0, btnRadius, 0x000000, 0.5)
            .setStrokeStyle(2, 0xffffff);

        const btnArrow = this.add.text(0, 0, '←', {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5, 0.55); // Visual center correction

        const btnContainer = this.add.container(btnX, btnY, [btnBg, btnArrow])
            .setSize(btnRadius * 2, btnRadius * 2)
            .setInteractive({ useHandCursor: true });

        btnContainer.on('pointerdown', () => {
            this.tweens.add({
                targets: btnContainer,
                scale: 0.9,
                duration: 50,
                yoyo: true
            });
            this._handleBack();
        });

        // 2. Title: "THE VAULT" (Logo) - Moved Down
        // Center text closer to the grid start (visual balance)
        const logoY = 100;
        const logo = this.add.image(width / 2, logoY, ASSETS.STORE_LOGO)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setScale(0.2);

        if (logo.displayWidth > 280) {
            logo.setDisplaySize(280, logo.displayHeight * (280 / logo.displayWidth));
        }

        // 3. Coin Counter (Top Right)
        const cardMargin = 20;
        this.coinCounterContainer = this.add.container(width - cardMargin, btnY).setScrollFactor(0);

        this.coinBg = this.add.rectangle(0, 0, 100, 36, 0x000000, 0.85).setOrigin(1, 0.5);

        const textPaddingRight = 15;
        this.coinText = this.add.text(-textPaddingRight, 0, '0', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffdd00',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);

        this.coinIcon = this.add.image(0, 0, ASSETS.COINS, 'coin-01.png')
            .setOrigin(0.5, 0.5)
            .setScale(2.5);

        this.coinCounterContainer.add([this.coinBg, this.coinText, this.coinIcon]);

        this.headerContainer.add([btnContainer, logo, this.coinCounterContainer]);

        // Initial Layout
        this.updateCoinVisuals();
    }

    updateCoinVisuals() {
        if (!this.coinText || !this.coinIcon || !this.coinBg) return;

        this.coinText.updateText();

        // --- LAYOUT CONSTANTS ---
        const PADDING_RIGHT = 15; // Space from right container edge to text
        const PADDING_LEFT = 10;  // Space from left container edge to icon
        const GAP = 10;           // Space between Text and Icon

        // --- SIZES ---
        const textWidth = this.coinText.width;
        const iconDisplayWidth = this.coinIcon.displayWidth || (16 * 2.5); // Fallback if not loaded

        // --- POSITIONS (Right to Left Calculation) ---

        // 1. Text (Origin 1, 0.5) -> Anchor is Right-Center
        // Positioned at -PADDING_RIGHT
        const textX = -PADDING_RIGHT;

        // 2. Icon (Origin 0.5, 0.5) -> Anchor is Center
        // Icon Center X = (Text Left Edge) - GAP - (Half Icon Width)
        // Text Left Edge = textX - textWidth
        const iconCenterX = (textX - textWidth) - GAP - (iconDisplayWidth / 2);

        // --- APPLY POSITIONS ---
        this.coinText.x = textX;
        this.coinText.y = 0; // Vertically centered

        this.coinIcon.x = iconCenterX;
        this.coinIcon.y = 0; // Vertically centered using origin 0.5

        // --- BACKGROUND SIZE ---
        // Total Width = PADDING_RIGHT + textWidth + GAP + iconWidth + PADDING_LEFT
        // Or calculated from positions: ABS(Icon Left Edge) + PADDING_LEFT
        const iconLeftEdge = iconCenterX - (iconDisplayWidth / 2);
        const totalWidth = Math.abs(iconLeftEdge) + PADDING_LEFT;

        this.coinBg.width = totalWidth;

        // Verify container position in createHeader is correct (Top Right)
    }

    updateCoins(amount) {
        this.headerCoins = amount;
        if (this.coinText) {
            const formatted = UIHelpers.formatCurrency(amount);
            this.coinText.setText(formatted);
            this.updateCoinVisuals();
        }
    }

    async _setupStore() {
        this.storeManager = new StoreManager();
        await this.storeManager.init();

        // Dynamically load skin assets for previews
        if (this.storeManager.catalog && this.storeManager.catalog.skins) {
            this._loadSkinAssets(this.storeManager.catalog.skins);
        }

        this._refreshUI();
    }

    _loadSkinAssets(skins) {
        let loadCount = 0;
        const v = window.GAME_VERSION ? `?v=${window.GAME_VERSION}` : '';

        skins.forEach(skin => {
            // Unique key for each skin atlas to avoid collisions and allow previewing non-equipped skins
            const skinKey = `skin_atlas_${skin.id}`;

            if (!this.textures.exists(skinKey) && skin.multiatlasJson) {
                // Determine path - support both relative to assets or full paths if specified in JSON
                // The JSON usually has relative paths like "assets/skins/..."
                let texturePath = skin.multiatlasBase;
                if (texturePath && !texturePath.endsWith('/')) {
                    texturePath += '/';
                }

                this.load.multiatlas(skinKey, `${skin.multiatlasJson}${v}`, texturePath);
                loadCount++;
            }
        });

        if (loadCount > 0) {
            this.load.start();

            // Listen for individual file completion to update UI progressively or once all done
            // Simple approach: refresh UI when all dynamic loads are done
            this.load.once('complete', () => {
                console.log(`[Store] Loaded ${loadCount} skin assets.`);
                this._refreshUI();
            });
        }
    }

    _refreshUI() {
        const coins = this.storeManager.getCoins();
        const skinsWithState = this.storeManager.getSkinsWithState();

        this.updateCoins(coins);

        if (this.cards && this.cards.length > 0) {
            this._updateExistingCards(skinsWithState, coins);
        } else {
            this.createPagedGrid(skinsWithState);
        }
    }

    _updateExistingCards(skinsWithState, coins) {
        const stateMap = new Map(skinsWithState.map(s => [s.id, s]));
        this.cards.forEach(card => {
            const newState = stateMap.get(card.skinData.id);
            if (newState) {
                card.skinData.owned = newState.owned;
                card.skinData.equipped = newState.equipped;
                card.updateAffordableState(coins);
            }
        });
    }

    createPagedGrid(skins) {
        const { width, height } = this.cameras.main;

        const CARDS_PER_PAGE = 4;
        this.totalPages = Math.ceil(skins.length / CARDS_PER_PAGE);
        this.currentPage = 0;

        const effectiveColumnGap = 20;
        const totalCardWidth = (this.CARD_WIDTH * 2) + effectiveColumnGap;
        // Total grid height (2 rows) + row gap
        const totalGridHeight = (this.CARD_HEIGHT * 2) + this.ROW_GAP;

        // --- BOTTOM ALIGNMENT LOGIC ---
        // Push container to the bottom area.
        // Leave some margin from bottom (e.g., 50px-80px for spacing or indicators)
        const bottomMargin = 50;
        const startY = height - totalGridHeight - bottomMargin;

        // Horizontal centering
        const startX = (width - totalCardWidth) / 2;
        const col1X = startX;
        const col2X = col1X + this.CARD_WIDTH + effectiveColumnGap;

        this.gridContainer = this.add.container(0, 0);

        // --- SWIPE ZONE ---
        const totalContainerWidth = width * this.totalPages;
        const swipeZoneHeight = height * 0.6; // Cover bottom half mostly
        const swipeZone = this.add.rectangle(
            (width * this.totalPages) / 2 - (width / 2),
            height - (swipeZoneHeight / 2), // Aligned to bottom
            totalContainerWidth,
            swipeZoneHeight,
            0x000000, 0
        ); // origin 0.5 default

        this.gridContainer.add(swipeZone);

        this.cards = [];

        skins.forEach((skin, index) => {
            const pageIndex = Math.floor(index / CARDS_PER_PAGE);
            const indexInPage = index % CARDS_PER_PAGE;
            const row = Math.floor(indexInPage / 2);
            const col = indexInPage % 2;

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

            card.on('cardClick', (data) => this._handleCardInteraction(card, data));
            this.gridContainer.add(card);
            this.cards.push(card);
        });

        // Indicators follow the grid bottom
        this._createPageIndicators(width, startY + totalGridHeight + 30);
    }

    _createPageIndicators(width, yPos) {
        if (this.indicatorContainer) this.indicatorContainer.destroy();

        this.indicatorContainer = this.add.container(width / 2, yPos).setScrollFactor(0).setDepth(100);
        this.pageIndicators = [];

        this.COLOR_ACTIVE = 0x997652;
        this.COLOR_INACTIVE = 0xCCAA88;

        for (let i = 0; i < this.totalPages; i++) {
            const circle = this.add.circle(0, 0, 6, this.COLOR_INACTIVE, 1);

            // Hit area 30px for easier tapping
            circle.setInteractive({
                hitArea: new Phaser.Geom.Circle(0, 0, 20),
                hitAreaCallback: Phaser.Geom.Circle.Contains,
                useHandCursor: true
            });

            circle.on('pointerdown', () => {
                this._blockSwipe = true; // Signal to ignore global swipe
                this.goToPage(i);
            });

            this.indicatorContainer.add(circle);
            this.pageIndicators.push(circle);
        }

        this._updatePageIndicators(true);
    }

    _updatePageIndicators(immediate = false) {
        if (!this.pageIndicators) return;

        const gap = 30; // Increased gap for touch friendliness
        const totalW = (this.totalPages - 1) * gap;
        let currentX = -totalW / 2;

        this.pageIndicators.forEach((circle, i) => {
            const isActive = (i === this.currentPage);
            const targetX = currentX;
            const targetColor = isActive ? this.COLOR_ACTIVE : this.COLOR_INACTIVE;
            const targetScale = isActive ? 1.4 : 1.0;

            if (immediate) {
                circle.x = targetX;
                circle.setScale(targetScale);
                circle.setFillStyle(targetColor);
            } else {
                this.tweens.add({
                    targets: circle,
                    scale: targetScale,
                    fillColor: targetColor,
                    x: targetX,
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

    _snapToPage(pageIndex) {
        this.currentPage = pageIndex;
        const targetX = -this.currentPage * this.cameras.main.width;

        this.tweens.add({
            targets: this.gridContainer,
            x: targetX,
            duration: 300,
            ease: 'Power2',
            onComplete: () => this._updatePageIndicators()
        });
        this._updatePageIndicators();
    }

    setupInput() {
        this.input.keyboard.on('keydown-ESC', () => this._handleBack());

        this._swipeData = { startX: 0, isDown: false, startTime: 0 };
        this.isDragging = false;

        this.input.on('pointerdown', this._onPointerDown, this);
        this.input.on('pointermove', this._onPointerMove, this);
        this.input.on('pointerup', this._onPointerUp, this);
    }

    _onPointerDown(pointer) {
        if (this._isModalOpen) return;

        // Prevent interfering with UI buttons that claimed interaction
        if (this._blockSwipe) {
            this._blockSwipe = false;
            return;
        }

        this._swipeData.isDown = true;
        this._swipeData.startX = pointer.x;
        this._swipeData.gridStartX = this.gridContainer.x;
        this._swipeData.startTime = pointer.time;
        this.tweens.killTweensOf(this.gridContainer);
        this.isDragging = false;
    }

    _onPointerMove(pointer) {
        if (!this._swipeData.isDown || this._isModalOpen) return;
        const diff = pointer.x - this._swipeData.startX;

        if (!this.isDragging && Math.abs(diff) > 10) {
            this.isDragging = true;
        }

        if (this.isDragging && this.gridContainer) {
            let effectiveDiff = diff;
            const isFirst = this.currentPage === 0;
            const isLast = this.currentPage === this.totalPages - 1;
            if ((isFirst && diff > 0) || (isLast && diff < 0)) effectiveDiff *= 0.3;
            this.gridContainer.x = this._swipeData.gridStartX + effectiveDiff;
        }
    }

    _onPointerUp(pointer) {
        if (!this._swipeData.isDown) return;
        this._swipeData.isDown = false;

        if (this.isDragging) {
            const diff = pointer.x - this._swipeData.startX;
            const duration = pointer.time - this._swipeData.startTime;
            const width = this.cameras.main.width;
            const threshold = width * 0.25;
            const isFast = duration < 300 && Math.abs(diff) > 30;

            let targetPage = this.currentPage;
            if (diff < -threshold || (diff < 0 && isFast)) {
                if (this.currentPage < this.totalPages - 1) targetPage++;
            } else if (diff > threshold || (diff > 0 && isFast)) {
                if (this.currentPage > 0) targetPage--;
            }
            this._snapToPage(targetPage);

            this.time.delayedCall(50, () => this.isDragging = false);
        } else {
            this.isDragging = false;
        }
    }

    _handleCardInteraction(card, data) {
        if (this._isModalOpen || this._interactionBlocked) return;
        const { skinData } = data;

        if (skinData.equipped) return;

        if (skinData.owned) {
            if (this.storeManager.equipSkin(skinData.id)) {
                this._equipChanged = true;
                card.animateSuccess();
                this._refreshUI();
            }
        } else {
            const myCoins = this.storeManager.getCoins();
            if (myCoins >= skinData.cost) {
                this._showConfirmModal(skinData, () => {
                    const result = this.storeManager.purchaseSkin(skinData.id, skinData.cost);
                    if (result.success) {
                        this._playPurchaseFx();
                        card.animateSuccess();
                        this._refreshUI();
                    } else {
                        card.animateFail();
                    }
                });
            } else {
                this.cameras.main.shake(100, 0.005);
                card.animateFail();
            }
        }
    }

    _showConfirmModal(skinData, onConfirm) {
        this._isModalOpen = true;
        const { width, height } = this.cameras.main;

        const blocker = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setInteractive().setScrollFactor(0).setDepth(200);

        const modal = this.add.container(width / 2, height / 2).setDepth(201).setScrollFactor(0);
        const panel = this.add.rectangle(0, 0, 280, 180, 0x1a1a1a).setStrokeStyle(2, 0xffffff);

        const title = this.add.text(0, -60, 'CONFIRM PURCHASE', {
            fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffdd00'
        }).setOrigin(0.5);

        const desc = this.add.text(0, -10, `Buy ${skinData.name}\nfor ${UIHelpers.formatCurrency(skinData.cost)} coins?`, {
            fontSize: '18px', fontFamily: 'monospace', align: 'center', color: '#ffffff'
        }).setOrigin(0.5);

        let canInteract = false;
        const btnYes = UIHelpers.createTextButton(this, 60, 50, 'YES', {
            width: 100, fontSize: '18px', textColor: '#00ff00',
            callback: () => { if (canInteract) { onConfirm(); closeModal(); } }
        });
        const btnNo = UIHelpers.createTextButton(this, -60, 50, 'NO', {
            width: 100, fontSize: '18px', textColor: '#ffaaaa',
            callback: () => { if (canInteract) { closeModal(); } }
        });

        btnYes.container.setAlpha(0.5);
        btnNo.container.setAlpha(0.5);

        this.time.delayedCall(500, () => {
            if (modal.active) {
                canInteract = true;
                if (btnYes.container) btnYes.container.setAlpha(1);
                if (btnNo.container) btnNo.container.setAlpha(1);
            }
        });

        modal.add([panel, title, desc, btnYes.container, btnNo.container]);
        modal.setScale(0);

        this.tweens.add({
            targets: modal, scale: 1, duration: 200, ease: 'Back.out'
        });

        const closeModal = () => {
            blocker.destroy();
            modal.destroy();
            this.time.delayedCall(300, () => this._isModalOpen = false);
        };
    }

    _handleBack() {
        if (this._isModalOpen) return;
        if (this._equipChanged) {
            this.scene.start('Preloader');
            return;
        }
        this.scene.start('MainMenu');
    }

    _playPurchaseFx() {
        if (!this.gridContainer) return;
        this.tweens.add({
            targets: this.gridContainer, scale: 1.02, duration: 120, yoyo: true
        });
    }
}
