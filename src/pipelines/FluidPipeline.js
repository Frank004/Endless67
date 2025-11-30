export default class FluidPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game: game,
            name: 'FluidPipeline',
            fragShader: `
                precision mediump float;
                uniform sampler2D uMainSampler;
                uniform float uTime;
                uniform vec2 uResolution;
                uniform vec2 uGameSize;
                varying vec2 outTexCoord;
                
                void main() {
                    vec2 uv = outTexCoord;
                    
                    // Wave effect: distort X based on Y and Time, and Y based on X and Time
                    float waveX = sin(uv.y * 20.0 + uTime * 2.0) * 0.005;
                    float waveY = cos(uv.x * 20.0 + uTime * 3.0) * 0.005;
                    
                    vec2 distortedUV = uv + vec2(waveX, waveY);
                    
                    gl_FragColor = texture2D(uMainSampler, distortedUV);
                }
            `
        });
    }

    onPreRender() {
        const renderer = this.game.renderer;
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;

        this.set1f('uTime', this.game.loop.time / 1000);
        this.set2f('uResolution', renderer.width, renderer.height);
        this.set2f('uGameSize', gameWidth, gameHeight);
    }
}
