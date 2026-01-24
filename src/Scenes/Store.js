import { ASSETS } from '../Config/AssetKeys.js';
import { StoreCard } from '../UI/Store/StoreCard.js';
import { CoinCounter } from '../UI/HUD/CoinCounter.js';
import { StoreManager } from '../Systems/Store/StoreManager.js';
import { UIHelpers } from '../Utils/UIHelpers.js';
import SkinCatalogService from '../Systems/Gameplay/SkinCatalogService.js';
import PlayerProfileService from '../Systems/Gameplay/PlayerProfileService.js';

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

        this.input.on('pointerup', this._onPointerUp, this); // Remove this direct call I added by mistake
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
                import('../Systems/Gameplay/PlayerProfileService.js').then(module => {
                    const service = module.default;
                    const newProfile = service.addCoins(amount);
                    console.log(`💰 Added ${amount} coins. New Balance: ${newProfile.currency.coins}`);
                    this._refreshUI();
                });
            },
            resetProfile: () => {
                import('../Systems/Gameplay/PlayerProfileService.js').then(module => {
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

        // 1. Back Button (Top Left - Sprite)
        const btnX = 30; // Margin left + half button width
        const btnY = 25; // Top margin

        const backBtn = this.add.image(btnX, btnY, 'ui_hud', 'btn-small/btn-smal-back.png')
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(101)
            .setInteractive({ useHandCursor: true });

        backBtn.on('pointerdown', () => {
            this.tweens.add({
                targets: backBtn,
                scale: 0.9,
                duration: 50,
                yoyo: true
            });
            this._handleBack();
        });

        backBtn.on('pointerover', () => backBtn.setTint(0xcccccc));
        backBtn.on('pointerout', () => backBtn.clearTint());

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

        this.coinCounter = new CoinCounter(this, 0, 0);
        // Position: Right edge should be at (width - cardMargin)
        // Dimensions: CoinCounter uses a background image.
        const bgWidth = this.coinCounter.bg.width || 200; // Expected width around 180-200px
        const scale = this.coinCounter.scaleX;

        // Calculate X to align the right edge of CoinCounter to the desired margin
        const counterX = width - cardMargin - (bgWidth * scale);

        this.coinCounter.setPosition(counterX, btnY);
        this.coinCounter.setScrollFactor(0);

        this.headerContainer.add([backBtn, logo, this.coinCounter]);

        // Initial Layout
        // CoinCounter handles its own initial visual state
    }

    updateCoins(amount) {
        this.headerCoins = amount;
        if (this.coinCounter) {
            this.coinCounter.setValue(amount);
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

        console.log('[Store] Refreshing UI. Coins:', coins, 'Skins:', skinsWithState.length);
        if (skinsWithState.length === 0) {
            console.warn('[Store] No skins found to display!');
        }

        this.updateCoins(coins);

        if (this.cards && this.cards.length > 0) {
            this._updateExistingCards(skinsWithState, coins);
        } else {
            console.log('[Store] Creating initial grid for skins:', skinsWithState);
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
        this.input.on('pointerupoutside', this._onPointerUp, this);
    }

    _onPointerDown(pointer) {
        if (this._isModalOpen) return;

        // Safety check: gridContainer might not be initialized yet
        if (!this.gridContainer) return;

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
            // Always ensure we snap back if we werent dragging but somehow offset
            if (this.gridContainer) {
                this._snapToPage(this.currentPage);
            }
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
