
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
                D: 68,
                SHIFT: 16,
                ENTER: 13,
                ESC: 27
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

    static Geom = {
        Rectangle: class {
            constructor(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; }
            contains(x, y) { return true; }
        },
        Circle: class {
            constructor(x, y, r) { this.x = x; this.y = y; this.radius = r; }
            setPosition(x, y) { this.x = x; this.y = y; return this; }
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

    static BlendModes = {
        ADD: 'ADD',
        SCREEN: 'SCREEN',
        MULTIPLY: 'MULTIPLY',
        NORMAL: 'NORMAL'
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

    // Base GameObject class with common methods
    static GameObject = class {
        constructor(scene, x, y) {
            this.scene = scene;
            this.x = x || 0;
            this.y = y || 0;
            this.active = true;
            this.visible = true;
            this.depth = 0;
            this.alpha = 1;
            this.scaleX = 1;
            this.scaleY = 1;
            this.angle = 0;
            this.width = 0;
            this.height = 0;
            this.tint = 0xffffff;
            this.data = {
                values: {},
                get: (key) => this.data.values[key],
                set: (key, value) => { this.data.values[key] = value; },
                query: () => { }
            };
        }

        setActive(value) { this.active = value; return this; }
        setVisible(value) { this.visible = value; return this; }
        setDepth(value) { this.depth = value; return this; }
        setAlpha(value) { this.alpha = value; return this; }
        setPosition(x, y) { this.x = x; this.y = y; return this; }
        setAngle(value) { this.angle = value; return this; }
        setScale(x, y) { this.scaleX = x; this.scaleY = y || x; return this; }
        setOrigin(x, y) { return this; }
        setScrollFactor(x, y) { return this; }
        setInteractive() { return this; }
        setSize(w, h) { this.width = w; this.height = h; return this; }
        setTint(color) { this.tint = color; return this; }
        clearTint() { this.tint = 0xffffff; return this; }
        setFlipX(value) { this.flipX = value; return this; }

        getData(key) { return this.data.values[key]; }
        setData(key, value) { this.data.values[key] = value; return this; }

        on(event, fn, context) { return this; }
        once(event, fn, context) { return this; }
        off(event, fn, context) { return this; }
        emit(event, ...args) { return this; }

        emit(event, ...args) { return this; }
        setBlendMode(mode) { return this; }

        preUpdate(time, delta) { } // Added for robust inheritance mocking

        destroy() { this.active = false; }
    };

    static GameObjects = {
        Container: class extends PhaserMock.GameObject {
            constructor(scene, x, y) {
                super(scene, x, y);
                this.list = [];
            }
            add(child) { this.list.push(child); return this; }
            remove(child) {
                const idx = this.list.indexOf(child);
                if (idx !== -1) this.list.splice(idx, 1);
                return this;
            }
        },
        Sprite: class extends PhaserMock.GameObject {
            constructor(scene, x, y, texture, frame) {
                super(scene, x, y);
                this.texture = { key: texture };
                this.frame = { name: frame };
            }
            setTexture(key, frame) { this.texture.key = key; this.frame.name = frame; return this; }
            play(key) { return this; }
            stop() { return this; }
        },
        TileSprite: class extends PhaserMock.GameObject {
            constructor(scene, x, y, width, height, texture, frame) {
                super(scene, x, y);
                this.width = width;
                this.height = height;
                this.texture = { key: texture };
                this.frame = { name: frame };
                this.tilePositionX = 0;
                this.tilePositionY = 0;
            }
            setTexture(key, frame) { this.texture.key = key; this.frame.name = frame; return this; }
            setTilePosition(x, y) { this.tilePositionX = x; this.tilePositionY = y; return this; }
        },
        Image: class extends PhaserMock.GameObject {
            constructor(scene, x, y, texture) {
                super(scene, x, y);
                this.texture = { key: texture };
            }
        },
        Graphics: class extends PhaserMock.GameObject {
            constructor(scene) { super(scene); }
            lineStyle() { return this; }
            fillStyle() { return this; }
            beginPath() { return this; }
            moveTo() { return this; }
            lineTo() { return this; }
            strokePath() { return this; }
            strokeRect() { return this; }
            fillRoundedRect() { return this; }
            strokeRoundedRect() { return this; }
            fillRect() { return this; }
            fillCircle() { return this; }
            clear() { return this; }
            generateTexture() { return this; }
        }
    };

    static Physics = {
        Arcade: {
            Sprite: class extends PhaserMock.GameObjects.Sprite {
                constructor(scene, x, y, texture, frame) {
                    super(scene, x, y, texture, frame);
                    this.body = {
                        x: x,
                        y: y,
                        width: 32,
                        height: 32,
                        velocity: { x: 0, y: 0 },
                        gravity: { x: 0, y: 0 },
                        blocked: { left: false, right: false, up: false, down: false },
                        touching: { left: false, right: false, up: false, down: false, none: true },
                        checkCollision: { none: false },
                        setSize: jest.fn(),
                        setOffset: jest.fn(),
                        setBounce: jest.fn(),
                        setCollideWorldBounds: jest.fn(),
                        setMaxVelocity: jest.fn(),
                        setDragX: jest.fn(),
                        allowGravity: true,
                        immovable: false,
                        moves: true,
                        updateFromGameObject: jest.fn(),
                        reset: jest.fn()
                    };
                }
                setVelocity(x, y) { this.body.velocity.x = x; this.body.velocity.y = y; return this; }
                setVelocityX(x) { this.body.velocity.x = x; return this; }
                setVelocityY(y) { this.body.velocity.y = y; return this; }
                setAccelerationX() { return this; }
                setAccelerationY() { return this; }
                setDragX() { return this; }
                setMaxVelocity() { return this; }
                setGravityY(val) { this.body.gravity.y = val; return this; }
                setImmovable(val) { this.body.immovable = val; return this; }
                refreshBody() { return this; }
            },
            Image: class extends PhaserMock.GameObjects.Image {
                constructor(scene, x, y, texture) {
                    super(scene, x, y, texture);
                    this.body = {
                        velocity: { x: 0, y: 0 },
                        updateFromGameObject: jest.fn()
                    }
                }
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
                    },
                    config: {
                        width: 400,
                        height: 600
                    }
                },
                updateList: { add: jest.fn(), remove: jest.fn() },
                displayList: { add: jest.fn(), remove: jest.fn() }
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
                        children: { iterate: jest.fn(), entries: [] },
                        get: jest.fn(() => new PhaserMock.Physics.Arcade.Sprite(this, 0, 0, 'test')),
                        getLast: jest.fn(() => new PhaserMock.Physics.Arcade.Sprite(this, 0, 0, 'test')),
                        countActive: jest.fn(() => 0),
                        remove: jest.fn(),
                        add: jest.fn(),
                        getLength: jest.fn(() => 0)
                    })),
                    staticGroup: jest.fn(() => ({
                        create: jest.fn(() => new PhaserMock.Physics.Arcade.Sprite(this, 0, 0, 'test')),
                        children: { iterate: jest.fn(), entries: [] }
                    })),
                    existing: jest.fn(obj => {
                        if (!obj.body) obj.body = { velocity: { x: 0, y: 0 }, updateFromGameObject: jest.fn() };
                        return obj;
                    }),
                    collider: jest.fn(),
                    overlap: jest.fn(),
                    pause: jest.fn(),
                    resume: jest.fn()
                }
            };
            this.add = {
                existing: jest.fn(),
                image: jest.fn(() => new PhaserMock.GameObjects.Image(this, 0, 0, 'image')),
                sprite: jest.fn(() => new PhaserMock.GameObjects.Sprite(this, 0, 0, 'sprite')),
                tileSprite: jest.fn(() => new PhaserMock.GameObjects.TileSprite(this, 0, 0, 32, 32, 'tile')),
                text: jest.fn(() => ({
                    setOrigin: jest.fn().mockReturnThis(),
                    setScrollFactor: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setVisible: jest.fn().mockReturnThis(),
                    setText: jest.fn().mockReturnThis(),
                    setInteractive: jest.fn().mockReturnThis(),
                    on: jest.fn().mockReturnThis(),
                    setColor: jest.fn().mockReturnThis(),
                    destroy: jest.fn(),
                    zoom: 1
                })),
                container: jest.fn(() => new PhaserMock.GameObjects.Container(this)),
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
                graphics: jest.fn(() => new PhaserMock.GameObjects.Graphics(this)),
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
                    addKey: jest.fn(() => ({ isDown: false })),
                    on: jest.fn(),
                    off: jest.fn()
                },
                on: jest.fn(),
                manager: {
                    pointers: []
                },
                gamepad: {
                    enabled: true,
                    total: 0,
                    start: jest.fn(),
                    on: jest.fn(),
                    gamepads: []
                }
            };
            this.time = {
                delayedCall: jest.fn(() => ({ remove: jest.fn() })),
                addEvent: jest.fn(() => ({ remove: jest.fn(), paused: false })),
                now: 0
            };
            this.events = new PhaserMock.Events.EventEmitter();
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
                stop: jest.fn(),
                key: key,
                get: jest.fn()
            };
            this.sound = {
                add: jest.fn(() => ({ play: jest.fn(), stop: jest.fn() }))
            };
            this.textures = {
                exists: jest.fn(() => true),
                get: jest.fn(() => ({ has: jest.fn(() => true), get: jest.fn() }))
            };
            this.anims = {
                exists: jest.fn(),
                create: jest.fn(),
                play: jest.fn(),
                isPlaying: false
            };
        }
    };
}

global.Phaser = PhaserMock;
global.PhaserMock = PhaserMock;

export default PhaserMock;
