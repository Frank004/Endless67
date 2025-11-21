export default class LavaPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game: game,
            name: 'LavaPipeline',
            fragShader: `
                precision mediump float;
                uniform sampler2D uMainSampler;
                uniform float uTime;
                varying vec2 outTexCoord;
                void main() {
                    vec2 uv = outTexCoord;
                    // Wave effect: distort X based on Y and Time, and Y based on X and Time
                    // This creates a "heat haze" or liquid wobble effect
                    float waveX = sin(uv.y * 20.0 + uTime * 2.0) * 0.005;
                    float waveY = cos(uv.x * 20.0 + uTime * 3.0) * 0.005;
                    
                    vec2 distortedUV = uv + vec2(waveX, waveY);
                    gl_FragColor = texture2D(uMainSampler, distortedUV);
                }
            `
        });
    }

    onPreRender() {
        this.set1f('uTime', this.game.loop.time / 1000);
    }
}
