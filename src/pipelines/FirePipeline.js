import { ASSETS } from "../config/AssetKeys.js";

export class FirePipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game) {
    super({
      game,
      renderer: game.renderer,
      vertShader: `precision mediump float;
attribute vec2 inPosition;
attribute vec2 inTexCoord;
uniform mat4 uProjectionMatrix;
varying vec2 vTexCoord;
void main() {
  vTexCoord = inTexCoord;
  gl_Position = uProjectionMatrix * vec4(inPosition, 0.0, 1.0);
}`,

      fragShader: `precision mediump float;
varying vec2 vTexCoord;

uniform float uTime;
uniform vec2  uResolution;

uniform vec2  uTilingVoronoi;
uniform vec2  uTilingNoise;
uniform vec2  uOffsetVoronoi;
uniform vec2  uOffsetNoise;
uniform float uScaleVoronoi;
uniform float uScaleNoise;

uniform float uFill;

// Tongue Uniforms
uniform float uEdgeWidth;
uniform float uTongueFreq;
uniform float uTongueWarpAmp;
uniform float uTongueDensity;
uniform float uTongueSharpness;
uniform float uTongueStrength;
uniform float uTongueSpeed;
uniform float uTongueGlow;

uniform vec3 innerColor;
uniform vec3 outerColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
vec2 hash22(vec2 p) {
  float n = hash21(p);
  return vec2(n, hash21(p + n));
}
float gradNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float voronoi(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float md = 10.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = hash22(i + g);
      vec2 r = g + o - f;
      float d = dot(r, r);
      md = min(md, d);
    }
  }
  return sqrt(md);
}
float saturate(float x) { return clamp(x, 0.0, 1.0); }

void main() {
  vec2 uv = vTexCoord;

  // --- Flame Tongues Logic ---
  float yFromBottom = 1.0 - uv.y;
  float topEdge = yFromBottom - uFill;
  
  // Mask only the edge
  float edgeBand = 1.0 - smoothstep(0.0, uEdgeWidth, abs(topEdge));

  // Domain Warping
  float noiseWarp = gradNoise(uv * uTongueFreq + vec2(0.0, uTime * uTongueSpeed));
  float warp = (noiseWarp - 0.5) * uTongueWarpAmp;
  
  // Apply warp mostly to X, some to Y
  vec2 uvWarped = uv + vec2(warp, warp * 0.35);

  // Spikes (vertical 1D noise along X)
  // approximating noise1D with gradNoise 2D
  float spikes = gradNoise(vec2(uvWarped.x * uTongueDensity, uTime * uTongueSpeed));
  float tongues = pow(saturate(spikes), uTongueSharpness);
  
  // Apply only at edge
  float tonguesMask = edgeBand * tongues * uTongueStrength;
  
  // --- Standard Fire Pattern ---
  vec2 uvV = (uv * uTilingVoronoi + uOffsetVoronoi) * uScaleVoronoi;
  vec2 uvN = (uv * uTilingNoise   + uOffsetNoise)   * uScaleNoise;

  float v = voronoi(uvV);
  float n = gradNoise(uvN);

  float bw = (1.0 - v) * (1.0 - n);
  bw = saturate(bw);

  // Base gradients
  float baseGrad = smoothstep(0.0, 0.8, yFromBottom); 
  // Fill mask (fade above fill level)
  // Fix: 1.0 - smoothstep to correctly fade out ABOVE the fill level
  float fillMask = 1.0 - smoothstep(uFill - 0.05, uFill, yFromBottom);

  // Combine
  float intensity = saturate(bw * baseGrad * fillMask);
  
  // Add tongues to intensity
  float intensityFinal = saturate(intensity + tonguesMask);

  // Color
  vec3 fireCol = mix(outerColor, innerColor, intensityFinal);
  
  // Boost inner color on tongues
  fireCol += innerColor * tonguesMask * uTongueGlow;

  // Alpha (additive-like)
  float outA = intensityFinal; 
  
  gl_FragColor = vec4(fireCol, outA);
}`,
    });
    // Defaults
  }
}
