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

                    // --- PIXELATION ---
                    float pixelSize = 6.0; // Large pixels
                    vec2 pixelUV = floor(uv * uResolution / pixelSize) * pixelSize / uResolution;

                    float time = uTime * 0.5;
                    
                    // Layer 1: Slow, large
                    vec2 noiseUV1 = pixelUV + vec2(0.0, time * 0.5);
                    float n1 = texture2D(uNoiseSampler, noiseUV1 * 0.5).r;
                    
                    // Layer 2: Fast, small
                    vec2 noiseUV2 = pixelUV + vec2(time * 0.1, time * 0.8); // slight x drift
                    float n2 = texture2D(uNoiseSampler, noiseUV2 * 1.5).r;
                    
                    // Combine noise
                    float noise = (n1 + n2) * 0.5;
                    
                    // Distort UVs using Quantized UVs
                    vec2 distortedUV = pixelUV;
                    distortedUV.x += (noise - 0.5) * 0.1;
                    distortedUV.y += (noise - 0.5) * 0.1;
                    
                    float gradient = pixelUV.y; 
                    
                    // Make edge chaotic
                    float edge = gradient + (noise - 0.5) * 0.4;
                    
                    // --- COLOR BANDING (Retro Palette) ---
                    // Hard switches instead of smooth mixes
                    vec3 finalColor = COLOR_DARK;
                    
                    if (edge > 0.75) finalColor = COLOR_HOT;
                    else if (edge > 0.55) finalColor = COLOR_MID;
                    else if (edge > 0.35) finalColor = COLOR_BASE;
                    else finalColor = COLOR_DARK;
                    
                    // Use Hard Step for Alpha (No antialiasing)
                    float alpha = step(0.15, edge);
                    
                    gl_FragColor = vec4(finalColor, alpha);
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
