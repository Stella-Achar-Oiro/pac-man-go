// setup.js
export const GRID_SIZE = 20;
export const CELL_SIZE = 20;

// Game object types - Define this first
export const OBJECT_TYPE = Object.freeze({
    BLANK: 'blank',
    WALL: 'wall',
    DOT: 'dot',
    BLINKY: 'blinky',
    PINKY: 'pinky',
    INKY: 'inky',
    CLYDE: 'clyde',
    PILL: 'pill',
    PACMAN: 'pacman',
    GHOST: 'ghost',
    SCARED: 'scared',
    GHOSTLAIR: 'lair',
    FRUIT: 'fruit',
    CHERRY: 'cherry',
    STRAWBERRY: 'strawberry',
    ORANGE: 'orange',
    APPLE: 'apple',
    MELON: 'melon',
    GALAXIAN: 'galaxian',
    BELL: 'bell',
    KEY: 'key'
});

export const DIRECTIONS = Object.freeze({
    ArrowLeft: { movement: -1, rotation: 180 },
    ArrowUp: { movement: -GRID_SIZE, rotation: 270 },
    ArrowRight: { movement: 1, rotation: 0 },
    ArrowDown: { movement: GRID_SIZE, rotation: 90 }
});

// Ghost mode timings (in milliseconds)
export const GHOST_MODES = {
    // Level 1 timings
    LEVEL_1: {
        SCATTER: [7000, 7000, 5000, 5000],  // 7, 7, 5, 5 seconds
        CHASE: [20000, 20000, 20000, 20000], // 20 seconds each
        SCARED: 6000,  // 6 seconds
        FLASH_TIME: 2000 // 2 seconds before power pill ends
    },
    // Level 2-4 timings
    LEVEL_2_4: {
        SCATTER: [7000, 7000, 5000, 5000],
        CHASE: [20000, 20000, 20000, 20000],
        SCARED: 5000,
        FLASH_TIME: 2000
    },
    // Level 5+ timings
    LEVEL_5_PLUS: {
        SCATTER: [5000, 5000, 5000, 5000],
        CHASE: [20000, 20000, 20000, 20000],
        SCARED: 4000,
        FLASH_TIME: 2000
    }
};

// Ghost house positions
export const GHOST_HOUSE = Object.freeze({
    ENTRY: 209,   // Position ghosts return to when eaten
    EXIT: 184,    // Position ghosts move to when leaving house
    BLINKY_START: 184,  // Blinky starts outside
    PINKY_START: 209,   // Center of ghost house
    INKY_START: 208,    // Left side of ghost house
    CLYDE_START: 210    // Right side of ghost house
});

// Ghost release timing (in dots eaten)
export const GHOST_RELEASE = Object.freeze({
    BLINKY: 0,    // Starts outside
    PINKY: 0,     // Exits immediately
    INKY: 30,     // After 30 dots
    CLYDE: 60     // After 60 dots
});

// Fruit scoring and timing
export const FRUITS = Object.freeze({
    CHERRY: { score: 100, dotsRequired: 70 },
    STRAWBERRY: { score: 300, dotsRequired: 170 },
    ORANGE: { score: 500, dotsRequired: 270 },
    APPLE: { score: 700, dotsRequired: 370 },
    MELON: { score: 1000, dotsRequired: 470 },
    GALAXIAN: { score: 2000, dotsRequired: 570 },
    BELL: { score: 3000, dotsRequired: 670 },
    KEY: { score: 5000, dotsRequired: 770 }
});

export const TUNNEL = {
    LEFT_ENTRY: 180,    // Position 180 (row 9, column 0)
    RIGHT_ENTRY: 199,   // Position 199 (row 9, column 19)
};

// Optimize class list for faster lookups
export const CLASS_LIST = Object.freeze([
    OBJECT_TYPE.BLANK,
    OBJECT_TYPE.WALL,
    OBJECT_TYPE.DOT,
    OBJECT_TYPE.BLINKY,
    OBJECT_TYPE.PINKY,
    OBJECT_TYPE.INKY,
    OBJECT_TYPE.CLYDE,
    OBJECT_TYPE.PILL,
    OBJECT_TYPE.PACMAN,
    OBJECT_TYPE.GHOSTLAIR
]);

// Ghost behavior settings
export const GHOST_BEHAVIOR = {
    // Scatter mode corner targets for each ghost
    SCATTER_TARGETS: {
        [OBJECT_TYPE.BLINKY]: { x: GRID_SIZE - 2, y: 0 },       // Top-right
        [OBJECT_TYPE.PINKY]: { x: 1, y: 0 },                    // Top-left
        [OBJECT_TYPE.INKY]: { x: GRID_SIZE - 1, y: GRID_SIZE - 1 }, // Bottom-right
        [OBJECT_TYPE.CLYDE]: { x: 0, y: GRID_SIZE - 1 }         // Bottom-left
    },
    // Time before leaving ghost house (in milliseconds)
    LEAVE_HOME_TIME: {
        [OBJECT_TYPE.BLINKY]: 0,    // Starts outside
        [OBJECT_TYPE.PINKY]: 3000,  // 3 seconds
        [OBJECT_TYPE.INKY]: 7000,   // 7 seconds
        [OBJECT_TYPE.CLYDE]: 12000  // 12 seconds
    }
};

//  LEVEL array with tunnels
// prettier-ignore
export const LEVEL = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1,
    1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1,
    1, 7, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 7, 1,
    1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
    1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1,
    1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1,
    1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1,
    1, 1, 1, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 1, 1, 1,
    0, 2, 2, 2, 2, 2, 2, 1, 9, 9, 9, 9, 1, 2, 2, 2, 2, 2, 2, 0, 
    1, 1, 1, 1, 2, 1, 2, 1, 9, 9, 9, 9, 1, 2, 1, 2, 1, 1, 1, 1,
    1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1,
    1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
    1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1,
    1, 7, 2, 1, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 1, 2, 7, 1,
    1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1,
    1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1,
    1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
];