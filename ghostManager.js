// ghostManager.js
import { GRID_SIZE, SPEED, CELL_SIZE } from './config.js';

class Ghost {
    constructor(color, startPosition, behavior, parentElement, releaseDelay = 0, manager) {
        this.color = color;
        this.startPosition = startPosition;
        this.position = startPosition;
        this.behavior = behavior;
        this.isScared = false;
        this.moveTimer = 0;
        this.parentElement = parentElement;
        this.element = this.createGhostElement();
        this.lastPosition = null;
        this.isInHouse = true;
        this.releaseDelay = releaseDelay;
        this.releaseTimer = releaseDelay;
        this.manager = manager; // Add reference to manager
        this.isEaten = false;
    }

    createGhostElement() {
        const element = document.createElement('div');
        element.className = 'ghost';
        element.innerHTML = `
            <svg viewBox="0 0 20 20">
                <path class="ghost-body" d="M1,19 L1,8 C1,3.5 5,0 10,0 C15,0 19,3.5 19,8 L19,19 L15,15 L13,19 L10,15 L7,19 L5,15 L1,19" 
                      fill="${this.color}">
                    <animate attributeName="d" 
                        values="M1,19 L1,8 C1,3.5 5,0 10,0 C15,0 19,3.5 19,8 L19,19 L15,15 L13,19 L10,15 L7,19 L5,15 L1,19;
                                M1,20 L1,9 C1,4.5 5,1 10,1 C15,1 19,4.5 19,9 L19,20 L15,16 L13,20 L10,16 L7,20 L5,16 L1,20"
                        dur="0.5s"
                        repeatCount="indefinite"/>
                </path>
                <circle class="eye" cx="7" cy="8" r="2" fill="white"/>
                <circle class="eye" cx="13" cy="8" r="2" fill="white"/>
                <circle class="pupil" cx="7" cy="8" r="1" fill="black">
                    <animate attributeName="cx" values="6;8;6" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle class="pupil" cx="13" cy="8" r="1" fill="black">
                    <animate attributeName="cx" values="12;14;12" dur="2s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `;
        this.parentElement.appendChild(element);
        return element;
    }

    moveTowardsExit(board) {
        const currentX = this.position % GRID_SIZE;
        const currentY = Math.floor(this.position / GRID_SIZE);
        const exitX = 14;
        const exitY = 11;
    
        // First, if we're in the house, move up until we can exit
        if (board.isGhostHouse(this.position)) {
            const upPos = this.position - GRID_SIZE;
            if (!board.isWall(upPos)) {
                this.position = upPos;
                return;
            }
        }
    
        // Then adjust horizontal position
        if (currentX !== exitX) {
            const moveRight = currentX < exitX;
            const nextPos = this.position + (moveRight ? 1 : -1);
            if (!board.isWall(nextPos)) {
                this.position = nextPos;
                return;
            }
        }
    
        // Finally move up to the exit point
        if (currentY > exitY) {
            const upPos = this.position - GRID_SIZE;
            if (!board.isWall(upPos)) {
                this.position = upPos;
            }
        }
    }

    update(deltaTime, board, pacman) {
        if (this.isInHouse) {
            this.releaseTimer -= deltaTime;
            if (this.releaseTimer <= 0) {
                if (this.position === 11 * GRID_SIZE + 14) {
                    this.isInHouse = false;
                } else {
                    this.moveTowardsExit(board);
                }
            }
        }
    
        this.moveTimer += deltaTime;
        if (this.moveTimer >= (this.isScared ? SPEED.frightened : SPEED.ghost)) {
            this.moveTimer = 0;
            if (!this.isInHouse) {
                this.move(board, pacman);
            }
        }
    
        this.updatePosition();
    }

