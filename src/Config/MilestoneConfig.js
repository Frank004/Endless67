/**
 * MilestoneConfig.js
 * 
 * Configuration for milestone indicators showing top 10 leaderboard positions.
 * Each milestone has a unique vibrant pastel color for visual distinction.
 */

export const MILESTONE_CONFIG = {
    // Street-style vibrant pastel colors - high contrast, eye-catching
    colors: [
        0xFFD700, // 1st - Gold (champion, classic winner)
        0x00F5FF, // 2nd - Cyan (electric blue)
        0xC0FF00, // 3rd - Lime Green (neon)
        0xFF9E00, // 4th - Orange (warm, bold)
        0xB19CD9, // 5th - Lavender (soft purple)
        0xFF6B6B, // 6th - Coral Red (warm pastel)
        0x4ECDC4, // 7th - Turquoise (cool, fresh)
        0xFFE66D, // 8th - Yellow (bright, cheerful)
        0xFF6B9D, // 9th - Hot Pink (vibrant, energetic)
        0x95E1D3  // 10th - Mint (cool, calm)
    ],

    // Visual dimensions
    indicatorWidth: 32,
    indicatorHeight: 16,

    // Positioning
    showDistance: 500, // Show indicator when within 500px of milestone
    edgeOffset: 10,    // Distance from screen edge

    // Effects
    lineAlpha: 0.5,
    particleCount: 12,
    particleDuration: 800
};
