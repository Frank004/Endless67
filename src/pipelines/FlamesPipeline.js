export default class FlamesPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game: game,
            name: 'FlamesPipeline',
            fragShader: `
                precision mediump float;
                uniform sampler2D uMainSampler;
                uniform float uTime;
                uniform vec2 uResolution;
                varying vec2 outTexCoord;
                
                // Noise function for flame turbulence
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                void main() {
                    vec2 uv = outTexCoord;
                    
                    // Vertical flame movement (upward)
                    float flameSpeed = uTime * 2.0;
                    
                    // Create flame shape - pointed at top, wider at bottom
                    float flameShape = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
                    
                    // Turbulent distortion for flame effect
                    float turbulence1 = noise(vec2(uv.x * 10.0, uv.y * 5.0 - flameSpeed)) * 0.02;
                    float turbulence2 = noise(vec2(uv.x * 15.0, uv.y * 8.0 - flameSpeed * 1.5)) * 0.015;
                    
                    // Vertical distortion (flames rise and flicker)
                    float verticalWave = sin(uv.x * 20.0 + flameSpeed) * 0.03 * flameShape;
                    
                    // Apply distortions
                    vec2 distortedUV = uv;
                    distortedUV.x += turbulence1 + turbulence2;
                    distortedUV.y += verticalWave;
                    
                    // Sample texture
                    vec4 color = texture2D(uMainSampler, distortedUV);
                    
                    // Add brightness variation for flame intensity
                    float intensity = 1.0 + sin(uv.y * 10.0 - flameSpeed * 3.0) * 0.15;
                    color.rgb *= intensity;
                    
                    gl_FragColor = color;
                }
            `
        });
    }

    onPreRender() {
        const renderer = this.game.renderer;

        this.set1f('uTime', this.game.loop.time / 1000);
        this.set2f('uResolution', renderer.width, renderer.height);
    }
}
