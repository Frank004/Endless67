/* eslint-disable */
import { EnemyDevHandler } from '../handlers/EnemyDevHandler.js';
import { ItemDevHandler } from '../handlers/ItemDevHandler.js';
import { PlatformDevHandler } from '../handlers/PlatformDevHandler.js';
import { MazeDevHandler } from '../handlers/MazeDevHandler.js';
import { RiserDevHandler } from '../handlers/RiserDevHandler.js';

export class PlaygroundDevMenu {
    constructor(scene, cleanupModule) {
        this.scene = scene;
        this.cleanupModule = cleanupModule;

        this.handlers = [
            new EnemyDevHandler(scene),
            new ItemDevHandler(scene),
            new PlatformDevHandler(scene),
            new MazeDevHandler(scene),
            new RiserDevHandler(scene)
        ];

        // Add "System" handler
        this.handlers.push(this.createSystemHandler());

        this.devMenuElements = [];
        this.categoryData = [];
        this.isDevMenuOpen = false;

        // UI State
        this.scrollOffset = 0;
        this.maxScroll = 0;
        this.overlayX = 0;
        this.overlayY = 0;
        this.overlayW = 0;
        this.overlayH = 0;
        this.contentStartY = 0;
    }

    createSystemHandler() {
        const scene = this.scene;
        const cleanup = this.cleanupModule;
        return {
            getCategoryLabel: () => 'System',
            getIcon: () => 'clean',
            getItems: () => [
                { icon: 'clean', label: 'Clear All', callback: () => cleanup.clearScene(), type: 'single' },
                { icon: 'home', label: 'Main Menu', callback: () => scene.scene.start('MainMenu'), type: 'single' }
            ]
        };
    }

