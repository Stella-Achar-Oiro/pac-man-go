import { DIRECTIONS, OBJECT_TYPE, GRID_SIZE, GHOST_MODES, GHOST_HOUSE, TUNNEL, GHOST_BEHAVIOR } from './setup.js';

class Ghost {
    constructor(speed, startPos, movement, name, pacman = null, blinky = null) {
        this.name = name;
        this.movement = movement;
        this.startPos = startPos;
        this.pos = startPos;
        this.dir = this.isInHouse ? DIRECTIONS.ArrowUp : DIRECTIONS.ArrowLeft;
        this.speed = speed;
        this.timer = 0;
        this.isScared = false;
        this.rotation = false;
        this.pacman = pacman;
        this.blinky = blinky;

        // Ghost state properties
        this.mode = 'SCATTER';
        this.isInHouse = name !== OBJECT_TYPE.BLINKY;
        this.scatterTarget = GHOST_BEHAVIOR.SCATTER_TARGETS[name];
        this.leaveHomeTimer = null;
        this.currentModeIndex = 0;
        this.modeTimer = null;
        this.modeTimings = null;

        console.log(`${name} initialized at position ${startPos}`);
        
        // Initialize house exit timer if needed
        if (this.isInHouse) {
            this.setupHouseExit();
        }
    }

    setupHouseExit() {
        if (this.leaveHomeTimer) {
            clearTimeout(this.leaveHomeTimer);
        }
        
        this.leaveHomeTimer = setTimeout(() => {
            console.log(`${this.name} leaving house`);
            this.isInHouse = false;
            this.pos = GHOST_HOUSE.EXIT;
            this.dir = DIRECTIONS.ArrowLeft;
        }, GHOST_BEHAVIOR.LEAVE_HOME_TIME[this.name]);
    }

    shouldMove() {
        if (this.timer < this.speed) {
            this.timer++;
            return false;
        }
        this.timer = 0;
        return true;
    }

    getNextMove(objectExist) {
      if (!this.shouldMove()) {
          return { nextMovePos: this.pos, direction: this.dir };
      }
  
      let nextMovePos;
      let direction;
  
      // Handle different states
      if (this.isInHouse) {
          // Move up and down in house
          const currentY = Math.floor(this.pos / GRID_SIZE);
          const houseTopY = Math.floor(GHOST_HOUSE.EXIT / GRID_SIZE);
          
          if (currentY <= houseTopY) {
              direction = DIRECTIONS.ArrowDown;
          } else {
              direction = DIRECTIONS.ArrowUp;
          }
          nextMovePos = this.pos + direction.movement;
          
          // Validate house movement
          if (objectExist(nextMovePos, OBJECT_TYPE.WALL)) {
              nextMovePos = this.pos;
          }
      } else if (this.isScared) {
          // Random movement when scared
          const possibleMoves = Object.values(DIRECTIONS).filter(dir => {
              const nextPos = this.pos + dir.movement;
              return !objectExist(nextPos, OBJECT_TYPE.WALL) &&
                     !objectExist(nextPos, OBJECT_TYPE.GHOSTLAIR);
          });
          
          direction = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          nextMovePos = this.pos + direction.movement;
      } else {
          // Normal targeting behavior
          const target = this.mode === 'SCATTER' ? this.scatterTarget : this.getChaseTarget();
          ({ nextMovePos, direction } = this.calculateMove(target, objectExist));
      }
  
      console.log(`${this.name} moving from ${this.pos} to ${nextMovePos}`);
      return { nextMovePos, direction };
    }

    getHouseMove() {
        const currentY = Math.floor(this.pos / GRID_SIZE);
        const houseTopY = Math.floor(GHOST_HOUSE.EXIT / GRID_SIZE);
        const direction = currentY <= houseTopY ? DIRECTIONS.ArrowDown : DIRECTIONS.ArrowUp;
        const nextMovePos = this.pos + direction.movement;
        
        console.log(`${this.name} house movement: ${this.pos} -> ${nextMovePos}`);
        return { nextMovePos, direction };
    }

    getScaredMove(objectExist) {
        const possibleMoves = this.getValidMoves(objectExist);
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        const nextMovePos = this.pos + randomMove.movement;
        
        console.log(`${this.name} scared movement: ${this.pos} -> ${nextMovePos}`);
        return { nextMovePos, direction: randomMove };
    }

    calculateMove(target, objectExist) {
      const currentX = this.pos % GRID_SIZE;
      const currentY = Math.floor(this.pos / GRID_SIZE);
      
      // Get all possible moves
      const possibleMoves = Object.values(DIRECTIONS).filter(dir => {
          const nextPos = this.pos + dir.movement;
          return !objectExist(nextPos, OBJECT_TYPE.WALL) &&
                 (!this.isInHouse && !objectExist(nextPos, OBJECT_TYPE.GHOSTLAIR)) &&
                 dir !== this.getOppositeDirection(this.dir);
      });
  
      // If no moves available, stay in current position
      if (possibleMoves.length === 0) {
          return {
              nextMovePos: this.pos,
              direction: this.dir
          };
      }
  
      // Calculate distances for each possible move
      const moveDistances = possibleMoves.map(move => {
          const nextPos = this.pos + move.movement;
          const nextX = nextPos % GRID_SIZE;
          const nextY = Math.floor(nextPos / GRID_SIZE);
          
          // Use Manhattan distance
          const distance = Math.abs(target.x - nextX) + Math.abs(target.y - nextY);
          
          return { move, distance };
      });
  
      // Sort by distance and get the best move
      moveDistances.sort((a, b) => a.distance - b.distance);
      const bestMove = moveDistances[0].move;
  
      return {
          nextMovePos: this.pos + bestMove.movement,
          direction: bestMove
      };
  }

