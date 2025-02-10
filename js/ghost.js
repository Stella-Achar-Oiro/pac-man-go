//ghost.js

import { DIRECTIONS, OBJECT_TYPE } from './setup.js';

// Calculate Manhattan distance between two positions
function getManhattanDistance(pos1, pos2, gridSize) {
  const x1 = pos1 % gridSize;
  const y1 = Math.floor(pos1 / gridSize);
  const x2 = pos2 % gridSize;
  const y2 = Math.floor(pos2 / gridSize);
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// Get available directions excluding walls and other ghosts
function getAvailableDirections(pos, objectExist) {
  return Object.values(DIRECTIONS).filter(dir => {
    const nextPos = pos + dir.movement;
    return !objectExist(nextPos, OBJECT_TYPE.WALL) && 
           !objectExist(nextPos, OBJECT_TYPE.GHOSTLAIR);
  });
}

// Ghost movement strategy
function calculateNextMove(position, direction, objectExist, pacmanPos, isScared, gridSize = 20) {
  const availableDirs = getAvailableDirections(position, objectExist);
  
  if (availableDirs.length === 0) return { nextMovePos: position, direction };

  // Calculate distances for each available direction
  const directionScores = availableDirs.map(dir => {
    const nextPos = position + dir.movement;
    const distance = getManhattanDistance(nextPos, pacmanPos, gridSize);
    
    // Add small randomness to prevent predictable movement
    const randomFactor = Math.random() * 2;
    
    // When scared, prefer directions that increase distance from Pacman
    // But keep the same movement rate by not modifying ghost.speed
    const score = isScared ? 
      distance + randomFactor : // Higher score = further from Pacman when scared
      -distance + randomFactor; // Lower score = closer to Pacman when normal
    
    return { direction: dir, score, nextPos };
  });

  // Sort by score and get the best direction
  directionScores.sort((a, b) => b.score - a.score);
  const bestMove = directionScores[0];

  return {
    nextMovePos: bestMove.nextPos,
    direction: bestMove.direction
  };
}

class Ghost {
  constructor(speed = 5, startPos, pacmanPos, movement = calculateNextMove, name) {
    this.name = name;
    this.movement = movement;
    this.startPos = startPos;
    this.pos = startPos;
    this.dir = DIRECTIONS.ArrowRight;
    this.speed = speed;
    this.timer = 0;
    this.isScared = false;
    this.rotation = false;
    this.pacmanPos = pacmanPos;
    
    // Cache commonly used arrays
    this.classesToRemove = [OBJECT_TYPE.GHOST, OBJECT_TYPE.SCARED, this.name];
    this.classesToAdd = [OBJECT_TYPE.GHOST, this.name];
    this.scaredClassesToAdd = [OBJECT_TYPE.GHOST, OBJECT_TYPE.SCARED, this.name];
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
    return this.movement(
      this.pos,
      this.dir,
      objectExist,
      this.pacmanPos,
      this.isScared
    );
  }

  makeMove() {
    const classesToAdd = this.isScared ? this.scaredClassesToAdd : this.classesToAdd;
    return {
      classesToRemove: this.classesToRemove,
      classesToAdd
    };
  }

  setNewPos(nextMovePos, direction) {
    this.pos = nextMovePos;
    this.dir = direction;
  }

  updatePacmanPos(pacmanPos) {
    this.pacmanPos = pacmanPos;
  }

  resetPosition() {
    this.pos = this.startPos;
    this.dir = DIRECTIONS.ArrowRight;
    this.timer = 0;
    this.isScared = false;
  }
}

export { Ghost as default, calculateNextMove };