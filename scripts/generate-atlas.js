const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ICONS_DIR = path.join(__dirname, '../node_modules/remixicon/icons');
const OUTPUT_DIR = path.join(__dirname, '../assets/ui');
const OUTPUT_IMAGE = path.join(OUTPUT_DIR, 'icons.png');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'icons.json');

// Define the icons we want to include and their source paths
// We use 'fill' variants for solid icons usually
const ICONS_TO_INCLUDE = {
    'settings': 'System/settings-3-fill.svg',
    'pause': 'Media/pause-fill.svg',
    'play': 'Media/play-fill.svg',
    'volume-up': 'Media/volume-up-fill.svg',
    'volume-mute': 'Media/volume-mute-fill.svg',
    'gamepad': 'Device/gamepad-fill.svg',
    'door': 'Others/door-open-fill.svg', // Exit
    'home': 'Buildings/home-4-fill.svg', // Main Menu
    'trophy': 'Finance/trophy-fill.svg', // Leaderboard
    'restart': 'System/refresh-line.svg', // Restart
    'close': 'System/close-fill.svg',
    'check': 'System/check-fill.svg', // Confirm
    'arrow-left': 'Arrows/arrow-left-s-fill.svg',
    'arrow-right': 'Arrows/arrow-right-s-fill.svg',
    'arrow-up': 'Arrows/arrow-up-s-fill.svg', // Jump
    'clean': 'System/delete-bin-fill.svg', // Clear/Clean
    'magic': 'Design/magic-line.svg', // Prepopulate
    'alien': 'User & Faces/aliens-fill.svg', // Enemy
    'sword': 'Others/sword-fill.svg', // Shooter? Or maybe crosshair? Let's use sword for now or crosshair
    'crosshair': 'Design/crosshair-2-fill.svg', // Shooter
    'flashlight': 'Weather/flashlight-fill.svg', // Fast Shooter (Lightning/Flash)
    'shield': 'System/shield-fill.svg', // Powerup
    'money': 'Finance/money-dollar-circle-fill.svg', // Coin
    'masonry': 'Buildings/community-fill.svg', // Platforms? Or maybe 'stack-fill'?
    'stack': 'Business/stack-fill.svg', // Platforms
    'tornado': 'Weather/tornado-fill.svg', // Mazes? Or maybe 'route-fill'?
    'route': 'Map/route-fill.svg', // Mazes
    'brush': 'Design/brush-fill.svg', // Clear
    'menu': 'System/menu-fill.svg', // Hamburger menu if needed
    'jump': 'Arrows/arrow-up-circle-fill.svg', // Jump button
    'joystick-base': 'Device/gamepad-line.svg', // Fallback if needed, but we have custom joystick assets
    'joystick-knob': 'System/checkbox-blank-circle-fill.svg', // Fallback
    'single': 'Media/play-circle-line.svg', // Single spawn
    'group': 'Design/layout-grid-fill.svg' // Group spawn
};

const ICON_SIZE = 64; // High res for scaling down
const PADDING = 2;

async function generateAtlas() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const frames = [];
    const composites = [];
    let currentX = 0;
    let currentY = 0;
    let maxHeight = 0;

    // Simple row packing
    const MAX_WIDTH = 512;

    console.log('Generating atlas...');

    for (const [name, relPath] of Object.entries(ICONS_TO_INCLUDE)) {
        const fullPath = path.join(ICONS_DIR, relPath);

        if (!fs.existsSync(fullPath)) {
            console.warn(`Warning: Icon not found: ${relPath}`);
            continue;
        }

        try {
            // Read SVG content
            let svgContent = fs.readFileSync(fullPath, 'utf8');

            // Force white color by injecting fill="white" into the svg tag or path
            // Remix icons usually don't have fill attribute on svg tag, but paths might use currentColor
            // Simplest way: Add fill="#ffffff" to the <svg> tag which cascades if not overridden
            // Or replace fill="currentColor" with fill="#ffffff"

            if (svgContent.includes('fill="currentColor"')) {
                svgContent = svgContent.replace(/fill="currentColor"/g, 'fill="#ffffff"');
            } else if (!svgContent.includes('fill="')) {
                // If no fill is specified, it defaults to black. We can force it on the svg tag.
                svgContent = svgContent.replace('<svg', '<svg fill="#ffffff"');
            } else {
                // If there are other fills, try to replace them? 
                // Let's just try replacing the closing > of svg with fill="#ffffff">
                // But safer to replace <svg ...> with <svg ... fill="#ffffff">
                svgContent = svgContent.replace('<svg', '<svg fill="#ffffff"');
            }

            // Convert SVG buffer to PNG buffer with sharp
            const buffer = await sharp(Buffer.from(svgContent))
                .resize(ICON_SIZE, ICON_SIZE)
                .png()
                .toBuffer();

            // Check if we need to move to next row
            if (currentX + ICON_SIZE > MAX_WIDTH) {
                currentX = 0;
                currentY += maxHeight + PADDING;
                maxHeight = 0;
            }

            composites.push({
                input: buffer,
                left: currentX,
                top: currentY
            });

            frames.push({
                filename: name,
                frame: { x: currentX, y: currentY, w: ICON_SIZE, h: ICON_SIZE },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: 0, y: 0, w: ICON_SIZE, h: ICON_SIZE },
                sourceSize: { w: ICON_SIZE, h: ICON_SIZE },
                pivot: { x: 0.5, y: 0.5 }
            });

            currentX += ICON_SIZE + PADDING;
            maxHeight = Math.max(maxHeight, ICON_SIZE);

        } catch (err) {
            console.error(`Error processing ${name}:`, err);
        }
    }

    const finalWidth = MAX_WIDTH;
    const finalHeight = currentY + maxHeight + PADDING;

    // Create the atlas image
    await sharp({
        create: {
            width: finalWidth,
            height: finalHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
        .composite(composites)
        .toFile(OUTPUT_IMAGE);

    // Create the JSON
    const atlasJSON = {
        frames: frames.reduce((acc, frame) => {
            acc[frame.filename] = {
                frame: frame.frame,
                rotated: frame.rotated,
                trimmed: frame.trimmed,
                spriteSourceSize: frame.spriteSourceSize,
                sourceSize: frame.sourceSize,
                pivot: frame.pivot
            };
            return acc;
        }, {}),
        meta: {
            app: "http://www.phaser.io",
            version: "1.0",
            image: "icons.png",
            format: "RGBA8888",
            size: { w: finalWidth, h: finalHeight },
            scale: "1"
        }
    };

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(atlasJSON, null, 2));

    console.log(`Atlas generated at ${OUTPUT_IMAGE}`);
    console.log(`JSON generated at ${OUTPUT_JSON}`);
}

generateAtlas();
