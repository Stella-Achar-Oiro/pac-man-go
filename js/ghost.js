// ghost.js
import { DIRECTIONS, OBJECT_TYPE, GRID_SIZE, GHOST_MODES, GHOST_HOUSE } from './setup.js';

// Scatter mode corner targets for each ghost
const SCATTER_TARGETS = {
    [OBJECT_TYPE.BLINKY]: { x: GRID_SIZE - 1, y: 0 },         // Top-right corner
    [OBJECT_TYPE.PINKY]: { x: 0, y: 0 },                      // Top-left corner
    [OBJECT_TYPE.INKY]: { x: GRID_SIZE - 1, y: GRID_SIZE - 1 },  // Bottom-right corner
    [OBJECT_TYPE.CLYDE]: { x: 0, y: GRID_SIZE - 1 }           // Bottom-left corner
};

// Calculate distance between two points on the grid
function calculateDistance(posA, posB) {
    const aX = posA % GRID_SIZE;
    const aY = Math.floor(posA / GRID_SIZE);
    const bX = posB % GRID_SIZE;
    const bY = Math.floor(posB / GRID_SIZE);
    return Math.abs(aX - bX) + Math.abs(aY - bY);
}

// Mode management functions
function startScatterMode(ghost) {
    ghost.mode = 'SCATTER';
    ghost.modeStartTime = performance.now();
    ghost.modeTimer = setTimeout(() => {
        startChaseMode(ghost);
    }, ghost.modeTimings.SCATTER[ghost.currentModeIndex]);
}

function startChaseMode(ghost) {
    ghost.mode = 'CHASE';
    ghost.modeStartTime = performance.now();
    ghost.modeTimer = setTimeout(() => {
        ghost.currentModeIndex++;
        startScatterMode(ghost);
    }, ghost.modeTimings.CHASE[ghost.currentModeIndex]);
}

class Ghost {
    constructor(speed = 5, startPos, movement, name, pacman = null, blinky = null) {
        this.name = name;
        this.movement = movement;
        this.startPos = startPos;
        this.pos = startPos;
        this.dir = DIRECTIONS.ArrowRight;
        this.speed = speed;
        this.timer = 0;
        this.isScared = false;
        this.rotation = false;
        this.pacman = pacman;
        this.blinky = blinky; // Reference to Blinky for Inky's behavior
        this.classesToRemove = [OBJECT_TYPE.GHOST, OBJECT_TYPE.SCARED, this.name];
        this.classesToAdd = [OBJECT_TYPE.GHOST, this.name];
        this.scaredClassesToAdd = [OBJECT_TYPE.GHOST, OBJECT_TYPE.SCARED, this.name];
        
        // Mode and targeting properties
        this.mode = 'SCATTER';  // Start in scatter mode
        this.scatterTarget = this.getScatterTarget();
        this.isInHouse = name !== OBJECT_TYPE.BLINKY; // All ghosts except Blinky start in house
        this.modeTimer = null;
        this.modeStartTime = performance.now();
        this.currentModeIndex = 0;
        this.modeTimings = GHOST_MODES.LEVEL_1; // Default to level 1 timings
    }

    shouldMove() {
        if (this.timer < this.speed) {
            this.timer++;
            return false;
        }
        this.timer = 0;
        return true;
    }

    getScatterTarget() {
        return SCATTER_TARGETS[this.name] || { x: 0, y: 0 }; // Fallback to top-left corner
    }

    setModeTimings(timings) {
        this.modeTimings = timings;
        this.currentModeIndex = 0;
        this.startNextMode();
    }

    startNextMode() {
        if (this.modeTimer) {
            clearTimeout(this.modeTimer);
        }
        
        if (this.mode === 'SCATTER') {
            startChaseMode(this);
        } else {
            startScatterMode(this);
        }
    }

    getNextMove(objectExist) {
        if (this.isInHouse) {
            return this.getHouseExit(objectExist);
        }

        if (this.isScared) {
            return randomMovement(this.pos, this.dir, objectExist);
        }

        const target = this.mode === 'SCATTER' ? 
            this.getScatterTarget() :
            this.getChaseTarget();

        return this.moveTowardsTarget(target, objectExist);
    }

