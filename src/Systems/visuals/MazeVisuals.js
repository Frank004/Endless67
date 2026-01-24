import { ASSETS } from '../../Config/AssetKeys.js';
import { MAZE_ROW_HEIGHT } from '../../Data/MazePatterns.js';

/**
 * MazeVisuals
 * 
 * Handles the visual construction of Maze elements (floors, joints, walls).
 * Extracted from MazeSpawner.js to strictly separate Visuals from Logic.
 */
export class MazeVisuals {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Creates the scrolling TileSprite for the maze floor surface.
     * Handles specific texture logic (clean, deco, broken variants).
     * 
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} width - Width of the segment
     * @param {number} height - Height of the segment (usually MAZE_ROW_HEIGHT)
     * @param {number} originX - Origin X (0, 0.5, 1)
     * @returns {Phaser.GameObjects.TileSprite} The created visual object
     */
    createFloorVisual(x, y, width, height, originX = 0) {
        const scene = this.scene;
        if (!scene?.add?.tileSprite) return null;

        // Randomly select beam texture
        const r = Math.random();
        let frame = ' beam.png';

        if (r < 0.5) {
            frame = ' beam.png';
        } else if (r < 0.8) {
            const idx = Phaser.Math.Between(1, 11);
            frame = ` beam-deco-${idx.toString().padStart(2, '0')}.png`;
        } else {
            const idx = Phaser.Math.Between(1, 3);
            frame = ` beam-broken-${idx.toString().padStart(2, '0')}.png`;
        }

        // Safety: ensure frame exists
        if (scene.textures.exists(ASSETS.FLOOR)) {
            const floorTex = scene.textures.get(ASSETS.FLOOR);
            if (!floorTex.has(frame)) {
                if (floorTex.has(frame.trim())) {
                    frame = frame.trim();
                } else {
                    frame = floorTex.has(' beam.png') ? ' beam.png' : 'beam.png';
                }
            }
        }

        const visual = scene.add.tileSprite(x, y, width, height, ASSETS.FLOOR, frame);
        visual.setOrigin(originX, 0.5);
        visual.setDepth(12); // Standard depth for maze floor

        return visual;
    }

    /**
     * Adds a beam joint decoration at the specified position.
     * 
     * @param {number} x - Position X
     * @param {number} y - Position Y (Center of the row)
     * @param {boolean} isLeft - True if left-side joint, False if right-side
     */
    addJoint(x, y, isLeft) {
        const scene = this.scene;
        if (!scene?.add?.image) return;

        const rowHeight = MAZE_ROW_HEIGHT;
        const jointY = y + (rowHeight / 2); // Align to bottom of the row

        const r = Math.random();
        let num = 1;

        if (r < 0.5) num = 1;
        else if (r < 0.75) num = 2;
        else num = 3;

        const sideChar = isLeft ? 'l' : 'r';
        const frame = `beam-joint-${sideChar}-0${num}.png`;

        let finalFrame = frame;
        const texture = scene.textures.get(ASSETS.FLOOR);
        if (texture && !texture.has(frame)) {
            finalFrame = `beam-joint-${sideChar}-01.png`;
            if (!texture.has(finalFrame)) return;
        }

        const joint = scene.add.image(x, jointY, ASSETS.FLOOR, finalFrame);
        // Align on the wall seam:
        // Left (32): Origin 1 -> Draws towards left (on wall)
        // Right (368): Origin 0 -> Draws towards right (on wall)
        joint.setOrigin(isLeft ? 1 : 0, 1);
        joint.setDepth(13); // Above beam
    }
}