    createUI() {
        const scene = this.scene;
        const gameWidth = scene.cameras.main.width;
        const gameHeight = scene.cameras.main.height;

        // --- CONSTANTS ---
        const AD_BANNER_HEIGHT = 60; // 50px + 10px buffer
        const SAFE_BOTTOM_MARGIN = 20;
        const PADDING_SIDE = 10;

        // --- TOGGLE BUTTON ---
        // Positioned top-right, safely below potential ad overlaps if necessary, 
        // or effectively integrated into the layout.
        // Logic: Ad is top 50. Button can be at 80.
        const btnY = AD_BANNER_HEIGHT + 20;

        this.toggleBtnBg = scene.add.circle(gameWidth - 24, btnY, 18, 0x000000, 0.5)
            .setScrollFactor(0).setDepth(5999);

        this.toggleBtn = scene.add.image(gameWidth - 24, btnY, 'ui_icons', 'settings')
            .setOrigin(0.5).setScrollFactor(0).setDepth(6000).setInteractive({ useHandCursor: true })
            .setScale(0.35)
            .setTint(0xffffff);

        this.toggleBtn.on('pointerdown', () => this.toggleMenu());
        this.toggleBtn.on('pointerover', () => this.toggleBtnBg.setFillStyle(0x333333, 0.7));
        this.toggleBtn.on('pointerout', () => this.toggleBtnBg.setFillStyle(0x000000, 0.5));

        // --- OVERLAY SETUP (Responsive) ---
        // Width: Use 95% of screen on mobile, max 400px on desktop
        this.overlayW = Math.min(400, gameWidth * 0.95);

        // Height: Available space between Ad Banner and Bottom
        // We ensure it starts BELOW the ad banner.
        const maxH = gameHeight - AD_BANNER_HEIGHT - SAFE_BOTTOM_MARGIN;
        this.overlayH = Math.min(650, maxH);

        // Center Horizontally
        this.overlayX = gameWidth / 2;
        // Center Vertically within the SAFE area (below ad)
        // Center of Safe Area = AD_BANNER_HEIGHT + (maxH / 2)
        // If we use maxH exactly, then y is exactly center of safe area.
        this.overlayY = AD_BANNER_HEIGHT + (this.overlayH / 2);

        const overlayTop = this.overlayY - (this.overlayH / 2);
        const overlayLeft = this.overlayX - (this.overlayW / 2);

        // Background
        this.overlay = scene.add.rectangle(this.overlayX, this.overlayY, this.overlayW, this.overlayH, 0x000000, 0.95)
            .setScrollFactor(0).setDepth(5000).setVisible(false)
            .setInteractive().on('pointerdown', () => { }); // Block interaction
        this.devMenuElements.push(this.overlay);

        // Title
        const titleY = overlayTop + 30;
        this.menuTitle = scene.add.text(this.overlayX, titleY, 'DEV MODE', {
            fontSize: '24px', // Smaller
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5001).setVisible(false);
        this.devMenuElements.push(this.menuTitle);

        // --- SCROLL AREA UI ---
        const contentTopY = titleY + 30; // 30px below title
        const contentBottomY = this.overlayY + (this.overlayH / 2) - 10;
        const viewportHeight = Math.max(100, contentBottomY - contentTopY);

        // Mask
        this.maskGraphics = scene.make.graphics().setScrollFactor(0).setDepth(5000);
        this.maskGraphics.fillRect(overlayLeft + PADDING_SIDE, contentTopY, this.overlayW - (PADDING_SIDE * 2), viewportHeight);
        this.scrollMask = new Phaser.Display.Masks.GeometryMask(scene, this.maskGraphics);
        this.devMenuElements.push(this.maskGraphics);

        // Scroll Zone (Input)
        this.scrollZone = scene.add.zone(this.overlayX, contentTopY + (viewportHeight / 2), this.overlayW, viewportHeight)
            .setScrollFactor(0).setDepth(5001).setVisible(false)
            .setInteractive();

        this.scrollZone.on('wheel', (pointer, deltaX, deltaY) => {
            this.scrollContent(deltaY * 0.5);
        });
        this.devMenuElements.push(this.scrollZone);

        // Content Config
        this.contentStartY = contentTopY + 10; // Start rendering 10px inside the mask area
        let yPos = this.contentStartY;

        this.handlers.forEach(handler => {
            const items = handler.getItems();

            // Header
            const headerBg = scene.add.rectangle(this.overlayX, yPos, this.overlayW - 30, 40, 0x333333)
                .setScrollFactor(0).setDepth(5001).setVisible(false)
                .setInteractive({ useHandCursor: true })
                .setMask(this.scrollMask);

            // Icon
            const headerIcon = scene.add.image(overlayLeft + 35, yPos, 'ui_icons', handler.getIcon())
                .setOrigin(0.5).setScrollFactor(0).setDepth(5002).setVisible(false)
                .setScale(0.4)
                .setMask(this.scrollMask);

            // Text
            const headerText = scene.add.text(overlayLeft + 60, yPos, handler.getCategoryLabel(), {
                fontSize: '18px', // Smaller
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(5002).setVisible(false)
                .setMask(this.scrollMask);

            const catData = {
                headerBg, headerIcon, headerText,
                expanded: false,
                items: items,
                overlayX: this.overlayX,
                overlayW: this.overlayW,
                itemLeftX: overlayLeft, // Anchor for items
                itemElements: [] // To store expanded buttons
            };

            headerBg.on('pointerdown', () => this.toggleCategory(catData));

            this.devMenuElements.push(headerBg, headerIcon, headerText);
            this.categoryData.push(catData);

            yPos += 45; // Spacing
        });

        // Initial Max Scroll is 0 if fits
        this.maxScroll = 0;
    }

    toggleMenu() {
        this.isDevMenuOpen = !this.isDevMenuOpen;
        const scene = this.scene;

        if (!this.isDevMenuOpen) {
            this.devMenuElements.forEach(elem => elem.setVisible(false));
            // Collapse all on close (optional, but cleaner)
            this.categoryData.forEach(c => {
                c.itemElements.forEach(i => i.destroy());
                c.itemElements = [];
                c.expanded = false;
            });
            scene.physics.resume();
            if (scene.input.keyboard) scene.input.keyboard.enabled = true;
            this.toggleBtn.setTint(0xffffff);
        } else {
            this.devMenuElements.forEach(elem => elem.setVisible(true));
            scene.physics.pause();
            if (scene.input.keyboard) scene.input.keyboard.enabled = false;
            // Stop player movement
            if (scene.player && scene.player.body) scene.player.setVelocity(0, 0);

            this.toggleBtn.setTint(0x00ff00);
            this.updateScrollPositions();
        }
    }

    toggleCategory(catData) {
        if (catData.expanded) {
            // Collapse
            catData.itemElements.forEach(elem => elem.destroy());
            catData.itemElements = [];
            catData.expanded = false;
        } else {
            // Collapse others for accordion effect
            this.categoryData.forEach(c => {
                if (c !== catData && c.expanded) {
                    c.itemElements.forEach(e => e.destroy());
                    c.itemElements = [];
                    c.expanded = false;
                }
            });

            // Expand
            catData.expanded = true;
            this.renderCategoryItems(catData);
        }
        this.updateScrollPositions();
    }

    renderCategoryItems(catData) {
        const itemW = catData.overlayW - 50;
        const itemLeftX = catData.itemLeftX + 25; // Indent

        catData.items.forEach((item) => {
            if (item.type === 'single') {
                this.createSingleItem(catData, item, catData.overlayX, itemW, itemLeftX);
            } else {
                this.createDualItem(catData, item, catData.overlayX, itemW, itemLeftX);
            }
        });
    }

    createSingleItem(catData, item, cx, w, lx) {
        const scene = this.scene;
        // height
        const h = 34;

        const bg = scene.add.rectangle(cx, 0, w, h, 0x555555)
            .setScrollFactor(0).setDepth(5001).setInteractive({ useHandCursor: true }); // Removed mask

        const icon = scene.add.image(lx + 20, 0, 'ui_icons', item.icon)
            .setOrigin(0.5).setScrollFactor(0).setDepth(5002).setScale(0.35).setMask(this.scrollMask);

        const text = scene.add.text(lx + 45, 0, item.label, {
            fontSize: '14px', // Slightly smaller to accommodate wrap
            color: item.color || '#eeeeee',
            wordWrap: { width: w - 60, useAdvancedWrap: true }
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(5002).setMask(this.scrollMask);

        bg.on('pointerdown', () => {
            item.callback();
            this.toggleMenu(); // Close menu on action
        });

        catData.itemElements.push(bg, icon, text);
    }

    createDualItem(catData, item, cx, w, lx) {
        const scene = this.scene;
        // [Clean] [Fill]
        const h = 34;
        const gap = 4;
        const btnW = (w / 2) - gap;

        // Left Button Center
        const leftCx = cx - (btnW / 2) - (gap / 2);

        const bg1 = scene.add.rectangle(leftCx, 0, btnW, h, 0x555555)
            .setScrollFactor(0).setDepth(5001).setInteractive({ useHandCursor: true }); // Removed mask

        // Keep icons simple
        const icon1 = scene.add.image(leftCx - (btnW / 2) + 15, 0, 'ui_icons', 'clean')
            .setOrigin(0.5).setScrollFactor(0).setDepth(5002).setScale(0.3).setMask(this.scrollMask);

        const text1 = scene.add.text(leftCx - (btnW / 2) + 35, 0, item.label, { fontSize: '13px', color: '#eeeeee' })
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(5002).setMask(this.scrollMask);

        bg1.on('pointerdown', () => { item.callback('clean'); this.toggleMenu(); });

        // Right Button Center
        const rightCx = cx + (btnW / 2) + (gap / 2);

        const bg2 = scene.add.rectangle(rightCx, 0, btnW, h, 0x4444aa)
            .setScrollFactor(0).setDepth(5001).setInteractive({ useHandCursor: true }); // Removed mask

        const icon2 = scene.add.image(rightCx - (btnW / 2) + 15, 0, 'ui_icons', 'alien')
            .setOrigin(0.5).setScrollFactor(0).setDepth(5002).setScale(0.3).setMask(this.scrollMask);

        const text2 = scene.add.text(rightCx - (btnW / 2) + 35, 0, 'Fill', { fontSize: '13px', color: '#eeeeee' })
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(5002).setMask(this.scrollMask);

        bg2.on('pointerdown', () => { item.callback('prepopulate'); this.toggleMenu(); });

        catData.itemElements.push(bg1, icon1, text1, bg2, icon2, text2);
    }

    scrollContent(dy) {
        this.scrollOffset += dy;
        if (this.scrollOffset < 0) this.scrollOffset = 0;
        // Need to clamp against maxScroll. But exact maxScroll is dynamic.
        // We'll trust the visual clipping mask for now.
        this.updateScrollPositions();
    }

    updateScrollPositions() {
        // Use dynamic contentStartY
        let currentY = this.contentStartY - this.scrollOffset;

        this.categoryData.forEach(cat => {
            // Header
            cat.headerBg.y = currentY;
            cat.headerIcon.y = currentY;
            cat.headerText.y = currentY;

            currentY += 45; // Header height + gap

            if (cat.expanded) {
                const itemH = 38; // 34h + 4gap
                let elemIndex = 0;
                cat.items.forEach(item => {
                    const y = currentY;
                    if (item.type === 'single') {
                        // 3 elements
                        for (let k = 0; k < 3; k++) {
                            const e = cat.itemElements[elemIndex++];
                            if (e) e.y = y;
                        }
                    } else {
                        // 6 elements
                        for (let k = 0; k < 6; k++) {
                            const e = cat.itemElements[elemIndex++];
                            if (e) e.y = y;
                        }
                    }
                    currentY += itemH;
                });
            }
        });
    }

    isMenuElement(child) {
        if (this.devMenuElements.includes(child)) return true;
        if (child === this.toggleBtn || child === this.toggleBtnBg) return true;

        for (const cat of this.categoryData) {
            if (cat.headerBg === child || cat.headerIcon === child || cat.headerText === child) return true;
            if (cat.itemElements.includes(child)) return true;
        }
        return false;
    }
}
