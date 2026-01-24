export class DevHandler {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * @returns {string} The label for the menu category
     */
    getCategoryLabel() {
        return 'Unknown';
    }

    /**
     * @returns {string} The icon key for the header
     */
    getIcon() {
        return 'alien';
    }

    /**
     * @returns {Array<{label: string, icon: string, type: 'single'|'dual', callback: Function}>}
     */
    getItems() {
        return [];
    }
}
