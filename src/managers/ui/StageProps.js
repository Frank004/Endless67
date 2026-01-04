import { LAYOUT_CONFIG } from '../../config/LayoutConfig.js';
import { ASSETS } from '../../config/AssetKeys.js';
import { WALLS } from '../../config/GameConstants.js';

/**
 * StageProps
 * 
 * Manages decorative props on the stage floor (left and right).
 * These props are UI-like elements that stay with the floor.
 */
export class StageProps {
    constructor(scene) {
        this.scene = scene;
        this.leftProp = null;
        this.rightProp = null;
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

        // Prop left (tires.png) - positioned on top of the floor, lowered 8px, offset 5px from wall
        const leftPropX = wallWidth + 5; // 5px offset from wall (reduced from 10px)
        this.leftProp = this.scene.add.image(leftPropX, floorTopY + 8, ASSETS.PROPS, 'tires.png');
        this.leftProp.setOrigin(0.5, 1); // Anchor at bottom center, so bottom sits on floor top
        this.leftProp.setDepth(11); // Just above floor (depth 10)

        // Prop right (transcan.png) - positioned on top of the floor, lowered 3px, offset 10px from wall
        // Use sprite instead of image to support animation
        const rightPropX = gameWidth - wallWidth - 1; // 5px offset from wall
        this.rightProp = this.scene.add.sprite(rightPropX, floorTopY + 3, ASSETS.PROPS, 'transcan.png');
        this.rightProp.setOrigin(0.5, 1); // Anchor at bottom center, so bottom sits on floor top
        this.rightProp.setDepth(25); // Above player (depth 20) to prevent pixel bleeding when animation plays
        
        // Add physics body for collision detection
        this.scene.physics.add.existing(this.rightProp, true); // Static body
        this.rightProp.body.setSize(23, 32); // Match transcan.png size from props.json
        this.rightProp.body.setOffset(0, 0);
        this.rightProp.setData('collisionEnabled', true); // Flag to enable/disable collision
    }

    /**
     * Destroys the props
     */
    destroy() {
        if (this.leftProp && typeof this.leftProp.destroy === 'function') {
            this.leftProp.destroy();
            this.leftProp = null;
        }
        if (this.rightProp && typeof this.rightProp.destroy === 'function') {
            this.rightProp.destroy();
            this.rightProp = null;
        }
    }
}

