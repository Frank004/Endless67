export default class FlamesPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game: game,
            name: 'FlamesPipeline',
            fragShader: `
                precision mediump float;
                uniform sampler2D uMainSampler;
                uniform sampler2D uNoiseSampler; // We will pass noise texture here
                uniform float uTime;
                uniform vec2 uResolution;
                varying vec2 outTexCoord;

                // Color palette
                const vec3 COLOR_DARK = vec3(0.5, 0.0, 0.0);
                const vec3 COLOR_BASE = vec3(1.0, 0.2, 0.0);
                const vec3 COLOR_MID  = vec3(1.0, 0.6, 0.0);
                const vec3 COLOR_HOT  = vec3(1.0, 1.0, 0.8);

                void main() {
                    vec2 uv = outTexCoord;
                    
                    // Aspect correction implies we want noise to not stretch if aspect is weird, 
                    // but for a full screen effect, direct mapping is okay.
                    // Let's create two noise layers scrolling upwards at different speeds
                    
                    float time = uTime * 0.5;
                    
                    // Sample noise texture (uNoiseSampler must be set to repeated wrapping in JS)
                    // Layer 1: Slow, large
                    vec2 noiseUV1 = uv + vec2(0.0, time * 0.5);
                    float n1 = texture2D(uNoiseSampler, noiseUV1 * 0.5).r;
                    
                    // Layer 2: Fast, small
                    vec2 noiseUV2 = uv + vec2(time * 0.1, time * 0.8); // slight x drift
                    float n2 = texture2D(uNoiseSampler, noiseUV2 * 1.5).r;
                    
                    // Combine noise
                    float noise = (n1 + n2) * 0.5;
                    
                    // Distort UVs for the main shape
                    // This gives the "waviness"
                    vec2 distortedUV = uv;
                    distortedUV.x += (noise - 0.5) * 0.1;
                    distortedUV.y += (noise - 0.5) * 0.1;
                    
                    // Generate Fire Gradient
                    // We want the fire to be hotter (brighter) near the bottom? 
                    // Or actually, for a Riser that fills the screen from bottom, the top edge is the flame tip.
                    // The texture coordinates (uv.y) go from 0 (top) to 1 (bottom).
                    // So uv.y = 0 should be the tips, uv.y = 1 deep in fire.
                    
                    // Use noise to carve out the top edge
                    // gradient goes from 0 (transparent) to 1 (solid)
                    float gradient = uv.y; 
                    
                    // Make edge chaotic
                    float edge = gradient + (noise - 0.5) * 0.4;
                    
                    // Threshold for alpha/shape
                    // We want sharpish edges for stylized look or smooth for realistic
                    float shape = smoothstep(0.1, 0.4, edge);
                    
                    // Color Mapping based on "heat" (which correlates to edge/depth)
                    // Deeper (higher edge value) -> Hotter? Usually tips are darker or cooler, core is hot.
                    // Let's map: 
                    // 0.0 - 0.3: Transparent/tips
                    // 0.3 - 0.5: Dark Red
                    // 0.5 - 0.7: Orange
                    // 0.7 - 1.0: Yellow/White
                    
                    vec3 finalColor = COLOR_DARK;
                    if (edge > 0.8) finalColor = mix(COLOR_MID, COLOR_HOT, (edge - 0.8) * 5.0);
                    else if (edge > 0.5) finalColor = mix(COLOR_BASE, COLOR_MID, (edge - 0.5) * 3.33);
                    else finalColor = mix(COLOR_DARK, COLOR_BASE, (edge - 0.2) * 3.33);
                    
                    // Sample the underlying texture just to preserve original alpha if needed, 
                    // but we are generating the fire completely here.
                    // actually, Riser is a TileSprite. If we just output generated color, we ignore the underlying sprite.
                    // That's fine if we want a pure shader effect.
                    
                    // Optional: Mix with underlying texture brightness
                    vec4 mainTex = texture2D(uMainSampler, uv);
                    
                    // Soft edges
                    float alpha = smoothstep(0.05, 0.2, edge);
                    
                    gl_FragColor = vec4(finalColor, alpha * mainTex.a);
                }
            `
        });
    }

    onPreRender() {
        const renderer = this.game.renderer;
        this.set1f('uTime', this.game.loop.time / 1000);
        this.set2f('uResolution', renderer.width, renderer.height);

        // Bind the noise texture to texture unit 1
        if (this.game.textures.exists('noise')) {
            const noiseTexture = this.game.textures.get('noise').getSourceImage();

            // Critical: We need to bind this texture to a specific unit and tell the shader
            // For PostFX pipelines, Phaser handles uMainSampler (unit 0).
            // We need to manually bind unit 1.

            renderer.pipelines.setMultiTexture(this.game.textures.get('noise').glTexture, 1);
            this.set1i('uNoiseSampler', 1);
        }
    }
}
