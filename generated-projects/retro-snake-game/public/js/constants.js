/**
 * Royal Ludo 2-Player Edition - Game Constants & Configuration
 * Defines player attributes, board coordinates, track paths, home paths, and safe zones.
 */

const PLAYERS = {
    RED: {
        id: 'red',
        name: 'Red Player',
        colorClass: 'red',
        bgClass: 'bg-rose-500',
        textClass: 'text-rose-500',
        borderClass: 'border-rose-500',
        ringClass: 'ring-rose-500',
        hoverBg: 'hover:bg-rose-600',
        baseCoords: [
            { row: 1.5, col: 1.5 },
            { row: 1.5, col: 3.5 },
            { row: 3.5, col: 1.5 },
            { row: 3.5, col: 3.5 }
        ],
        startSquare: 0,
        homePathStart: 50,
        homeCoords: { row: 7, col: 1 },
        entrySquare: 50
    },
    GREEN: {
        id: 'green',
        name: 'Green Player',
        colorClass: 'green',
        bgClass: 'bg-emerald-500',
        textClass: 'text-emerald-500',
        borderClass: 'border-emerald-500',
        ringClass: 'ring-emerald-500',
        hoverBg: 'hover:bg-emerald-600',
        baseCoords: [
            { row: 11.5, col: 11.5 },
            { row: 11.5, col: 13.5 },
            { row: 13.5, col: 11.5 },
            { row: 13.5, col: 13.5 }
        ],
        startSquare: 26,
        homePathStart: 100,
        homeCoords: { row: 7, col: 13 },
        entrySquare: 24
    }
};

// 52 Main circular track coordinates (0 to 51)
// Standard 15x15 Ludo board grid mapping (row, col indices from 0 to 14)
const MAIN_TRACK = [
    { row: 6, col: 1 },  // 0 (Red start)
    { row: 6, col: 2 },  // 1
    { row: 6, col: 3 },  // 2
    { row: 6, col: 4 },  // 3
    { row: 6, col: 5 },  // 4
    { row: 5, col: 6 },  // 5
    { row: 4, col: 6 },  // 6
    { row: 3, col: 6 },  // 7
    { row: 2, col: 6 },  // 8
    { row: 1, col: 6 },  // 9
    { row: 0, col: 6 },  // 10
    { row: 0, col: 7 },  // 11 (Top Star / Safe)
    { row: 0, col: 8 },  // 12
    { row: 1, col: 8 },  // 13
    { row: 2, col: 8 },  // 14
    { row: 3, col: 8 },  // 15
    { row: 4, col: 8 },  // 16
    { row: 5, col: 8 },  // 17
    { row: 6, col: 9 },  // 18
    { row: 6, col: 10 }, // 19
    { row: 6, col: 11 }, // 20
    { row: 6, col: 12 }, // 21
    { row: 6, col: 13 }, // 22
    { row: 6, col: 14 }, // 23
    { row: 7, col: 14 }, // 24 (Green entry approach)
    { row: 8, col: 14 }, // 25 (Green start)
    { row: 8, col: 13 }, // 26
    { row: 8, col: 12 }, // 27
    { row: 8, col: 11 }, // 28
    { row: 8, col: 10 }, // 29
    { row: 8, col: 9 },  // 30
    { row: 9, col: 8 },  // 31
    { row: 10, col: 8 }, // 32
    { row: 11, col: 8 }, // 33
    { row: 12, col: 8 }, // 34
    { row: 13, col: 8 }, // 35
    { row: 14, col: 8 }, // 36
    { row: 14, col: 7 }, // 37 (Bottom Star / Safe)
    { row: 14, col: 6 }, // 38
    { row: 13, col: 6 }, // 39
    { row: 12, col: 6 }, // 40
    { row: 11, col: 6 }, // 41
    { row: 10, col: 6 }, // 42
    { row: 9, col: 6 },  // 43
    { row: 8, col: 5 },  // 44
    { row: 8, col: 4 },  // 45
    { row: 8, col: 3 },  // 46
    { row: 8, col: 2 },  // 47
    { row: 8, col: 1 },  // 48
    { row: 8, col: 0 },  // 49
    { row: 7, col: 0 },  // 50 (Red entry approach)
    { row: 6, col: 0 }   // 51
];

// Home stretch paths leading to the center for each player (5 steps + center 1)
const HOME_PATHS = {
    red: [
        { row: 7, col: 1 },
        { row: 7, col: 2 },
        { row: 7, col: 3 },
        { row: 7, col: 4 },
        { row: 7, col: 5 },
        { row: 7, col: 6 } // Center Home
    ],
    green: [
        { row: 7, col: 13 },
        { row: 7, col: 12 },
        { row: 7, col: 11 },
        { row: 7, col: 10 },
        { row: 7, col: 9 },
        { row: 7, col: 8 } // Center Home
    ]
};

// Safe squares on the main board where tokens cannot be captured
const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

/**
 * Initializes interactive event listeners, DOM bindings, and state logic for constants if needed.
 */
function initConstantsModule() {
    // DOM bindings & state logic setup placeholder
    const activeStates = {
        initialized: true,
        timestamp: Date.now()
    };

    // Interactive event listeners support
    document.addEventListener('DOMContentLoaded', () => {
        // Safe binding check for interactive constant helpers or inspectors
        const boardElement = document.getElementById('ludo-board');
        if (boardElement) {
            boardElement.setAttribute('data-constants-loaded', 'true');
        }
    });

    return activeStates;
}

// Execute state initialization to provide interactive hooks and bindings
initConstantsModule();

// Export constants for browser or CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PLAYERS,
        MAIN_TRACK,
        HOME_PATHS,
        SAFE_SQUARES
    };
}