    getValidMoves(objectExist) {
        return Object.values(DIRECTIONS).filter(dir => {
            const nextPos = this.pos + dir.movement;
            // Prevent reversing direction unless it's the only option
            const isReverse = dir === this.getOppositeDirection(this.dir);
            return !objectExist(nextPos, OBJECT_TYPE.WALL) &&
                   !objectExist(nextPos, OBJECT_TYPE.GHOSTLAIR) &&
                   (!isReverse || this.isOnlyOption(objectExist));
        });
    }

    isOnlyOption(objectExist) {
        return Object.values(DIRECTIONS).every(dir => {
            if (dir === this.getOppositeDirection(this.dir)) return true;
            const nextPos = this.pos + dir.movement;
            return objectExist(nextPos, OBJECT_TYPE.WALL) ||
                   objectExist(nextPos, OBJECT_TYPE.GHOSTLAIR);
        });
    }

    getOppositeDirection(dir) {
        if (!dir) return null;
        return {
            [DIRECTIONS.ArrowLeft.movement]: DIRECTIONS.ArrowRight,
            [DIRECTIONS.ArrowRight.movement]: DIRECTIONS.ArrowLeft,
            [DIRECTIONS.ArrowUp.movement]: DIRECTIONS.ArrowDown,
            [DIRECTIONS.ArrowDown.movement]: DIRECTIONS.ArrowUp
        }[dir.movement] || null;
    }

    makeMove() {
        return {
            classesToRemove: [OBJECT_TYPE.GHOST, OBJECT_TYPE.SCARED, this.name],
            classesToAdd: this.isScared ? 
                [OBJECT_TYPE.GHOST, OBJECT_TYPE.SCARED, this.name] :
                [OBJECT_TYPE.GHOST, this.name]
        };
    }

    setNewPos(nextMovePos, direction) {
        this.pos = nextMovePos;
        this.dir = direction;
    }

    resetPosition() {
        console.log(`${this.name} resetting position`);
        this.pos = this.startPos;
        this.dir = DIRECTIONS.ArrowRight;
        this.timer = 0;
        this.isScared = false;
        this.mode = 'SCATTER';
        this.currentModeIndex = 0;
        this.isInHouse = this.name !== OBJECT_TYPE.BLINKY;
        
        if (this.modeTimer) clearTimeout(this.modeTimer);
        if (this.leaveHomeTimer) clearTimeout(this.leaveHomeTimer);
        
        if (this.isInHouse) {
            this.setupHouseExit();
        }
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

        this.mode = this.mode === 'SCATTER' ? 'CHASE' : 'SCATTER';
        console.log(`${this.name} changing to ${this.mode} mode`);
        
        const duration = this.mode === 'SCATTER' 
            ? this.modeTimings.SCATTER[this.currentModeIndex]
            : this.modeTimings.CHASE[this.currentModeIndex];

        this.modeTimer = setTimeout(() => {
            if (this.mode === 'CHASE' && 
                this.currentModeIndex < this.modeTimings.SCATTER.length - 1) {
                this.currentModeIndex++;
            }
            this.startNextMode();
        }, duration);
    }

    // Keep existing getChaseTarget method as is since it's working correctly
    getChaseTarget() {
        const pacmanX = this.pacman.pos % GRID_SIZE;
        const pacmanY = Math.floor(this.pacman.pos / GRID_SIZE);

        switch (this.name) {
            case OBJECT_TYPE.BLINKY:
                return { x: pacmanX, y: pacmanY };

            case OBJECT_TYPE.PINKY: {
                let targetX = pacmanX;
                let targetY = pacmanY;

                if (this.pacman.dir) {
                    const ahead = 4;
                    switch (this.pacman.dir) {
                        case DIRECTIONS.ArrowUp:
                            targetY -= ahead;
                            targetX -= ahead;
                            break;
                        case DIRECTIONS.ArrowDown:
                            targetY += ahead;
                            break;
                        case DIRECTIONS.ArrowLeft:
                            targetX -= ahead;
                            break;
                        case DIRECTIONS.ArrowRight:
                            targetX += ahead;
                            break;
                    }
                }
                return { x: targetX, y: targetY };
            }

            case OBJECT_TYPE.INKY: {
                if (!this.blinky) return this.scatterTarget;

                let aheadX = pacmanX;
                let aheadY = pacmanY;

                if (this.pacman.dir) {
                    const ahead = 2;
                    switch (this.pacman.dir) {
                        case DIRECTIONS.ArrowUp:
                            aheadY -= ahead;
                            aheadX -= ahead;
                            break;
                        case DIRECTIONS.ArrowDown:
                            aheadY += ahead;
                            break;
                        case DIRECTIONS.ArrowLeft:
                            aheadX -= ahead;
                            break;
                        case DIRECTIONS.ArrowRight:
                            aheadX += ahead;
                            break;
                    }
                }

                const blinkyX = this.blinky.pos % GRID_SIZE;
                const blinkyY = Math.floor(this.blinky.pos / GRID_SIZE);

                return {
                    x: aheadX + (aheadX - blinkyX),
                    y: aheadY + (aheadY - blinkyY)
                };
            }

            case OBJECT_TYPE.CLYDE: {
                const distance = Math.sqrt(
                    Math.pow(pacmanX - (this.pos % GRID_SIZE), 2) +
                    Math.pow(pacmanY - Math.floor(this.pos / GRID_SIZE), 2)
                );

                return distance > 8 ? { x: pacmanX, y: pacmanY } : this.scatterTarget;
            }

            default:
                return this.scatterTarget;
        }
    }
}

export default Ghost;