    move(board, pacman) {
        const possibleMoves = this.getValidMoves(board);
        
        if (possibleMoves.length === 0) {
            return;
        }

        let nextPosition;
        if (this.isScared) {
            const validMoves = possibleMoves.filter(pos => pos !== this.lastPosition);
            nextPosition = validMoves.length > 0 ? 
                validMoves[Math.floor(Math.random() * validMoves.length)] :
                possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        } else {
            nextPosition = this.behavior(this.position, pacman, possibleMoves);
        }

        this.lastPosition = this.position;

        // Handle tunnel transition
        const currentX = this.position % GRID_SIZE;
        const nextX = nextPosition % GRID_SIZE;
        const currentY = Math.floor(this.position / GRID_SIZE);

        if (currentY === 14) { // Tunnel row
            if (currentX === 0 && nextX === GRID_SIZE - 1) {
                // Moving left through tunnel
                this.position = 14 * GRID_SIZE + (GRID_SIZE - 1);
                this.element.style.display = 'none';
                return;
            } else if (currentX === GRID_SIZE - 1 && nextX === 0) {
                // Moving right through tunnel
                this.position = 14 * GRID_SIZE;
                this.element.style.display = 'none';
                return;
            }
        }

        this.position = nextPosition;
        this.element.style.display = 'block';
    }

    updatePosition() {
        const x = (this.position % GRID_SIZE) * CELL_SIZE;
        const y = Math.floor(this.position / GRID_SIZE) * CELL_SIZE;
        
        // Use transform3d for GPU acceleration
        if (this.element.style.display === 'none') {
            // Optimize display changes
            window.requestAnimationFrame(() => {
                this.element.style.display = 'block';
                this.element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            });
        } else {
            this.element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
        
        this.element.classList.toggle('scared', this.isScared);
    }

    getValidMoves(board) {
        const moves = [];
        const x = this.position % GRID_SIZE;
        const y = Math.floor(this.position / GRID_SIZE);
        
        // Handle tunnel wrapping with direction preservation
        if (y === 14) { // Tunnel row
            const lastX = this.lastPosition ? this.lastPosition % GRID_SIZE : null;
            
            if (x === 0) {
                // Only allow moving to right end of tunnel if we came from the right
                if (lastX === 1) {
                    moves.push(this.position + (GRID_SIZE - 1)); // Left to right wrap
                }
            } else if (x === GRID_SIZE - 1) {
                // Only allow moving to left end of tunnel if we came from the left
                if (lastX === GRID_SIZE - 2) {
                    moves.push(this.position - (GRID_SIZE - 1)); // Right to left wrap
                }
            }
        }

        // Regular movement checks
        const checkPosition = (pos) => {
            if (this.isInHouse) {
                return !board.isWall(pos) || board.isGhostHouse(pos);
            }
            return !board.isWall(pos) && !board.isGhostHouse(pos);
        };

        // Check standard directions
        const directions = [
            { dx: -1, dy: 0 }, // Left
            { dx: 1, dy: 0 },  // Right
            { dx: 0, dy: -1 }, // Up
            { dx: 0, dy: 1 }   // Down
        ];

        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            // Skip invalid positions but handle tunnel specially
            if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
                const newPos = newY * GRID_SIZE + newX;
                
                // Prevent immediate tunnel re-entry
                if (y === 14 && this.lastPosition) {
                    const lastY = Math.floor(this.lastPosition / GRID_SIZE);
                    if (lastY === 14) {
                        // If we just used the tunnel, don't allow immediate reversal
                        if ((x === 0 && newX === GRID_SIZE - 1) || 
                            (x === GRID_SIZE - 1 && newX === 0)) {
                            continue;
                        }
                    }
                }
                
                if (checkPosition(newPos) && (!this.lastPosition || newPos !== this.lastPosition)) {
                    moves.push(newPos);
                }
            }
        }

        return moves;
    }


    isValidMove(position, board) {
        // Check if position is within grid bounds
        if (position < 0 || position >= GRID_SIZE * GRID_SIZE) {
            return false;
        }
        
        // Check if position is in tunnel
        const y = Math.floor(position / GRID_SIZE);
        const x = position % GRID_SIZE;
        if (y === 14 && (x <= 1 || x >= GRID_SIZE - 2)) {
            return false;
        }
        
        // Check for walls and ghost house
        return !board.isWall(position) && !board.isGhostHouse(position);
    }
    
    returnToHouse() {
        this.isEaten = true;
        this.isScared = false;
        // Add eyes-only visual state
        this.element.classList.add('eaten');
        
        // Set shorter release delay when eaten
        this.releaseTimer = this.releaseDelay / 2;
        this.position = this.startPosition;
        this.isInHouse = true;
        this.isEaten = false;
        this.lastPosition = null;
        this.element.classList.remove('eaten');
        this.updatePosition();
    }

    reset() {
        this.position = this.startPosition;
        this.lastPosition = null;
        this.isScared = false;
        this.moveTimer = 0;
        this.isInHouse = true;
        this.releaseTimer = this.releaseDelay;
        this.element.style.display = 'block';
        this.updatePosition();
    }
}

