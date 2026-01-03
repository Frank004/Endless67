import { CollisionManager } from '../../src/managers/collision/CollisionManager.js';

describe('CollisionManager', () => {
    test('setupCollisions wires all collider and overlap pairs', () => {
        const collider = jest.fn();
        const overlap = jest.fn();

        const scene = {
            physics: { add: { collider, overlap } },
            player: {},
            platforms: {},
            mazeWalls: {},
            leftWall: {},
            rightWall: {},
            patrolEnemies: {},
            shooterEnemies: {},
            jumperShooterEnemies: {},
            coins: {},
            powerups: {},
            riser: {},
            projectiles: {}
        };

        new CollisionManager(scene).setupCollisions();

        const colliderPairs = collider.mock.calls.map(([a, b]) => [a, b]);
        const overlapPairs = overlap.mock.calls.map(([a, b]) => [a, b]);

        expect(colliderPairs).toEqual(expect.arrayContaining([
            [scene.player, scene.platforms],
            [scene.player, scene.mazeWalls],
            [scene.patrolEnemies, scene.mazeWalls],
            [scene.patrolEnemies, scene.platforms],
            [scene.patrolEnemies, scene.leftWall],
            [scene.patrolEnemies, scene.rightWall],
            [scene.shooterEnemies, scene.platforms],
            [scene.jumperShooterEnemies, scene.leftWall],
            [scene.jumperShooterEnemies, scene.rightWall],
            [scene.coins, scene.platforms],
            [scene.powerups, scene.platforms]
        ]));

        expect(overlapPairs).toEqual(expect.arrayContaining([
            [scene.player, scene.patrolEnemies],
            [scene.player, scene.shooterEnemies],
            [scene.player, scene.jumperShooterEnemies],
            [scene.player, scene.coins],
            [scene.player, scene.powerups],
            [scene.player, scene.riser],
            [scene.player, scene.projectiles],
            [scene.projectiles, scene.leftWall],
            [scene.projectiles, scene.rightWall]
        ]));
    });
});
