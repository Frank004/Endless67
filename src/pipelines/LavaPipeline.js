export default class LavaPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game: game,
            name: 'LavaPipeline',
            fragShader: `
                precision mediump float;
                uniform sampler2D uMainSampler;
                uniform float uTime;
                uniform vec2 uResolution;
                uniform float uPixelSize;
                varying vec2 outTexCoord;
                
                void main() {
                    vec2 uv = outTexCoord;
                    
                    // Pixelation procedural: redondear UV a cuadrícula de 16x16 (o configurable)
                    // uPixelSize controla el tamaño de los "píxeles" (16.0 = 16x16, 8.0 = 8x8, etc.)
                    vec2 pixelSize = vec2(uPixelSize / uResolution.x, uPixelSize / uResolution.y);
                    vec2 pixelatedUV = floor(uv / pixelSize) * pixelSize;
                    
                    // Wave effect: distort X based on Y and Time, and Y based on X and Time
                    // Aplicar el efecto de olas al UV pixelado para mantener la animación
                    // Esto crea un efecto de "heat haze" o liquid wobble en la lava pixelada
                    float waveX = sin(pixelatedUV.y * 20.0 + uTime * 2.0) * 0.005;
                    float waveY = cos(pixelatedUV.x * 20.0 + uTime * 3.0) * 0.005;
                    
                    vec2 distortedUV = pixelatedUV + vec2(waveX, waveY);
                    
                    // Muestrear la textura con ambos efectos combinados
                    gl_FragColor = texture2D(uMainSampler, distortedUV);
                }
            `
        });
        
        // Tamaño de pixelación (16x16 para estilo pixel art)
        this.pixelSize = 8.0;
    }

    onPreRender() {
        const renderer = this.game.renderer;
        this.set1f('uTime', this.game.loop.time / 1000);
        this.set2f('uResolution', renderer.width, renderer.height);
        this.set1f('uPixelSize', this.pixelSize);
    }
    
    /**
     * Set the pixelation size
     * @param {number} size - Size of pixels (16.0 = 16x16, 8.0 = 8x8, etc.)
     */
    setPixelSize(size) {
        this.pixelSize = size;
    }
}