// Ghost behaviors
const ghostBehaviors = {
    chase: (ghostPos, pacman, possibleMoves) => {
        return possibleMoves.reduce((closest, move) => {
            const currentDistance = getManhattanDistance(move, pacman.position);
            const closestDistance = getManhattanDistance(closest, pacman.position);
            return currentDistance < closestDistance ? move : closest;
        }, possibleMoves[0]);
    },

    scatter: (ghostPos, pacman, possibleMoves, cornerPos) => {
        const corner = cornerPos || { x: 0, y: 0 };
        const cornerPosition = corner.y * GRID_SIZE + corner.x;
        
        return possibleMoves.reduce((closest, move) => {
            const currentDistance = getManhattanDistance(move, cornerPosition);
            const closestDistance = getManhattanDistance(closest, cornerPosition);
            return currentDistance < closestDistance ? move : closest;
        }, possibleMoves[0]);
    },

    ambush: (ghostPos, pacman, possibleMoves) => {
        let targetPos = pacman.position;
        const direction = pacman.currentDirection;

        if (direction) {
            const targetX = (pacman.position % GRID_SIZE) + (direction.x * 4);
            const targetY = Math.floor(pacman.position / GRID_SIZE) + (direction.y * 4);
            
            const boundedX = Math.max(0, Math.min(GRID_SIZE - 1, targetX));
            const boundedY = Math.max(0, Math.min(GRID_SIZE - 1, targetY));
            
            targetPos = boundedY * GRID_SIZE + boundedX;
        }

        return possibleMoves.reduce((closest, move) => {
            const currentDistance = getManhattanDistance(move, targetPos);
            const closestDistance = getManhattanDistance(closest, targetPos);
            return currentDistance < closestDistance ? move : closest;
        }, possibleMoves[0]);
    }
};

function getManhattanDistance(pos1, pos2) {
    const x1 = pos1 % GRID_SIZE;
    const y1 = Math.floor(pos1 / GRID_SIZE);
    const x2 = pos2 % GRID_SIZE;
    const y2 = Math.floor(pos2 / GRID_SIZE);
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

export default class GhostManager {
    constructor(pacman, parentElement) {
        this.pacman = pacman;
        this.parentElement = parentElement;
        const baseDelay = 2000;
        
        // Pass 'this' as the manager reference
        this.ghosts = [
            new Ghost('#FF0000', 13 * GRID_SIZE + 13, ghostBehaviors.chase, parentElement, 0, this),
            new Ghost('#FFB8FF', 13 * GRID_SIZE + 14, ghostBehaviors.ambush, parentElement, baseDelay, this),
            new Ghost('#00FFFF', 13 * GRID_SIZE + 15, ghostBehaviors.scatter, parentElement, baseDelay * 2, this),
            new Ghost('#FFB852', 13 * GRID_SIZE + 16, ghostBehaviors.scatter, parentElement, baseDelay * 3, this)
        ];
        
        this.scaredTimer = 0;
        this.scaredDuration = 7000;

        this.validMoves = new Array(4);
        this.positions = new Float32Array(2);
    }


    update(deltaTime, board) {
        if (this.scaredTimer > 0) {
            this.scaredTimer -= deltaTime;
            if (this.scaredTimer <= 0) {
                this.unFrightenGhosts();
            }
        }

        this.ghosts.forEach(ghost => {
            ghost.update(deltaTime, board, this.pacman);
        });
    }

    checkCollision(pacmanPos) {
        return this.ghosts.find(ghost => ghost.position === pacmanPos);
    }

    frightenGhosts() {
        this.ghosts.forEach(ghost => {
            ghost.isScared = true;
        });
        this.scaredTimer = this.scaredDuration;
    }

    unFrightenGhosts() {
        this.ghosts.forEach(ghost => {
            ghost.isScared = false;
        });
        this.scaredTimer = 0;
    }

    resetAll() {
        this.ghosts.forEach(ghost => ghost.reset());
        this.unFrightenGhosts();
    }

    increaseSpeed() {
        SPEED.ghost = Math.max(SPEED.ghost * 0.9, 100);
    }
}