    getChaseTarget() {
        switch (this.name) {
            case OBJECT_TYPE.BLINKY:
                return { 
                    x: this.pacman.pos % GRID_SIZE,
                    y: Math.floor(this.pacman.pos / GRID_SIZE)
                };
            case OBJECT_TYPE.PINKY:
                // Target 4 tiles ahead of Pacman
                const pacmanDir = this.pacman.dir?.movement || 0;
                const targetPos = this.pacman.pos + (pacmanDir * 4);
                return {
                    x: targetPos % GRID_SIZE,
                    y: Math.floor(targetPos / GRID_SIZE)
                };
            case OBJECT_TYPE.INKY:
                // Complex Inky targeting using Blinky's position
                const blinkyPos = this.blinky?.pos || this.pos;
                const twoAheadOfPacman = this.pacman.pos + (this.pacman.dir?.movement || 0) * 2;
                const intermediateX = twoAheadOfPacman % GRID_SIZE;
                const intermediateY = Math.floor(twoAheadOfPacman / GRID_SIZE);
                const blinkyX = blinkyPos % GRID_SIZE;
                const blinkyY = Math.floor(blinkyPos / GRID_SIZE);
                
                return {
                    x: intermediateX + (intermediateX - blinkyX),
                    y: intermediateY + (intermediateY - blinkyY)
                };
            case OBJECT_TYPE.CLYDE:
                // If far from Pacman (>8 tiles), chase directly; if close, go to scatter corner
                const distance = calculateDistance(this.pos, this.pacman.pos);
                return distance > 8 ? {
                    x: this.pacman.pos % GRID_SIZE,
                    y: Math.floor(this.pacman.pos / GRID_SIZE)
                } : this.getScatterTarget();
            default:
                return this.getScatterTarget();
        }
    }

    getHouseExit(objectExist) {
        const exitPos = GHOST_HOUSE.EXIT;
        return this.moveTowardsTarget({
            x: exitPos % GRID_SIZE,
            y: Math.floor(exitPos / GRID_SIZE)
        }, objectExist);
    }

    moveTowardsTarget(target, objectExist) {
        const dirs = Object.values(DIRECTIONS);
        let bestDirection = this.dir;
        let shortestDistance = Infinity;

        // Consider each possible direction
        for (const dir of dirs) {
            const nextPos = this.pos + dir.movement;
            
            // Skip invalid moves (walls, ghost house when not needed)
            if (objectExist(nextPos, OBJECT_TYPE.WALL) || 
                (!this.isInHouse && objectExist(nextPos, OBJECT_TYPE.GHOSTLAIR))) {
                continue;
            }

            const newX = nextPos % GRID_SIZE;
            const newY = Math.floor(nextPos / GRID_SIZE);
            const distance = Math.abs(target.x - newX) + Math.abs(target.y - newY);

            // Update best direction if this move gets us closer to target
            if (distance < shortestDistance) {
                shortestDistance = distance;
                bestDirection = dir;
            }
        }

        return {
            nextMovePos: this.pos + bestDirection.movement,
            direction: bestDirection
        };
    }

    makeMove() {
        return {
            classesToRemove: this.classesToRemove,
            classesToAdd: this.isScared ? this.scaredClassesToAdd : this.classesToAdd
        };
    }

    setNewPos(nextMovePos, direction) {
        this.pos = nextMovePos;
        this.dir = direction;
    }

    resetPosition() {
        this.pos = this.startPos;
        this.dir = DIRECTIONS.ArrowRight;
        this.timer = 0;
        this.isScared = false;
        this.mode = 'SCATTER';
        this.currentModeIndex = 0;
        if (this.modeTimer) {
            clearTimeout(this.modeTimer);
        }
        startScatterMode(this);
    }

    setPacman(pacman) {
        this.pacman = pacman;
    }
}

// Random movement for scared ghosts
function randomMovement(position, direction, objectExist) {
    const dirs = Object.values(DIRECTIONS);
    let nextMovePos;
    let dir = direction;
    let attempts = 0;
    
    do {
        dir = dirs[Math.floor(Math.random() * dirs.length)];
        nextMovePos = position + dir.movement;
        attempts++;
        if (attempts > 10) return { nextMovePos: position, direction };
    } while (
        objectExist(nextMovePos, OBJECT_TYPE.WALL) ||
        objectExist(nextMovePos, OBJECT_TYPE.GHOSTLAIR)
    );

    return { nextMovePos, direction: dir };
}

export default Ghost;