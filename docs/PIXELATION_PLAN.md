# IMPLEMENTATION PLAN: Retro Pixelation & Atmosphere

## Goal
To achieve a cohesive "Retro/Pixelated" aesthetic for the atmospheric effects (Fog, Smoke) and the Riser elements (Lava, Water), making them look like 8-bit/16-bit FX rather than high-res smooth shaders.

## 1. Pixelated Fog (Atmosphere)
**Objective:** Replace smooth gradients with a living, breathing pixelated smoke effect.

**Implementation:**
*   **File:** `src/managers/background/BackgroundManager.js`
*   **Method:** `createCenterDarken` (and potentially `createSideShadows`).
*   **Changes:**
    1.  Instead of drawing a high-res radial gradient, we will create a **Low-Resolution Noise Texture** dynamically (or reuse 'noise' if available).
    2.  **Technique A (Dynamic TileSprite):**
        *   Add a `TileSprite` covering the screen.
        *   Texture: A custom canvas texture of size `64x64` filled with random grayscale noise.
        *   **Scale:** Scale this sprite UP by `10x` (or fit to screen) using `NEAREST` filtering. This creates giant visible "blocks".
        *   **Animation:** Scroll the `tilePosition` slowly in both X and Y.
        *   **Blend:** Use `MULTIPLY` or `DARKEN`.
        *   **Vignette Effect:** Apply a static low-res mask (Canvas circular gradient drawn at small size, scaled up) to multiply the alpha, keeping the center clear.
    
    *   **Technique B (Simpler - "Pixelated Gradient"):**
        *   Keep the current logic but reduce the canvas size to `width/10, height/10`.
        *   Draw the Radial Gradient.
        *   Set `canvas.style.imageRendering = 'pixelated'` (not needed for Phaser texture, need `setFilter`).
        *   When adding the image to scene: `image.setScale(10)`.
        *   Set texture filter: `this.scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST)`.
        *   Add a secondary "Noise" layer on top using the existing 'noise' asset, also scaled up, scrolling slowly, with low alpha (0.1).

**Decision:** **Technique B + Noise Layer**. It preserves the "Dark Center/Edges" gameplay clarity while adding the "Pixel Smoke" texture.

## 2. Pixelated Risers (Shaders)
**Objective:** Quantize the shader calculations to simulate a low resolution grid.

### A. FlamesPipeline (Lava)
*   **File:** `src/pipelines/FlamesPipeline.js`
*   **Changes:**
    *   Inject a "Pixelate" step at start of `main()`.
    *   Define `float pixelSize = 4.0;` (Virtual pixels).
    *   `vec2 pixelUV = floor(uv * uResolution / pixelSize) * pixelSize / uResolution;`
    *   Use `pixelUV` for all Noise and Gradient calculations.
    *   **Color Quantization:** Instead of smooth `mix`, use steps.
        *   `if (edge > 0.8) color = A; else if (edge > 0.6) color = B; ...`
        *   This creates "bands" of color instead of smooth fade.

### B. FluidPipeline (Water)
*   **File:** `src/pipelines/FluidPipeline.js`
*   **Changes:**
    *   Inject "Pixelate" step for UVs.
    *   The "Wave" distortion will now distort entire blocks of pixels together, looking like a "wobbly low-res screen" effect (very SNES/Genesis).

## 3. Coherence Check
*   Ensure the "Pixel Size" in Shaders (e.g. 4.0) roughly matches the visual scaling of the Fog (e.g. scale 4-8).

## Action List
1.  **Modify `BackgroundManager.js`**: 
    *   Update `createCenterDarken` to use `NEAREST` filter + Small Texture + Scale Up.
    *   Add a new `createPixelFog()` method to add the scrolling noise layer.
2.  **Modify `FlamesPipeline.js`**: Add UV quantization and Color Banding.
3.  **Modify `FluidPipeline.js`**: Add UV quantization.

