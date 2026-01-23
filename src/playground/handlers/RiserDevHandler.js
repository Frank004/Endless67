import { DevHandler } from './DevHandler.js';
import { RiserConfiguration, RISER_TYPES } from '../../config/RiserConfig.js';

export class RiserDevHandler extends DevHandler {
    getCategoryLabel() {
        return 'Risers';
    }

    getIcon() {
        return 'water';
    }

    getItems() {
        const riserItems = Object.keys(RISER_TYPES).map(key => {
            const type = RISER_TYPES[key];
            return {
                icon: 'tornado', // Placeholder icon
                label: `Set ${key}`,
                callback: () => this.setRiserType(type),
                type: 'single'
            };
        });

        // Add Toggle Riser at the start
        riserItems.unshift({
            icon: 'up',
            label: 'Toggle Riser (On/Off)',
            callback: () => this.toggleRiser(),
            type: 'single',
            color: '#ffff00'
        });

        return riserItems;
    }

    toggleRiser() {
        const scene = this.scene;
        if (scene.riserManager) {
            const newState = !scene.riserManager.enabled;
            scene.riserManager.setEnabled(newState);
            console.log('Riser Enabled:', newState);
        }
    }

    setRiserType(type) {
        const scene = this.scene;
        if (!scene.riserManager) return;

        // Destroy existing riser visual if exists
        if (scene.riserManager.riser) {
            scene.riserManager.riser.destroy();
        }

        // Re-configure logic
        scene.riserManager.config = new RiserConfiguration(type);
        scene.riserManager.createRiser();
        scene.riserManager.setEnabled(true);
        console.log(`Riser set to: ${type}`);
    }
}
