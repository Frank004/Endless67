import EventBus, { Events } from '../../Core/EventBus.js';

export class MenuNavigation {
    /**
     * @param {Phaser.Scene} scene 
     * @param {Array} buttons - Array of button objects created via UIHelpers
     */
    constructor(scene, buttons = []) {
        this.scene = scene;
        this.buttons = buttons;
        this.selectedIndex = 0;
        this.isActive = false;

        this.navListeners = {
            up: () => this.navigate(-1),
            down: () => this.navigate(1),
            left: () => this.navigate(-1),
            right: () => this.navigate(1),
            select: () => this.triggerSelection()
        };
    }

    setup() {
        if (this.isActive) return;
        this.isActive = true;

        // Auto selection
        if (this.buttons.length > 0) {
            this.selectButton(this.selectedIndex);
        }

        EventBus.on(Events.UI_NAV_UP, this.navListeners.up, this);
        EventBus.on(Events.UI_NAV_DOWN, this.navListeners.down, this);
        EventBus.on(Events.UI_NAV_LEFT, this.navListeners.left, this);
        EventBus.on(Events.UI_NAV_RIGHT, this.navListeners.right, this);
        EventBus.on(Events.UI_SELECT, this.navListeners.select, this);
    }

    cleanup() {
        if (!this.isActive) return;
        this.isActive = false;

        EventBus.off(Events.UI_NAV_UP, this.navListeners.up, this);
        EventBus.off(Events.UI_NAV_DOWN, this.navListeners.down, this);
        EventBus.off(Events.UI_NAV_LEFT, this.navListeners.left, this);
        EventBus.off(Events.UI_NAV_RIGHT, this.navListeners.right, this);
        EventBus.off(Events.UI_SELECT, this.navListeners.select, this);

        // Deselect current to clean up visuals if needed
        const current = this.buttons[this.selectedIndex];
        if (current && current.deselect) current.deselect();
    }

    navigate(direction) {
        if (this.buttons.length === 0) return;

        // Deselect current
        const current = this.buttons[this.selectedIndex];
        if (current && current.deselect) current.deselect();

        // Update index
        this.selectedIndex = (this.selectedIndex + direction + this.buttons.length) % this.buttons.length;

        // Select new
        const next = this.buttons[this.selectedIndex];
        if (next && next.select) next.select();
    }

    selectButton(index) {
        if (index < 0 || index >= this.buttons.length) return;

        // Deselect previous
        const current = this.buttons[this.selectedIndex];
        if (current && current.deselect) current.deselect();

        this.selectedIndex = index;

        // Select new
        const next = this.buttons[this.selectedIndex];
        if (next && next.select) next.select();
    }

    triggerSelection() {
        const current = this.buttons[this.selectedIndex];
        if (current && current.trigger) {
            current.trigger();
        } else if (current && current.container && current.container.getData('onClick')) {
            // Fallback for older buttons not yet fully refactored if mixing code
            current.container.getData('onClick')();
        }
    }

    updateButtons(newButtons) {
        this.cleanup();
        this.buttons = newButtons;
        this.selectedIndex = 0;
        this.setup();
    }
}
