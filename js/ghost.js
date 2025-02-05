//ghost.js
import { DIRECTIONS, OBJECT_TYPE } from './setup.js';

// ghost.js - Optimized Ghost movement
function randomMovement(position, direction, objectExist) {
  const dirs = Object.values(DIRECTIONS);
  let nextMovePos;
  let dir = direction;
  let attempts = 0;
  
  do {
    dir = dirs[Math.floor(Math.random() * dirs.length)];
    nextMovePos = position + dir.movement;
    attempts++;
    // Prevent infinite loops
    if (attempts > 10) return { nextMovePos: position, direction };
  } while (
    objectExist(nextMovePos, OBJECT_TYPE.WALL) ||
    objectExist(nextMovePos, OBJECT_TYPE.GHOST)
  );

  return { nextMovePos, direction: dir };
}

class Ghost {
  constructor(speed = 5, startPos, movement = randomMovement, name) {
    this.name = name;
    this.movement = movement;
    this.startPos = startPos;
    this.pos = startPos;
    this.dir = DIRECTIONS.ArrowRight;
    this.baseSpeed = speed;
    this.speed = speed;
    this.timer = 0;
    this.isScared = false;
    this.rotation = false;
    // Cache commonly used arrays
    this.classesToRemove = [OBJECT_TYPE.GHOST, OBJECT_TYPE.SCARED, this.name];
    this.classesToAdd = [OBJECT_TYPE.GHOST, this.name];
    this.scaredClassesToAdd = [...this.classesToAdd, OBJECT_TYPE.SCARED];
  }

  shouldMove() {
    const currentSpeed = this.isScared ? this.baseSpeed * 2 : this.baseSpeed;
    if (this.timer === currentSpeed) {
      this.timer = 0;
      return true;
    }
    this.timer++;
    return false;
  }

  getNextMove(objectExist) {
    const { nextMovePos, direction } = this.movement(this.pos, this.dir, objectExist);
    return {
      nextMovePos: objectExist(nextMovePos, OBJECT_TYPE.WALL) || 
                   objectExist(nextMovePos, OBJECT_TYPE.GHOST) ? 
                   this.pos : nextMovePos,
      direction: direction || this.dir
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
}

export { Ghost as default, randomMovement };