

export class PhaserMock {
    static Input = {
        Keyboard: {
            KeyCodes: {
                SPACE: 32,
                LEFT: 37,
                UP: 38,
                RIGHT: 39,
                DOWN: 40,
                W: 87,
                A: 65,
                S: 83,
                D: 68
            }
        }
    };

    static Math = {
        Between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        FloatBetween: (min, max) => Math.random() * (max - min) + min,
        Clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
        Linear: (p0, p1, t) => (p1 - p0) * t + p0,
        Distance: {
            Between: (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
        }
    };

    static Utils = {
        Array: {
            GetRandom: (arr) => arr[Math.floor(Math.random() * arr.length)],
            Shuffle: (arr) => arr.sort(() => Math.random() - 0.5),
            Remove: (arr, item) => {
                const idx = arr.indexOf(item);
                if (idx !== -1) arr.splice(idx, 1);
                return item;
            }
        }
    };

    static Events = {
        EventEmitter: class {
            constructor() {
                this.events = {};
            }

            on(event, fn, context) {
                if (!this.events[event]) {
                    this.events[event] = [];
                }
                this.events[event].push({ fn, context });
                return this;
            }

            once(event, fn, context) {
                const wrapper = (...args) => {
                    fn.apply(context, args);
                    this.off(event, wrapper);
                };
                return this.on(event, wrapper, context);
            }

            off(event, fn) {
                if (!this.events[event]) return this;
                if (!fn) {
                    delete this.events[event];
                } else {
                    this.events[event] = this.events[event].filter(listener => listener.fn !== fn);
                }
                return this;
            }

            emit(event, ...args) {
                if (!this.events[event]) return this;
                this.events[event].forEach(listener => {
                    listener.fn.apply(listener.context, args);
                });
                return this;
            }

            removeAllListeners(event) {
                if (event) {
                    delete this.events[event];
                } else {
                    this.events = {};
                }
                return this;
            }
        }
    };

    static Physics = {
        Arcade: {
            Sprite: class {
                constructor(scene, x, y, texture) {
                    this.scene = scene;
                    this.x = x;
                    this.y = y;
                    this.texture = texture;
                    this.body = {
                        x: x,
                        y: y,
                        width: 32,
                        height: 32,
                        velocity: { x: 0, y: 0 },
                        gravity: { x: 0, y: 0 },
                        blocked: { left: false, right: false, up: false, down: false },
                        touching: { left: false, right: false, up: false, down: false },
                        setSize: jest.fn(),
                        setOffset: jest.fn(),
                        setBounce: jest.fn(),
                        setCollideWorldBounds: jest.fn(),
                        allowGravity: true,
                        immovable: false,
                        updateFromGameObject: jest.fn(),
                        reset: jest.fn()
                    };
                    this.active = true;
                    this.visible = true;
                    this.depth = 0;
                    this.scaleX = 1;
                    this.scaleY = 1;
                    this.angle = 0;
                    this.tint = 0xffffff;
                }
                setGravityY(val) { this.body.gravity.y = val; return this; }
                setMaxVelocity() { return this; }
                setDragX() { return this; }
                setCollideWorldBounds() { return this; }
                setDepth(d) { this.depth = d; return this; }
                setAccelerationX() { return this; }
                setVelocity(x, y) { this.body.velocity.x = x; this.body.velocity.y = y; return this; }
                setVelocityX(x) { this.body.velocity.x = x; return this; }
                setVelocityY(y) { this.body.velocity.y = y; return this; }
                setTint(color) { this.tint = color; return this; }
                clearTint() { this.tint = 0xffffff; return this; }
                setOrigin() { return this; }
                setDisplaySize() { return this; }
                refreshBody() { return this; }
                setData(k, v) { this[k] = v; return this; }
                getData(k) { return this[k]; }
                destroy() { this.active = false; }
                setActive(v) { this.active = v; return this; }
                setVisible(v) { this.visible = v; return this; }
                setScrollFactor() { return this; }
                setInteractive() { return this; }
                on() { return this; }
                setScale() { return this; }
                setAlpha() { return this; }
                setText() { return this; }
                setFrame() { return this; }
                setColor() { return this; }
                setFillStyle() { return this; }
                setStrokeStyle() { return this; }
                setFlipX(v) { this.flipX = v; return this; }
                preUpdate(time, delta) { }
            }
        }
    };

    static Scene = class {
        constructor(key) {
            this.key = key;
            this.sys = {
                game: {
                    device: {
                        os: { android: false, iOS: false, desktop: true }
                    }
                }
            };
            this.cameras = {
                main: {
                    width: 400,
                    height: 600,
                    centerX: 200,
                    centerY: 300,
                    scrollY: 0,
                    scrollX: 0,
                    startFollow: jest.fn(),
                    setBackgroundColor: jest.fn(),
                    flash: jest.fn()
                }
            };
            this.physics = {
                world: {
                    setBounds: jest.fn(),
                    gravity: { y: 0 }
                },
                add: {
                    group: jest.fn(() => ({
                        create: jest.fn(() => new PhaserMock.Physics.Arcade.Sprite(this, 0, 0, 'test')),
                        children: { iterate: jest.fn() },
                        get: jest.fn(() => new PhaserMock.Physics.Arcade.Sprite(this, 0, 0, 'test')),
                        countActive: jest.fn(() => 0)
                    })),
                    staticGroup: jest.fn(() => ({
                        create: jest.fn(() => new PhaserMock.Physics.Arcade.Sprite(this, 0, 0, 'test')),
                        children: { iterate: jest.fn() }
                    })),
                    existing: jest.fn(),
                    collider: jest.fn(),
                    overlap: jest.fn(),
                    pause: jest.fn(),
                    resume: jest.fn()
                }
            };
            this.add = {
                existing: jest.fn(),
                image: jest.fn(() => new PhaserMock.Physics.Arcade.Sprite(this, 0, 0, 'image')),
                text: jest.fn(() => ({
                    setOrigin: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setVisible: jest.fn().mockReturnThis(),
                    setText: jest.fn().mockReturnThis(),
                    setInteractive: jest.fn().mockReturnThis(),
                    on: jest.fn().mockReturnThis(),
                    setColor: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })),
                rectangle: jest.fn(() => ({
                    setOrigin: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setVisible: jest.fn().mockReturnThis(),
                    setInteractive: jest.fn().mockReturnThis(),
                    on: jest.fn().mockReturnThis(),
                    setFillStyle: jest.fn().mockReturnThis(),
                    setStrokeStyle: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })),
                circle: jest.fn(() => ({
                    setScrollFactor: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setVisible: jest.fn().mockReturnThis(),
                    setInteractive: jest.fn().mockReturnThis(),
                    on: jest.fn().mockReturnThis(),
                    setFillStyle: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })),
                tileSprite: jest.fn(() => ({
                    setOrigin: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    destroy: jest.fn(),
                    body: { updateFromGameObject: jest.fn() }
                })),
                graphics: jest.fn(() => ({
                    lineStyle: jest.fn(),
                    beginPath: jest.fn(),
                    moveTo: jest.fn(),
                    lineTo: jest.fn(),
                    strokePath: jest.fn(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    clear: jest.fn(),
                    destroy: jest.fn()
                })),
                particles: jest.fn(() => ({
                    createEmitter: jest.fn(() => ({
                        start: jest.fn(),
                        stop: jest.fn(),
                        setPosition: jest.fn(),
                        explode: jest.fn()
                    }))
                }))
            };
            this.input = {
                addPointer: jest.fn(),
                keyboard: {
                    createCursorKeys: jest.fn(() => ({
                        left: { isDown: false },
                        right: { isDown: false },
                        up: { isDown: false },
                        down: { isDown: false },
                        space: { isDown: false }
                    })),
                    addKey: jest.fn(() => ({ isDown: false }))
                },
                on: jest.fn()
            };
            this.time = {
                delayedCall: jest.fn(),
                addEvent: jest.fn(() => ({ remove: jest.fn() })),
                now: 0
            };
            this.events = {
                once: jest.fn(),
                on: jest.fn(),
                emit: jest.fn()
            };
            this.registry = {
                get: jest.fn(),
                set: jest.fn()
            };
            this.tweens = {
                add: jest.fn(),
                killTweensOf: jest.fn(),
                pauseAll: jest.fn(),
                resumeAll: jest.fn()
            };
            this.scene = {
                start: jest.fn(),
                restart: jest.fn(),
                stop: jest.fn()
            };
            this.sound = {
                add: jest.fn(() => ({ play: jest.fn(), stop: jest.fn() }))
            };
            this.textures = {
                exists: jest.fn(() => true)
            };
        }
    };
}

global.Phaser = PhaserMock;
global.PhaserMock = PhaserMock;

export default PhaserMock;
