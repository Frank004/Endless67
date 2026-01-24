import { DevHandler } from './DevHandler.js';
import { MAZE_PATTERNS } from '../../Data/MazePatterns.js';

export class MazeDevHandler extends DevHandler {
    getCategoryLabel() {
        return 'Mazes';
    }

    getIcon() {
        return 'tornado';
    }

    getItems() {
        return MAZE_PATTERNS.map((pattern, index) => {
            const label = `Maze ${index + 1} (${pattern.length} Rows)`;
            return {
                icon: 'tornado',
                label: label,
                callback: (mode) => this.spawnSpecificMaze(index, mode),
                type: 'dual',
                color: '#00ff00'
            };
        });
    }

    spawnSpecificMaze(index, mode = 'clean') {
        const scene = this.scene;
        console.log(`Spawning Maze Index: ${index}`);

        const pattern = MAZE_PATTERNS[index];
        if (!pattern) return;

        // Where to start spawning? slightly above player
        const startY = scene.player.y - 150;
        // Use mazeSpawner
        if (scene.levelManager && scene.levelManager.mazeSpawner) {
            scene.levelManager.mazeSpawner.spawnPattern(startY, pattern);
        } else {
            console.error('MazeSpawner not found in LevelManager');
        }
    }
}
