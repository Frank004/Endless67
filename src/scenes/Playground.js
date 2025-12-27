import { Game } from './Game.js';
import { PatrolEnemy, ShooterEnemy, JumperShooterEnemy } from '../prefabs/Enemy.js';
import { enablePlatformRider } from '../utils/platformRider.js';
import { getLevelConfig } from '../data/LevelConfig.js';
import { MAZE_PATTERNS, MAZE_PATTERNS_EASY, MAZE_PATTERNS_MEDIUM, MAZE_PATTERNS_HARD } from '../data/MazePatterns.js';

export class Playground extends Game {
    constructor() {
        super('Playground');
        this.isDevMenuOpen = false;
    }

    create() {
        super.create();

        // --- DISABLE LAVA RISING ---
        this.riserManager.update = () => {
            this.riserManager.riser.y = this.cameras.main.scrollY + 1000;
            this.riserManager.riser.tilePositionY -= 1;
        };

        // --- OVERRIDE LEVELMANAGER TO PREVENT AUTO-GENERATION ---
        this.levelManager.generateNextRow = () => {
            // Do nothing - we want empty playground
        };

        this.levelManager.update = () => {
            // Cleanup objects below the player BUT preserve permanent floor
            const limitY = this.player.y + 900;
            this.platforms.children.iterate((c) => {
                if (c && c.y > limitY && !c.getData('isPermanentFloor')) c.destroy();
            });
            this.coins.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
            this.powerups.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });
            this.mazeWalls.children.iterate((c) => { if (c && c.y > limitY) c.destroy(); });

            // Update moving platforms
            const gameWidth = this.cameras.main.width;
            const wallWidth = 32;
            const minPlatformX = wallWidth + 50; // 32px (wall) + 50px margen
            const maxPlatformX = gameWidth - wallWidth - 50; // gameWidth - 32px (wall) - 50px margen

