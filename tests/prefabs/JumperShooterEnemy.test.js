import { JumperShooterEnemy } from '../../src/entities/Enemy.js';
import { ENEMY_CONFIG } from '../../src/config/EnemyConfig.js';

// Mock Phaser
global.Phaser = {
    Physics: {
        Arcade: {
            Sprite: class {
                constructor(scene, x, y, texture) {
                    this.scene = scene;
                    this.x = x;
                    this.y = y;
                    this.texture = texture;
                    this.body = {
                        reset: jest.fn(),
                        setSize: jest.fn(),
                        setOffset: jest.fn(),
                        allowGravity: false,
                        immovable: true,
                        touching: { down: false },
                        blocked: { down: false },
                        velocity: { x: 0, y: 0 },
                        width: 32,
                        height: 32,
                        updateFromGameObject: jest.fn()
                    };
                }
                setDepth() { return this; }
                setDisplaySize() { return this; }
                setScale() { return this; }
                setGravityY() { return this; }
                setActive() { return this; }
                setVisible() { return this; }
                setVelocityX() { return this; }
                setVelocityY() { return this; }
                setPosition() { return this; }
                destroy() { }
            }
        }
    },
    Math: {
        Clamp: (value, min, max) => Math.max(min, Math.min(max, value))
    }
};

// Mock platformRider
jest.mock('../../src/utils/platformRider.js', () => ({
    enablePlatformRider: jest.fn((sprite, options) => {
        sprite.isPlatformRider = true;
        sprite.riderMode = options.mode;
        sprite.riderMarginX = options.marginX;
        sprite.ridingPlatform = null;
        sprite.localOffsetX = null;
    }),
    handlePlatformRiderCollision: jest.fn(),
    updatePlatformRider: jest.fn()
}));

// Mock behaviors
jest.mock('../../src/entities/behaviors/JumpBehavior.js', () => ({
    JumpBehavior: class {
        constructor(enemy, jumpForce) {
            this.enemy = enemy;
            this.jumpForce = jumpForce;
        }
        startJumping = jest.fn();
        stopJumping = jest.fn();
        destroy = jest.fn();
    }
}));

jest.mock('../../src/entities/behaviors/ShootBehavior.js', () => ({
    ShootBehavior: class {
        constructor(enemy) {
            this.enemy = enemy;
        }
        startShooting = jest.fn();
        stopShooting = jest.fn();
        destroy = jest.fn();
    }
}));

describe('JumperShooterEnemy', () => {
    let mockScene;
    let jumper;

    beforeEach(() => {
        mockScene = {
            physics: {
                add: {
                    existing: jest.fn()
                }
            },
            tweens: {
                add: jest.fn()
            },
            jumperShooterEnemies: {
                remove: jest.fn()
            },
            textures: {
                exists: jest.fn(() => false)
            },
            add: {
                graphics: jest.fn(() => ({
                    fillStyle: jest.fn(),
                    fillRect: jest.fn(),
                    generateTexture: jest.fn(),
                    destroy: jest.fn()
                }))
            },
            jumperShooterEnemyPool: {
                despawn: jest.fn()
            },
            player: {
                y: 0
            },
            currentHeight: 100
        };

        jumper = new JumperShooterEnemy(mockScene, 100, 200);
    });

    describe('Constructor', () => {
        test('should NOT use platformRider (uses simple gravity like player)', () => {
            expect(jumper.isPlatformRider).toBeUndefined();
        });

        test('should initialize jump and shoot behaviors', () => {
            expect(jumper.jumpBehavior).toBeDefined();
            expect(jumper.shootBehavior).toBeDefined();
        });
    });

    describe('spawn()', () => {
        test('should enable gravity', () => {
            jumper.spawn(150, 250);
            expect(jumper.body.allowGravity).toBe(true);
        });

        test('should set immovable to false', () => {
            jumper.spawn(150, 250);
            expect(jumper.body.immovable).toBe(false);
        });

        test('should configure body size correctly', () => {
            jumper.spawn(150, 250);
            // Body completo 32x32
            expect(jumper.body.setSize).toHaveBeenCalledWith(29, 24);
        });
    });

    describe('preUpdate() - Cleanup', () => {
        test('should despawn when too far below player', () => {
            jumper.y = 1000;
            mockScene.player.y = 0;

            jumper.preUpdate(0, 16);

            expect(mockScene.jumperShooterEnemyPool.despawn).toHaveBeenCalledWith(jumper);
        });

        test('should not despawn when near player', () => {
            jumper.y = 500;
            mockScene.player.y = 0;

            jumper.preUpdate(0, 16);

            expect(mockScene.jumperShooterEnemyPool.despawn).not.toHaveBeenCalled();
        });
    });

    describe('stopBehavior()', () => {
        test('should stop both behaviors', () => {
            jumper.stopBehavior();

            expect(jumper.jumpBehavior.stopJumping).toHaveBeenCalled();
            expect(jumper.shootBehavior.stopShooting).toHaveBeenCalled();
        });
    });

    describe('despawn()', () => {
        test('should stop behaviors', () => {
            jumper.despawn();

            expect(jumper.jumpBehavior.stopJumping).toHaveBeenCalled();
            expect(jumper.shootBehavior.stopShooting).toHaveBeenCalled();
        });
    });
});
