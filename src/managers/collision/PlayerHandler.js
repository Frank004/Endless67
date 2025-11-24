import { ScoreManager } from '../ScoreManager.js';

export class PlayerHandler {
    constructor(scene) {
        this.scene = scene;
    }

    handlePlatformCollision(player, platform) {
        if (player.body.touching.down && platform.body.touching.up) {
            player.handleLand(platform);
        }

        // Fix: If moving platform hits player horizontally, reverse platform to avoid crushing player
        if (platform.getData('isMoving')) {
            if ((player.body.touching.left && platform.body.touching.right) ||
                (player.body.touching.right && platform.body.touching.left)) {

                const currentVel = platform.body.velocity.x;
                // Only reverse if moving towards the player
                if ((player.body.touching.left && currentVel > 0) ||
                    (player.body.touching.right && currentVel < 0)) {
                    platform.setVelocityX(-currentVel);
                }
            }
        }
    }

    handleLand(player, floor) {
        player.handleLand(floor);
    }

    handleWallTouch(player, wall, side) {
        player.handleWallTouch(side);
    }

    touchLava(player, lava) {
        const scene = this.scene;
        if (scene.isGameOver) return;
        if (scene.isInvincible) {
            scene.deactivatePowerup();
            if (scene.powerupTimer) scene.powerupTimer.remove();
            player.setVelocityY(-900);
            let t = scene.uiText.scene.add.text(player.x, player.y - 50, 'LAVA JUMP!', { fontSize: '18px', color: '#fff', stroke: '#f00', strokeThickness: 4 }).setOrigin(0.5).setDepth(100);
            scene.tweens.add({ targets: t, y: player.y - 150, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
            return;
        }

        try {
            if (scene.sound && scene.cache.audio.exists('lava_drop')) {
                scene.sound.play('lava_drop', { volume: 0.7 });
            }
        } catch (error) {
            console.warn('Error playing lava drop sound:', error);
        }

        scene.isGameOver = true;
        scene.burnEmitter.emitParticleAt(player.x, player.y, 50);
        player.setVelocity(0, 0);
        player.setTint(0x000000);
        scene.time.delayedCall(300, () => {
            player.setVisible(false);
            player.setActive(false);
        });

        scene.time.delayedCall(50, () => {
            scene.lavaManager.triggerRising();
        });

        scene.physics.pause();
        scene.uiText.setText(`GAME OVER\nScore: ${scene.totalScore}`);
        scene.uiText.setVisible(true);
        scene.uiText.setDepth(200);
        scene.scoreText.setDepth(200);

        scene.time.delayedCall(1000, () => {
            // Check for high score - only show name input if score qualifies for top 10
            const scoreManager = new ScoreManager();
            if (scoreManager.isHighScore(scene.currentHeight, scene.totalScore)) {
                // Show Input for Name - this score will enter the leaderboard
                this.showNameInput(scene, scoreManager);
            } else {
                // Score doesn't qualify for top 10 - show options directly
                this.showPostGameOptions(scene);
            }
        });
    }

    showNameInput(scene, scoreManager) {
        scene.uiText.setVisible(false); // Hide Game Over text temporarily

        // Background for input
        const centerX = scene.cameras.main.centerX;
        const bg = scene.add.rectangle(centerX, 300, 320, 240, 0x000000, 0.95).setDepth(300).setScrollFactor(0);
        bg.setStrokeStyle(2, 0xffd700);

        const title = scene.add.text(centerX, 220, 'NEW HIGH SCORE!', {
            fontSize: '24px', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        const prompt = scene.add.text(centerX, 260, 'ENTER 3 INITIALS:', {
            fontSize: '16px', color: '#fff'
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        // Name Display
        let name = '';
        const nameText = scene.add.text(centerX, 310, '_ _ _', {
            fontSize: '48px', color: '#00ffff', fontStyle: 'bold', letterSpacing: 10
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        // Virtual Keyboard Listener
        const keyListener = (event) => {
            if (event.keyCode === 8 && name.length > 0) { // Backspace
                name = name.slice(0, -1);
            } else if (event.keyCode === 13 && name.length > 0) { // Enter
                this.confirmScore(scene, scoreManager, name, keyListener, [bg, title, prompt, nameText, confirmBtn]);
            } else if (name.length < 3 && event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
                name += event.key.toUpperCase();
            }

            // Update display
            let display = name.padEnd(3, '_').split('').join(' ');
            nameText.setText(display);
        };

        scene.input.keyboard.on('keydown', keyListener);

        const confirmBtn = scene.add.text(centerX, 380, 'CONFIRM', {
            fontSize: '24px', color: '#00ff00', backgroundColor: '#333', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0).setInteractive({ useHandCursor: true });

        confirmBtn.on('pointerdown', () => {
            if (name.length > 0) {
                this.confirmScore(scene, scoreManager, name, keyListener, [bg, title, prompt, nameText, confirmBtn]);
            }
        });
    }

    confirmScore(scene, scoreManager, name, keyListener, elementsToDestroy) {
        scoreManager.saveScore(name || 'UNK', scene.totalScore, scene.currentHeight);
        scene.input.keyboard.off('keydown', keyListener);

        // Clean up input UI
        elementsToDestroy.forEach(el => el.destroy());

        // Show Options
        this.showPostGameOptions(scene);
    }

    showPostGameOptions(scene) {
        scene.uiText.setVisible(true); // Ensure Game Over text is visible
        scene.uiText.setText(`GAME OVER\nScore: ${scene.totalScore}`);

        const centerX = scene.cameras.main.centerX;
        const startY = 350;
        const spacing = 60;

        // Restart Button
        const restartBtn = scene.add.text(centerX, startY, '🔄 RESTART', {
            fontSize: '24px', color: '#00ff00', backgroundColor: '#333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => {
            scene.scene.restart();
        });

        // Leaderboard Button
        const leaderboardBtn = scene.add.text(centerX, startY + spacing, '🏆 LEADERBOARD', {
            fontSize: '24px', color: '#00ffff', backgroundColor: '#333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0).setInteractive({ useHandCursor: true });

        leaderboardBtn.on('pointerdown', () => {
            scene.scene.start('Leaderboard');
        });

        // Menu Button
        const menuBtn = scene.add.text(centerX, startY + spacing * 2, '🏠 MAIN MENU', {
            fontSize: '24px', color: '#ffffff', backgroundColor: '#333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(301).setScrollFactor(0).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => {
            scene.scene.start('MainMenu');
        });

        // Hover effects
        [restartBtn, leaderboardBtn, menuBtn].forEach(btn => {
            btn.on('pointerover', () => btn.setColor('#ffff00'));
            btn.on('pointerout', () => {
                if (btn === restartBtn) btn.setColor('#00ff00');
                else if (btn === leaderboardBtn) btn.setColor('#00ffff');
                else btn.setColor('#ffffff');
            });
        });
    }
}
