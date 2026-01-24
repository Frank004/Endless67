/**
 * BackgroundPatterns.js
 * 
 * Defines the arrangement of decorations for background segments.
 * Each pattern is a configuration object that dictates where decorations
 * should be placed within a vertical segment.
 * 
 * Segment Size Reference:
 * Width: Screen Width (variable, usually 320-360)
 * Height: ~640px (1 viewport height)
 * Grid: 32x32 tiles implied
 */

export const BACKGROUND_PATTERNS = [
    // Pattern 1: Very Sparse Random
    {
        name: 'SPARSE_SCATTER',
        density: 0.1,
        items: [
            { x: 0.2, y: 0.2, type: 'random' },
            { x: 0.8, y: 0.7, type: 'random' }
        ]
    },
    // Pattern 2: Alternating Sides
    {
        name: 'ALTERNATING_SIDES',
        density: 0.15,
        items: [
            { x: 0.2, y: 0.15, type: 'random' },
            { x: 0.8, y: 0.5, type: 'random' },
            { x: 0.2, y: 0.85, type: 'random' }
        ]
    },
    // Pattern 3: Center Column (Spaced)
    {
        name: 'CENTER_SPACED',
        density: 0.1,
        items: [
            { x: 0.5, y: 0.2, type: 'random' },
            { x: 0.5, y: 0.6, type: 'random' }
        ]
    },
    // Pattern 4: ZigZag (Wide)
    {
        name: 'ZIGZAG_WIDE',
        density: 0.15,
        items: [
            { x: 0.2, y: 0.2, type: 'random' },
            { x: 0.8, y: 0.5, type: 'random' },
            { x: 0.2, y: 0.8, type: 'random' }
        ]
    },
    // Pattern 5: Diagonal (Wide)
    {
        name: 'DIAGONAL_WIDE',
        density: 0.15,
        items: [
            { x: 0.2, y: 0.2, type: 'random' },
            { x: 0.5, y: 0.5, type: 'random' },
            { x: 0.8, y: 0.8, type: 'random' }
        ]
    },
    // Pattern 6: Empty (Rest)
    {
        name: 'EMPTY_REST',
        density: 0,
        items: []
    },
    // Pattern 7: Triangle Setup
    {
        name: 'TRIANGLE_SETUP',
        density: 0.15,
        items: [
            { x: 0.5, y: 0.2, type: 'random' },
            { x: 0.2, y: 0.7, type: 'random' },
            { x: 0.8, y: 0.7, type: 'random' }
        ]
    }
];

export const DECO_FRAMES = [
    'wall-deco-03.png',
    'wall-deco-06.png',
    'wall-deco-08.png',
    'wall-deco-13.png'
];
