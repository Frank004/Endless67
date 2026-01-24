/* eslint-disable */
import { Game } from './Game.js';
import { PlaygroundRules } from '../Playground/Logic/PlaygroundRules.js';
import { PlaygroundCleanup } from '../Playground/Logic/PlaygroundCleanup.js';
import { PlaygroundDevMenu } from '../Playground/UI/PlaygroundDevMenu.js';
import EventBus, { Events } from '../Core/EventBus.js';

export class Playground extends Game {
    constructor() {
        super('Playground');
        this.rules = new PlaygroundRules(this);
        this.cleanup = new PlaygroundCleanup(this);
        this.devMenu = new PlaygroundDevMenu(this, this.cleanup);
    }

    create() {
        console.log('[Playground] Creating Scene...');
        super.create(); // Standard Game initialization (GameInitializer, etc.)

        // 1. Override Death Logic (Prevent Leaderboard/Game Over Screen)
        // Remove standard listeners added by GameInitializer
        EventBus.removeAllListeners(Events.GAME_OVER);
        // Add Playground-specific death handler
        EventBus.on(Events.GAME_OVER, this.handlePlaygroundDeath, this);

        // 2. Apply Playground Rules (Disable generators, setup player props)
        this.rules.applyStartRules();

        // 3. Clear initial platforms (but keep StageFloor)
        if (this.platforms) this.platforms.clear(true, true);

        // 4. Create Dev UI
        this.devMenu.createUI();

        console.log('[Playground] Initialized Modular Architecture (vRefactor+Fixes)');
    }

    update(time, delta) {
        // If menu is open, pause most update logic is handled by physics.pause() in menu toggle
        if (this.devMenu.isDevMenuOpen) {
            return;
        }

        // Standard updates logic for Playground entities

        // Input Manager (Physics/Jumping)
        if (this.inputManager) this.inputManager.update(time, delta);

        // Player
        if (this.player) this.player.update();

        // Level Manager (Moving Platforms)
        // We disabled generation, but kept update() for entity movement
        if (this.levelManager) this.levelManager.update();

        // Background Parallax (Optional lock)
        if (this.background) this.background.tilePositionY = 0;
    }

    handlePlaygroundDeath() {
        console.log('[Playground] Player Died - Respawning...');

        // Reset Player Visuals & State
        if (this.player) {
            this.player.setVelocity(0, 0);
            this.player.setAlpha(1);
            this.player.clearTint();

            // Reset Controller State (FSM)
            if (this.player.controller && this.player.controller.resetState) {
                this.player.controller.resetState();
            }

            // Respawn at start position
            this.rules.setupPlayer();
        }

        // Ensure Physics is running
        this.physics.resume();
        this.isGameOver = false;
    }
}
