export const GRID_SIZE = 28;
export const CELL_SIZE = 20;
export const GHOST_COLORS = {
    BLINKY: '#FF0000',  // Red
    PINKY: '#FFB8FF',   // Pink
    INKY: '#00FFFF',    // Cyan
    CLYDE: '#FFB852'    // Orange
};
export const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};
export const SPEEDS = {
    PACMAN: 5,
    GHOST_NORMAL: 4,
    GHOST_FRIGHTENED: 2
};
export const POWER_PELLET_DURATION = 10000; // 10 seconds
export const POINTS = {
    DOT: 10,
    POWER_PELLET: 50,
    GHOST: 200
}; 