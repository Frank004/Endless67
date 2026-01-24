import { LAYOUT_CONFIG } from '../Config/LayoutConfig.js';
import { ASSETS } from '../Config/AssetKeys.js';
import { WALLS } from '../Config/GameConstants.js';
import { getLightEmitterConfig } from '../Config/LightEmitterConfig.js';
import { LightEmitterComponent } from '../Systems/Visuals/Decorations/LightEmitterComponent.js';
import { LightBugInteractable } from '../Systems/Gameplay/Interactables/LightBugInteractable.js';

/**
 * StageFloor
 * 
 * El piso inicial del juego. Estático y visible al inicio.
 * Ubicado encima del ad banner.
 */
export class StageFloor extends Phaser.GameObjects.TileSprite {
    constructor(scene, screenHeight) {
        const config = LAYOUT_CONFIG.stageFloor;
        // Ad banner está arriba, así que el floor va al fondo sin restar adHeight
        const effectiveHeight = screenHeight;

        const x = scene.scale.width / 2;
        const floorHeight = config.height; // 32
        const y = effectiveHeight - (floorHeight / 2);
        const width = scene.scale.width;

        // Choose a random frame
        const frames = ['stagefloor-01.png', 'stagefloor-02.png', 'stagefloor-03.png'];
        let randomFrame = Phaser.Utils.Array.GetRandom(frames);

        // Fallback: if floor atlas not ready or frame missing, generate a placeholder texture
        let textureKey = ASSETS.FLOOR;
        if (!scene.textures.exists(ASSETS.FLOOR) || !scene.textures.get(ASSETS.FLOOR).has(randomFrame)) {
            const key = 'floor_placeholder';
            if (!scene.textures.exists(key)) {
                const g = scene.make.graphics({ x: 0, y: 0 });
                g.fillStyle(0x444444, 1);
                g.fillRect(0, 0, 32, 32);
                g.lineStyle(2, 0x666666, 1);
                g.strokeRect(0, 0, 32, 32);
                g.generateTexture(key, 32, 32);
                g.destroy();
            }
            textureKey = key;
            randomFrame = undefined;
        }

        super(scene, x, y, width, floorHeight, textureKey, randomFrame);

        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        this.setDepth(30); // Foreground: 30 (Above Player 20, Below Cables 40)

        this.addStreetlight(scene);
    }

    addStreetlight(scene) {
        if (!scene.textures.exists(ASSETS.PROPS)) return;

        const frames = ['streetlight.png', 'streetlight-damage.png'];
        const frame = Phaser.Utils.Array.GetRandom(frames);

        const container = scene.add.container(0, 0);
        const prop = scene.add.image(0, 0, ASSETS.PROPS, frame);
        prop.setOrigin(0.5, 1); // Anchor Bottom-Center
        container.add(prop);

        // Floor Top Y
        const floorTop = this.y - (this.height / 2);
        container.y = floorTop + 6; // Embed slightly (6px) for solid look

        // Side Logic
        // Default Sprite assumed to look Good on Right Wall (Facing Left?)
        // User requested Mirror on Left.
        const isLeft = Math.random() > 0.5;
        const wallWidth = WALLS.WIDTH || 32;
        const offset = 24; // Offset into gameplay ("un poco de offset para dentro")

        if (isLeft) {
            prop.setFlipX(true); // Mirror for Left
            // Position: Wall Edge + Offset
            container.x = wallWidth + offset;
        } else {
            prop.setFlipX(false);
            // Position: Screen Right - Wall Edge - Offset
            container.x = scene.scale.width - wallWidth - offset;
        }

        container.setDepth(5); // Background (Behind Player)

        const offsetX = (-prop.displayWidth / 2) + 6;
        const offsetY = (-prop.displayHeight) + 8;
        const emitterOffsetX = isLeft ? -offsetX : offsetX;
        const lightEmitterConfig = getLightEmitterConfig('streetlightSmall', {
            emitter: {
                offset: { x: emitterOffsetX, y: offsetY },
                mirrorX: false
            }
        });
        const lightEmitter = new LightEmitterComponent(scene, lightEmitterConfig);
        lightEmitter.create(container, 'left', { x: 0, y: 0 });
        container.bringToTop(prop);

        // Register streetlight as interactable for bug particle behavior
        if (scene.interactableManager) {
            // Crear objeto wrapper similar a LampDecoration para compatibilidad
            const streetlightWrapper = {
                lightEmitter: lightEmitter,
                container: container,
                visualObject: container,
                x: container.x,
                y: container.y
            };

            const streetlightId = `streetlight_${container.x}_${container.y}_${Date.now()}`;
            const lightBugInteractable = new LightBugInteractable(scene, streetlightWrapper);
            scene.interactableManager.register(streetlightId, lightBugInteractable);
            streetlightWrapper.interactableId = streetlightId;
        }
    }
}
