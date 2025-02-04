import { OBJECT_TYPE, DIRECTIONS } from './setup.js';

class Pacman {
  constructor(speed, startPos) {
    this.pos = startPos;
    this.speed = speed;
    this.dir = null;
    this.timer = 0;
    this.powerPill = false;
    this.rotation = true;
    this.requestedDir = null; // Store the next requested direction
    this.keyPressed = false;
  }

  shouldMove() {
    // Don't move if no direction is set
    if (this.dir === null) return false;
    
    if (this.timer === this.speed) {
      this.timer = 0;
      return true;
    }
    this.timer++;
    return false;
  }

  getNextMove(objectExist) {
    // If no direction is set, stay in current position
    if (this.dir === null) {
      return { nextMovePos: this.pos, direction: this.dir };
    }

    let nextMovePos = this.pos + this.dir.movement;

    // First try the requested direction if it exists
    if (this.requestedDir !== null) {
      const requestedNextMovePos = this.pos + this.requestedDir.movement;
      if (!objectExist(requestedNextMovePos, OBJECT_TYPE.WALL)) {
        this.dir = this.requestedDir;
        this.requestedDir = null;
        nextMovePos = requestedNextMovePos;
      }
    }

    // Check if next move is possible, if not stay in current position
    if (objectExist(nextMovePos, OBJECT_TYPE.WALL)) {
      nextMovePos = this.pos;
    }

    return { nextMovePos, direction: this.dir };
  }

  makeMove() {
    const classesToRemove = [OBJECT_TYPE.PACMAN];
    const classesToAdd = [OBJECT_TYPE.PACMAN];

    return { classesToRemove, classesToAdd };
  }

  setNewPos(nextMovePos) {
    this.pos = nextMovePos;
  }

  handleKeyInput = (e, objectExist) => {
    let dir;

    if (e.keyCode >= 37 && e.keyCode <= 40) {
      dir = DIRECTIONS[e.key];
    } else {
      return;
    }

    // Store the requested direction
    if (this.dir === null) {
      // If Pacman is not moving, try to move immediately
      const nextMovePos = this.pos + dir.movement;
      if (!objectExist(nextMovePos, OBJECT_TYPE.WALL)) {
        this.dir = dir;
      }
    } else {
      // Store the requested direction for the next move
      this.requestedDir = dir;
    }
  };
}

export default Pacman;