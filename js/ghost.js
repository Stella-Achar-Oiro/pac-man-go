import { DIRECTIONS, OBJECT_TYPE } from './setup.js';

// Random movement function
function randomMovement(position, direction, objectExist) {
  let dir = direction;
  let nextMovePos = position + dir.movement;

  // Create an array from the directions object keys
  const keys = Object.keys(DIRECTIONS);

  while (
    objectExist(nextMovePos, OBJECT_TYPE.WALL) ||
    objectExist(nextMovePos, OBJECT_TYPE.GHOST)
  ) {
    // Get a random key from that array
    const key = keys[Math.floor(Math.random() * keys.length)];
    // Set the new direction
    dir = DIRECTIONS[key];
    // Set the next move
    nextMovePos = position + dir.movement;
  }

  return { nextMovePos, direction: dir };
}

class Ghost {
  constructor(speed = 5, startPos, movement = randomMovement, name) {
    this.name = name;
    this.movement = movement;
    this.startPos = startPos;
    this.pos = startPos;
    this.dir = DIRECTIONS.ArrowRight;
    this.speed = speed;
    this.timer = 0;
    this.isScared = false;
    this.rotation = false;
    this.baseSpeed = speed; // Store the original speed
  }

  shouldMove() {
    // Slower movement when scared
    const currentSpeed = this.isScared ? this.baseSpeed * 2 : this.baseSpeed;
    
    if (this.timer === currentSpeed) {
      this.timer = 0;
      return true;
    }
    this.timer++;
    return false;
  }

  getNextMove(objectExist) {
    const { nextMovePos, direction } = this.movement(
      this.pos,
      this.dir,
      objectExist
    );

    // Only allow movement to valid positions
    if (objectExist(nextMovePos, OBJECT_TYPE.WALL) || 
        objectExist(nextMovePos, OBJECT_TYPE.GHOST)) {
      return { nextMovePos: this.pos, direction: this.dir };
    }

    return { nextMovePos, direction };
  }

  makeMove() {
    const classesToRemove = [OBJECT_TYPE.GHOST, OBJECT_TYPE.SCARED, this.name];
    let classesToAdd = [OBJECT_TYPE.GHOST, this.name];

    if (this.isScared) {
      classesToAdd = [...classesToAdd, OBJECT_TYPE.SCARED];
    }

    return { classesToRemove, classesToAdd };
  }

  setNewPos(nextMovePos, direction) {
    this.pos = nextMovePos;
    this.dir = direction;
  }
}

export { Ghost as default, randomMovement };