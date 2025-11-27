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
                uniform vec2 uGameSize;
                uniform float uPixelSize;
                varying vec2 outTexCoord;
                
                void main() {
                    vec2 uv = outTexCoord;
                    
                    // Pixelation procedural: 32x32px en el espacio del juego (igual que el personaje)
                    // uPixelSize = 32.0 (tamaño en píxeles del juego)
                    // uGameSize = tamaño del juego (width, height)
                    // Calculamos el tamaño de pixel en coordenadas UV basado en el tamaño del juego
                    vec2 pixelSize = vec2(uPixelSize / uGameSize.x, uPixelSize / uGameSize.y);
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
        
        // Tamaño de pixelación: 32x32px en el espacio del juego (igual que el personaje)
        this.pixelSize = 32.0;
    }

    onPreRender() {
        const renderer = this.game.renderer;
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        
        this.set1f('uTime', this.game.loop.time / 1000);
        this.set2f('uResolution', renderer.width, renderer.height);
        this.set2f('uGameSize', gameWidth, gameHeight); // Tamaño del juego en píxeles
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
