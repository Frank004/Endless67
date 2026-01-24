import { LAYOUT_CONFIG } from '../../Config/LayoutConfig.js';
import { WALLS } from '../../Config/GameConstants.js';
import { Tires } from '../../Entities/Tires.js';
import { Trashcan } from '../../Entities/Trashcan.js';
import { TrashcanInteractable } from '../../Systems/Gameplay/interactables/TrashcanInteractable.js';

/**
 * StageProps
 * 
 * Manages decorative props on the stage floor (left and right).
 * These props are UI-like elements that stay with the floor.
 */
export class StageProps {
    constructor(scene) {
        this.scene = scene;
        this.leftProp = null;   // legacy references (tires)
        this.rightProp = null;  // legacy references (trashcan)
        this.tires = null;
        this.trashcan = null;
    }

    /**
     * Creates decorative props on the stage floor (left and right)
     */
    create(screenHeight) {
        const gameWidth = this.scene.scale.width;
        const wallWidth = WALLS.WIDTH;
        const floorHeight = LAYOUT_CONFIG.stageFloor.height;
        // StageFloor is centered at y = screenHeight - (floorHeight / 2) = screenHeight - 16
        // With origin (0.5, 0.5), the top of the floor is at screenHeight - 32
        // We want props to sit ON TOP of the floor, so their bottom should be at the floor's top
        const floorTopY = screenHeight - floorHeight; // Top of the floor

        // Tires (left)
        const leftPropX = wallWidth + 10; // desplazado 5px más a la derecha
        this.tires = new Tires(this.scene, leftPropX, floorTopY + 8);
        this.leftProp = this.tires; // legacy alias

        // Trashcan (right)
        const rightPropX = gameWidth - wallWidth - 1;
        this.trashcan = new Trashcan(this.scene, rightPropX, floorTopY + 3);
        this.rightProp = this.trashcan; // legacy alias

        // Register trashcan as interactable
        if (this.scene.interactableManager) {
            const trashcanInteractable = new TrashcanInteractable(this.scene, this.trashcan);
            this.scene.interactableManager.register('trashcan', trashcanInteractable);
        }
    }

    /**
     * Destroys the props
     */
    destroy() {
        // Unregister interactables
        if (this.scene.interactableManager) {
            this.scene.interactableManager.unregister('trashcan');
        }

        if (this.tires && typeof this.tires.destroy === 'function') {
            this.tires.destroy();
        } else if (this.leftProp && typeof this.leftProp.destroy === 'function') {
            this.leftProp.destroy();
        }
        this.leftProp = this.tires = null;

        if (this.trashcan && typeof this.trashcan.destroy === 'function') {
            this.trashcan.destroy();
        } else if (this.rightProp && typeof this.rightProp.destroy === 'function') {
            this.rightProp.destroy();
        }
        this.rightProp = this.trashcan = null;
    }
}
