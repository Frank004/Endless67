export const MAZE_PATTERNS = [
    // Pattern 1: Standard Zig-Zag
    [
        { type: 'left', width: 250 },
        { type: 'right', width: 250 },
        { type: 'left', width: 250 },
        { type: 'right', width: 250 },
        { type: 'left', width: 250 }
    ],
    // Pattern 2: Narrow S-Bends (Tight gaps)
    [
        { type: 'left', width: 320 },
        { type: 'right', width: 320 },
        { type: 'left', width: 320 },
        { type: 'right', width: 320 },
        { type: 'left', width: 320 }
    ],
    // Pattern 3: The Tunnel (Center gap)
    [
        { type: 'split', width: 140, width2: 140 },
        { type: 'split', width: 140, width2: 140 },
        { type: 'split', width: 140, width2: 140 },
        { type: 'split', width: 140, width2: 140 },
        { type: 'split', width: 140, width2: 140 }
    ],
    // Pattern 4: The Staircase
    [
        { type: 'left', width: 100 },
        { type: 'left', width: 200 },
        { type: 'left', width: 300 },
        { type: 'right', width: 100 },
        { type: 'right', width: 200 },
        { type: 'right', width: 300 }
    ],
    // Pattern 5: Floating Islands (Center blocks)
    [
        { type: 'center', width: 200 },
        { type: 'center', width: 200 },
        { type: 'center', width: 200 },
        { type: 'center', width: 200 },
        { type: 'center', width: 200 }
    ],
    // Pattern 6: The Weave (Alternating splits)
    [
        { type: 'split', width: 250, width2: 50 }, // Gap on right
        { type: 'split', width: 50, width2: 250 }, // Gap on left
        { type: 'split', width: 250, width2: 50 },
        { type: 'split', width: 50, width2: 250 },
        { type: 'split', width: 250, width2: 50 }
    ],
    // Pattern 7: The Gauntlet (Mixed)
    [
        { type: 'left', width: 280 },
        { type: 'center', width: 180 },
        { type: 'right', width: 280 },
        { type: 'split', width: 120, width2: 120 },
        { type: 'center', width: 180 },
        { type: 'left', width: 280 }
    ]
];