            this.platforms.children.iterate((plat) => {
                if (plat.getData('isMoving')) {
                    let speed = plat.getData('speed') || 100;
                    if (plat.x < minPlatformX) plat.setVelocityX(speed);
                    else if (plat.x > maxPlatformX) plat.setVelocityX(-speed);
                }
            });
        };

        // --- SOLID FLOOR ---
        this.createSolidFloor();

        // --- DEV UI ---
        this.createDevUI();

        // --- VISUAL INDICATOR ---
        const gameWidth = this.cameras.main.width;
        this.add.text(gameWidth / 2, 100, 'DEV MODE', {
            fontSize: '48px',
            color: '#ff0000',
            alpha: 0.2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
    }

    createSolidFloor() {
        const floorY = 550;
        const gameWidth = this.cameras.main.width;
        const wallWidth = 32;
        const centerX = this.cameras.main.centerX;
        // Floor width: full playable area (gameWidth - 2 * wallWidth)
        const floorWidth = gameWidth - (wallWidth * 2);
        const floor = this.platforms.create(centerX, floorY, 'platform');
        floor.setDisplaySize(floorWidth, 40).refreshBody().setDepth(5);
        floor.body.allowGravity = false;
        floor.body.immovable = true;
        floor.setData('isPermanentFloor', true);

        this.player.y = 400;
        this.player.setVelocity(0, 0);
    }

    createDevUI() {
        // --- TOGGLE BUTTON (Below pause button, centered) ---
        const gameWidth = this.cameras.main.width;

        // Circular background for gear button
        this.toggleBtnBg = this.add.circle(gameWidth - 16, 90, 16, 0x000000, 0.5)
            .setScrollFactor(0).setDepth(5999);

        this.toggleBtn = this.add.image(gameWidth - 16, 90, 'ui_icons', 'settings')
            .setOrigin(0.5).setScrollFactor(0).setDepth(6000).setInteractive({ useHandCursor: true })
            .setScale(0.375) // Scale down 64px to 24px
            .setTint(0xffffff); // Ensure white

        this.toggleBtn.on('pointerdown', () => {
            this.toggleDevMenu();
        });

        this.toggleBtn.on('pointerover', () => {
            this.toggleBtnBg.setFillStyle(0x333333, 0.7);
        });

        this.toggleBtn.on('pointerout', () => {
            this.toggleBtnBg.setFillStyle(0x000000, 0.5);
        });

        // --- MODAL ELEMENTS ---
        this.devMenuElements = [];
        this.scrollOffset = 0;
        this.maxScroll = 0;

        // Overlay
        this.overlay = this.add.rectangle(200, 300, 400, 600, 0x000000, 0.95)
            .setScrollFactor(0).setDepth(5000).setVisible(false)
            .setInteractive()
            .on('pointerdown', () => { });
        this.devMenuElements.push(this.overlay);

        // Title
        this.menuTitle = this.add.text(200, 40, 'DEV MENU', {
            fontSize: '28px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5001).setVisible(false);
        this.devMenuElements.push(this.menuTitle);

        // Scroll zone for mouse wheel
        this.scrollZone = this.add.zone(200, 340, 360, 480)
            .setScrollFactor(0).setDepth(5001).setVisible(false)
            .setInteractive();

        this.scrollZone.on('wheel', (pointer, deltaX, deltaY) => {
            this.scrollContent(deltaY * 0.5);
        });
        this.devMenuElements.push(this.scrollZone);

        // Categories
        this.categories = [
            {
                icon: 'gamepad', label: 'Preset', items: [
                    { icon: 'crosshair', label: 'Test Section', callback: () => this.spawnPreset(), type: 'single' }
                ]
            },
            {
                icon: 'alien', label: 'Enemies', items: [
                    { icon: 'alien', label: 'Patrol', callback: () => this.spawnEnemy('patrol'), type: 'single' },
                    { icon: 'sword', label: 'Shooter (2-Shot)', callback: () => this.spawnEnemy('shooter', 2), type: 'single' },
                    { icon: 'crosshair', label: 'Shooter (3-Shot)', callback: () => this.spawnEnemy('shooter', 3), type: 'single' },
                    { icon: 'flashlight', label: 'Fast Shooter', callback: () => this.spawnEnemy('shooter-fast'), type: 'single' },
                    { icon: 'arrow-up', label: 'Jumper', callback: () => this.spawnEnemy('jumper'), type: 'single' }
                ]
            },
            {
                icon: 'stack', label: 'Items', items: [
                    { icon: 'shield', label: 'Powerup', callback: () => this.spawnPowerup('shield'), type: 'single' },
                    { icon: 'money', label: 'Coin', callback: () => this.spawnPowerup('coin'), type: 'single' }
                ]
            },
            {
                icon: 'masonry', label: 'Platforms', items: [
                    { icon: 'masonry', label: 'Static', callback: (mode) => this.spawnPlatform('static', mode), type: 'dual' },
                    { icon: 'arrow-left', label: 'Moving (Slow)', callback: (mode) => this.spawnPlatform('moving-slow', mode), type: 'dual' },
                    { icon: 'flashlight', label: 'Moving (Fast)', callback: (mode) => this.spawnPlatform('moving-fast', mode), type: 'dual' },
                    { icon: 'route', label: 'Zigzag', callback: (mode) => this.spawnPlatform('zigzag', mode), type: 'dual' }
                ]
            },
            {
                icon: 'tornado', label: 'Mazes', items: [
                    { icon: 'tornado', label: 'Maze 1 (Medium)', callback: (mode) => this.spawnSpecificMaze(0, mode), color: '#ffff00', type: 'dual' },
                    { icon: 'tornado', label: 'Maze 2 (Medium)', callback: (mode) => this.spawnSpecificMaze(1, mode), color: '#ffff00', type: 'dual' },
                    { icon: 'tornado', label: 'Maze 3 (Easy)', callback: (mode) => this.spawnSpecificMaze(2, mode), color: '#00ff00', type: 'dual' },
                    { icon: 'tornado', label: 'Maze 4 (Easy)', callback: (mode) => this.spawnSpecificMaze(3, mode), color: '#00ff00', type: 'dual' },
                    { icon: 'tornado', label: 'Maze 5 (Easy)', callback: (mode) => this.spawnSpecificMaze(4, mode), color: '#00ff00', type: 'dual' },
                    { icon: 'tornado', label: 'Maze 6 (Easy)', callback: (mode) => this.spawnSpecificMaze(5, mode), color: '#00ff00', type: 'dual' },
                    { icon: 'tornado', label: 'Maze 7 (Hard)', callback: (mode) => this.spawnSpecificMaze(6, mode), color: '#ff0000', type: 'dual' }
                ]
            },
            {
                icon: 'clean', label: 'Clear', items: [
                    { icon: 'clean', label: 'Clear All', callback: () => this.clearScene(), type: 'single' }
                ]
            },
            {
                icon: 'door', label: 'Exit', items: [
                    { icon: 'home', label: 'Main Menu', callback: () => this.scene.start('MainMenu'), type: 'single' }
                ]
            }
        ];

        let yPos = 90;
        this.categoryData = [];

        // Create a graphics object for masking
        this.maskGraphics = this.make.graphics().setScrollFactor(0).setDepth(5000);
        this.maskGraphics.fillRect(20, 80, 360, 480); // Define the scrollable area
        this.scrollMask = new Phaser.Display.Masks.GeometryMask(this, this.maskGraphics);
        this.devMenuElements.push(this.maskGraphics); // Add to elements to hide/show

        this.categories.forEach((cat, index) => {
            // Header background
            const headerBg = this.add.rectangle(200, yPos, 360, 45, 0x333333)
                .setScrollFactor(0).setDepth(5001).setVisible(false)
                .setInteractive({ useHandCursor: true })
                .setMask(this.scrollMask);

            // Header text
            const headerIcon = this.add.image(40, yPos, 'ui_icons', cat.icon)
                .setOrigin(0, 0.5).setScrollFactor(0).setDepth(5002).setVisible(false)
                .setScale(0.5) // Scale down 64px icon to 32px
                .setMask(this.scrollMask);

            const headerText = this.add.text(80, yPos, cat.label, {
                fontSize: '20px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(5002).setVisible(false)
                .setMask(this.scrollMask);

            const catData = {
                headerBg,
                headerIcon,
                headerText,
                expanded: false,
                items: cat.items,
                baseYPos: yPos,
                yPos,
                itemElements: []
            };

            headerBg.on('pointerdown', () => {
                this.toggleCategory(catData);
            });

            this.devMenuElements.push(headerBg, headerIcon, headerText);
            this.categoryData.push(catData);

            yPos += 50;
        });
    }

    scrollContent(delta) {
        this.scrollOffset += delta;
        this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, this.maxScroll);
        this.updateScrollPositions();
    }

    updateScrollPositions() {
        let totalContentHeight = 0;
        let currentY = 90; // Starting Y position for the first category header

        this.categoryData.forEach(cat => {
            cat.baseYPos = currentY; // Update base Y position for each category
            currentY += 50; // Height of header

            if (cat.expanded) {
                currentY += cat.items.length * 45; // Height of expanded items
            }
        });
        totalContentHeight = currentY - 90; // Total height of all categories (headers + expanded items)

        // Calculate maxScroll based on the content height and the scrollable area height (480px)
        this.maxScroll = Math.max(0, totalContentHeight - 480);
        this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, this.maxScroll);

        this.categoryData.forEach(cat => {
            const newY = cat.baseYPos - this.scrollOffset + 90; // Add 90 to start from correct position
            cat.yPos = newY;
            cat.headerBg.y = newY;
            cat.headerIcon.y = newY;
            cat.headerText.y = newY;

            // Update visibility based on scroll zone (80 to 560 is the visible range for content)
            const headerVisible = newY > 80 && newY < 560;
            cat.headerBg.setVisible(this.isDevMenuOpen && headerVisible);
            cat.headerIcon.setVisible(this.isDevMenuOpen && headerVisible);
            cat.headerText.setVisible(this.isDevMenuOpen && headerVisible);

            if (cat.expanded) {
                let itemY = cat.yPos + 55;

                // Calculate stride based on first item type
                const isSingle = cat.items[0] && cat.items[0].type === 'single';
                const stride = isSingle ? 3 : 5;

                for (let i = 0; i < cat.itemElements.length; i++) {
                    const elem = cat.itemElements[i];
                    elem.y = itemY;

                    // Check if this is the last element of an item
                    if (i % stride === stride - 1) {
                        // Determine which item this element belongs to
                        const itemIndex = Math.floor(i / stride);
                        const isLastItemInCat = itemIndex === cat.items.length - 1;
                        itemY += isLastItemInCat ? 70 : 45; // Add extra padding for the last item
                    }

                    const itemVisible = elem.y > 80 && elem.y < 560;
                    elem.setVisible(this.isDevMenuOpen && cat.expanded && itemVisible);
                }
            }
        });
    }

    toggleDevMenu() {
        if (this.isDevMenuOpen) {
            // Collapse all categories before hiding
            this.categoryData.forEach(cat => {
                if (cat.expanded) {
                    cat.itemElements.forEach(elem => elem.destroy());
                    cat.itemElements = [];
                    cat.expanded = false;
                }
            });

            // Reset scroll
            this.scrollOffset = 0;
            this.maxScroll = 0;

            // Hide all menu elements
            this.devMenuElements.forEach(elem => elem.setVisible(false));
            this.isDevMenuOpen = false;
            this.isPaused = false;
        } else {
            // Show all menu elements
            this.devMenuElements.forEach(elem => elem.setVisible(true));
            this.isDevMenuOpen = true;
            this.isPaused = true;
            // Update positions AFTER setting isDevMenuOpen to true
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
            // Collapse others
            this.categoryData.forEach(c => {
                if (c !== catData && c.expanded) {
                    c.itemElements.forEach(elem => elem.destroy());
                    c.itemElements = [];
                    c.expanded = false;
                }
            });

            // Expand
            let itemY = catData.yPos + 55;
            catData.items.forEach(item => {
                if (item.type === 'single') {
                    // Single button (full width)
                    const itemBg = this.add.rectangle(200, itemY, 340, 40, 0x555555)
                        .setScrollFactor(0).setDepth(5001)
                        .setInteractive({ useHandCursor: true })
                        .setMask(this.scrollMask);

                    const itemIcon = this.add.image(50, itemY, 'ui_icons', item.icon)
                        .setOrigin(0.5).setScrollFactor(0).setDepth(5002)
                        .setScale(0.4)
                        .setMask(this.scrollMask);

                    const itemText = this.add.text(80, itemY, item.label, {
                        fontSize: '18px',
                        color: item.color || '#ffffff'
                    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(5002)
                        .setMask(this.scrollMask);

                    itemBg.on('pointerdown', () => {
                        item.callback();
                        // Collapse and close
                        catData.itemElements.forEach(elem => elem.destroy());
                        catData.itemElements = [];
                        catData.expanded = false;
                        this.toggleDevMenu();
                    });

                    catData.itemElements.push(itemBg, itemIcon, itemText);
                } else if (item.type === 'dual') {
                    // Background
                    const itemBg = this.add.rectangle(200, itemY, 340, 40, 0x555555)
                        .setScrollFactor(0).setDepth(5001)
                        .setMask(this.scrollMask);

                    // Icon
                    const itemIcon = this.add.image(50, itemY, 'ui_icons', item.icon)
                        .setOrigin(0.5).setScrollFactor(0).setDepth(5002)
                        .setScale(0.4)
                        .setMask(this.scrollMask);

                    // Label text (left side)
                    const itemText = this.add.text(80, itemY, item.label, {
                        fontSize: '16px',
                        color: item.color || '#ffffff'
                    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(5002)
                        .setMask(this.scrollMask);

                    // Clean icon button (inline, same row) -> Single Spawn
                    const cleanBtn = this.add.image(310, itemY, 'ui_icons', 'single')
                        .setOrigin(0.5).setScrollFactor(0).setDepth(5002)
                        .setScale(0.4)
                        .setInteractive({ useHandCursor: true })
                        .setMask(this.scrollMask);

                    // Prep icon button (inline, same row, far right) -> Group Spawn
                    const prepBtn = this.add.image(350, itemY, 'ui_icons', 'group')
                        .setOrigin(0.5).setScrollFactor(0).setDepth(5002)
                        .setScale(0.4)
                        .setInteractive({ useHandCursor: true })
                        .setMask(this.scrollMask);

                    cleanBtn.on('pointerdown', () => {
                        item.callback('clean'); // 'clean' mapped to single mode logic if applicable, or just mode 1
                        // Collapse and close
                        catData.itemElements.forEach(elem => elem.destroy());
                        catData.itemElements = [];
                        catData.expanded = false;
                        this.toggleDevMenu();
                    });

                    prepBtn.on('pointerdown', () => {
                        item.callback('prepopulate'); // 'prepopulate' mapped to group mode logic if applicable, or just mode 2
                        // Collapse and close
                        catData.itemElements.forEach(elem => elem.destroy());
                        catData.itemElements = [];
                        catData.expanded = false;
                        this.toggleDevMenu();
                    });

                    catData.itemElements.push(itemBg, itemIcon, itemText, cleanBtn, prepBtn);
                }

                itemY += 45;
            });

            catData.expanded = true;
        }

        this.repositionCategories();
    }

    repositionCategories() {
        // Just update scroll positions which handles all repositioning
        this.updateScrollPositions();
    }

    clearScene() {
        // Stop all enemy behaviors before destroying
        this.shooterEnemies.children.each(enemy => {
            if (enemy && enemy.shootTimer) {
                enemy.shootTimer.remove();
                enemy.shootTimer = null;
            }
        });

        this.jumperShooterEnemies.children.each(enemy => {
            if (enemy && enemy.behaviorTimer) {
                enemy.behaviorTimer.remove();
                enemy.behaviorTimer = null;
            }
        });

        // Clear all groups
        this.patrolEnemies.clear(true, true);
        this.shooterEnemies.clear(true, true);
        this.jumperShooterEnemies.clear(true, true);
        this.projectiles.clear(true, true);
        this.coins.clear(true, true);
        this.powerups.clear(true, true);

        // Clear platforms but keep the permanent floor
        this.platforms.children.each(p => {
            if (!p.getData('isPermanentFloor')) {
                p.destroy();
            }
        });

        this.mazeWalls.clear(true, true);

        // Reset player
        const centerX = this.cameras.main.centerX;
        this.player.setPosition(centerX, 400);
        this.player.setVelocity(0, 0);
        this.cameras.main.scrollY = 0;
        this.currentHeight = 0;
        this.heightOffset = 0;
    }

    spawnEnemy(type, shots = 2) {
        const y = this.player.y - 200;
        const gameWidth = this.cameras.main.width;
        const wallWidth = 32;
        const minX = wallWidth + 28;
        const maxX = gameWidth - wallWidth - 28;
        const x = Phaser.Math.Between(minX, maxX);

        if (type === 'patrol') {
            const p = this.levelManager.spawnPlatform(x, y + 40, 100, false);
            const enemy = this.patrolEnemies.get(x, y);
            if (enemy) enemy.spawn(x, y);
        } else if (type === 'shooter') {
            const enemy = this.shooterEnemies.get(x, y);
            if (enemy) {
                enemy.spawn(x, y);
                // Override projectile count
                enemy.projectileCount = shots;
                enemy.startShooting(this.projectiles, this.currentHeight);
            }
        } else if (type === 'shooter-fast') {
            const enemy = this.shooterEnemies.get(x, y);
            if (enemy) {
                enemy.spawn(x, y);
                // Fast shooter: 2 shots, faster interval
                enemy.projectileCount = 2;
                enemy.shootInterval = 1000; // Faster (default is 2000)
                enemy.startShooting(this.projectiles, this.currentHeight);
            }
        } else if (type === 'jumper') {
            const enemy = this.jumperShooterEnemies.get(x, y);
            if (enemy) {
                enemy.spawn(x, y);
                enemy.startBehavior(this.projectiles);
            }
        }
    }

    spawnPowerup(type) {
        const y = this.player.y - 200;
        const gameWidth = this.cameras.main.width;
        const wallWidth = 32;
        const minX = wallWidth + 28;
        const maxX = gameWidth - wallWidth - 28;
        const x = Phaser.Math.Between(minX, maxX);

        if (type === 'shield') {
            const powerup = this.powerups.create(x, y, 'powerup_ball');
            enablePlatformRider(powerup, { mode: 'carry', marginX: 2 });
        } else if (type === 'coin') {
            const coin = this.coins.create(x, y, 'coin');
            enablePlatformRider(coin, { mode: 'carry', marginX: 2 });
        }
    }

    spawnPlatform(type, mode = 'clean') {
        const startY = this.player.y - 100;

        const centerX = this.cameras.main.centerX;
        if (type === 'static') {
            this.levelManager.spawnPlatform(centerX, startY, 140, false);
            if (mode === 'prepopulate') {
                this.spawnRandomOnPlatform(centerX, startY);
            }
        } else if (type === 'moving-slow') {
            this.levelManager.spawnPlatform(centerX, startY, 140, true, 80); // Slow speed
            if (mode === 'prepopulate') {
                this.spawnRandomOnPlatform(centerX, startY);
            }
        } else if (type === 'moving-fast') {
            this.levelManager.spawnPlatform(centerX, startY, 140, true, 150); // Fast speed
            if (mode === 'prepopulate') {
                this.spawnRandomOnPlatform(centerX, startY);
            }
        } else if (type === 'zigzag') {
            const gameWidth = this.cameras.main.width;
            const wallWidth = 32;
            const centerX = this.cameras.main.centerX;
            const minX = wallWidth + 28;
            const maxX = gameWidth - wallWidth - 28;
            // Zigzag between left and right sides of playable area
            const leftX = minX + (centerX - minX) * 0.5;
            const rightX = centerX + (maxX - centerX) * 0.5;
            for (let i = 0; i < 6; i++) {
                const x = (i % 2 === 0) ? leftX : rightX;
                const y = startY - (i * 100);
                this.levelManager.spawnPlatform(x, y, 100, false);

                if (mode === 'prepopulate') {
                    this.spawnRandomOnPlatform(x, y);
                }
            }
        }
    }

    spawnRandomOnPlatform(x, y) {
        // Random: coin, powerup, or patrol enemy
        const rand = Phaser.Math.Between(0, 2);

        if (rand === 0) {
            // Coin
            const coin = this.coins.create(x, y - 50, 'coin');
            enablePlatformRider(coin, { mode: 'carry', marginX: 2 });
        } else if (rand === 1) {
            // Powerup
            const powerup = this.powerups.create(x, y - 50, 'powerup_ball');
            enablePlatformRider(powerup, { mode: 'carry', marginX: 2 });
        } else {
            // Patrol enemy
            const enemy = this.patrolEnemies.get(x, y - 40);
            if (enemy) enemy.spawn(x, y - 40);
        }
    }

    spawnMaze(difficulty) {
        const y = this.player.y - 300;

        // Set a valid currentHeight to ensure getLevelConfig returns valid config
        // Using 1000m as reference (mid-game difficulty)
        const originalHeight = this.currentHeight;
        this.currentHeight = 1000;

        let patternPool = difficulty === 'hard' ? MAZE_PATTERNS_HARD : MAZE_PATTERNS_EASY;

        if (!patternPool || patternPool.length === 0) {
            console.warn('No maze patterns available for difficulty:', difficulty);
            this.currentHeight = originalHeight;
            return;
        }

        const pattern = Phaser.Utils.Array.GetRandom(patternPool);

        if (!pattern || pattern.length === 0) {
            console.warn('Invalid maze pattern selected');
            this.currentHeight = originalHeight;
            return;
        }

        // Spawn maze rows from top to bottom
        for (let i = 0; i < pattern.length; i++) {
            const config = pattern[i];
            const rowY = y - (i * 160);
            this.levelManager.spawnMazeRowFromConfig(rowY, config, true, true, i, pattern);
        }

        // Restore original height
        this.currentHeight = originalHeight;
    }

    spawnSpecificMaze(index, mode = 'clean') {
        const y = this.player.y - 300;

        // Set valid currentHeight
        const originalHeight = this.currentHeight;
        this.currentHeight = 1000;

        const pattern = MAZE_PATTERNS[index];

        if (!pattern || pattern.length === 0) {
            console.warn('Invalid maze pattern index:', index);
            this.currentHeight = originalHeight;
            return;
        }

        // Spawn maze rows from top to bottom
        for (let i = 0; i < pattern.length; i++) {
            const config = pattern[i];
            const rowY = y - (i * 160);

            if (mode === 'clean') {
                // Spawn without enemies/items (pass false for allowSpikes)
                this.levelManager.spawnMazeRowFromConfig(rowY, config, false, false, i, pattern);
            } else {
                // Spawn with full populate: enemies, coins, and powerups
                // Use true for both moving and spikes to get full variety
                this.levelManager.spawnMazeRowFromConfig(rowY, config, true, true, i, pattern);
            }
        }

        // Restore original height
        this.currentHeight = originalHeight;
    }

    spawnPreset() {
        const startY = this.player.y - 100;

        // Create a test section with various elements
        // 1. Zigzag platforms
        const gameWidth = this.cameras.main.width;
        const wallWidth = 32;
        const centerX = this.cameras.main.centerX;
        const minX = wallWidth + 28;
        const maxX = gameWidth - wallWidth - 28;
        const leftX = minX + (centerX - minX) * 0.5;
        const rightX = centerX + (maxX - centerX) * 0.5;
        for (let i = 0; i < 4; i++) {
            const x = (i % 2 === 0) ? leftX : rightX;
            const y = startY - (i * 100);
            this.levelManager.spawnPlatform(x, y, 100, false);
        }

        // 2. Moving platform
        this.levelManager.spawnPlatform(centerX, startY - 500, 120, true, 100);

        // 3. Patrol enemy on platform
        const platformY = startY - 600;
        this.levelManager.spawnPlatform(centerX, platformY, 120, false);
        const patrolEnemy = this.patrolEnemies.get(centerX, platformY - 40);
        if (patrolEnemy) patrolEnemy.spawn(centerX, platformY - 40);

        // 4. Shooter enemy
        const shooterX = minX + (centerX - minX) * 0.5;
        const shooterEnemy = this.shooterEnemies.get(shooterX, startY - 700);
        if (shooterEnemy) {
            shooterEnemy.spawn(shooterX, startY - 700);
            shooterEnemy.startShooting(this.projectiles, 1000);
        }

        // 5. Coins
        for (let i = 0; i < 3; i++) {
            const coin = this.coins.create(centerX, startY - 200 - (i * 100), 'coin');
            enablePlatformRider(coin, { mode: 'carry', marginX: 2 });
        }

        // 6. Shield powerup
        const powerup = this.powerups.create(centerX, startY - 800, 'powerup_ball');
        enablePlatformRider(powerup, { mode: 'carry', marginX: 2 });

        // 7. Easy maze at the top
        this.currentHeight = 1000;
        const mazeY = startY - 1000;
        const pattern = MAZE_PATTERNS_EASY[0];
        for (let i = 0; i < pattern.length; i++) {
            const config = pattern[i];
            const rowY = mazeY - (i * 160);
            this.levelManager.spawnMazeRowFromConfig(rowY, config, true, true, i, pattern);
        }
        this.currentHeight = 0;
    }
}
