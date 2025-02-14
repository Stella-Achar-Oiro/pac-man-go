// pacman.js
import { DIRECTIONS, SPEED, GRID_SIZE, CELL_SIZE } from "./config.js";

export default class Pacman {
  constructor(parentElement) {
    this.position = 21 * GRID_SIZE + 14; // Starting position
    this.nextDirection = null;
    this.currentDirection = null;
    this.element = this.createPacmanElement(parentElement);
    this.moveTimer = 0;
    this.isTunneling = false; // New flag to track tunnel transition
  }

  createPacmanElement(parentElement) {
    const element = document.createElement("div");
    element.className = "pacman";
    element.innerHTML = `
            <svg viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="10" fill="yellow">
                    <animate attributeName="r" values="9;10;9" dur="0.5s" repeatCount="indefinite"/>
                </circle>
                <path id="mouth" fill="black" d="M10,10 L20,5 A10,10 0 0,1 20,15 Z">
                    <animate attributeName="d" 
                        values="M10,10 L20,5 A10,10 0 0,1 20,15 Z;M10,10 L10,10 A10,10 0 0,1 10,10 Z;M10,10 L20,5 A10,10 0 0,1 20,15 Z"
                        dur="0.5s"
                        repeatCount="indefinite"/>
                </path>
            </svg>
        `;
    parentElement.appendChild(element);
    return element;
  }

  handleInput(key) {
    if (DIRECTIONS[key]) {
      this.nextDirection = DIRECTIONS[key];
    }
  }

  update(deltaTime, board) {
    this.moveTimer += deltaTime;

    if (this.moveTimer >= SPEED.pacman) {
      this.moveTimer = 0;
      this.move(board);
    }

    this.updatePosition();
  }

  move(board) {
    let nextPos;
    let willMove = false;

    // Try to move in the next direction if one is queued
    if (this.nextDirection) {
        nextPos = this.getNextPosition(this.nextDirection);
        if (this.isValidMove(nextPos, board)) {
            this.currentDirection = this.nextDirection;
            this.nextDirection = null;
            willMove = true;
        }
    }

    // If can't move in next direction, try current direction
    if (!willMove && this.currentDirection) {
        nextPos = this.getNextPosition(this.currentDirection);
        if (this.isValidMove(nextPos, board)) {
            willMove = true;
        }
    }

    // Update position if movement is valid
    if (willMove) {
        // Special handling for tunnel
        const currentX = this.position % GRID_SIZE;
        const nextX = nextPos % GRID_SIZE;
        const currentY = Math.floor(this.position / GRID_SIZE);

        if (currentY === 14) { // Tunnel row
            if (currentX === 0 && this.currentDirection?.x === -1) {
                // Moving left through tunnel
                this.position = 14 * GRID_SIZE + (GRID_SIZE - 1);
                this.element.style.display = 'none';
                return;
            } else if (currentX === GRID_SIZE - 1 && this.currentDirection?.x === 1) {
                // Moving right through tunnel
                this.position = 14 * GRID_SIZE;
                this.element.style.display = 'none';
                return;
            }
        }

        this.position = nextPos;
        this.element.style.display = 'block';
    }
}

  isValidMove(position, board) {
    // Check if position is within grid bounds
    if (position < 0 || position >= GRID_SIZE * GRID_SIZE) {
      return false;
    }

    // Special case for tunnel
    const y = Math.floor(position / GRID_SIZE);
    const x = position % GRID_SIZE;
    if (y === 14 && (x === 0 || x === GRID_SIZE - 1)) {
      return true;
    }

    // Check for walls and ghost house
    return !board.isWall(position) && !board.isGhostHouse(position);
  }

  getNextPosition(direction) {
    const currentX = this.position % GRID_SIZE;
    const currentY = Math.floor(this.position / GRID_SIZE);
    let nextX = currentX + direction.x;
    let nextY = currentY + direction.y;

    // Handle tunnel wrapping
    if (nextY === 14) { // Tunnel row
      if (nextX < 0) {
        nextX = GRID_SIZE - 1;
      } else if (nextX >= GRID_SIZE) {
        nextX = 0;
      }
    }

    return nextY * GRID_SIZE + nextX;
  }

  updatePosition() {
    const x = (this.position % GRID_SIZE) * CELL_SIZE;
    const y = Math.floor(this.position / GRID_SIZE) * CELL_SIZE;
    const angle = this.currentDirection ? this.currentDirection.angle : 0;
    
    // Use transform3d for GPU acceleration
    if (this.element.style.display === 'none') {
        // Optimize display changes
        window.requestAnimationFrame(() => {
            this.element.style.display = 'block';
            this.element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`;
        });
    } else {
        this.element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`;
    }
}

  playDeathAnimation() {
    this.element.classList.add("dying");
    this.element.innerHTML = `
            <svg viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="10" fill="yellow">
                    <animate 
                        attributeName="r" 
                        values="10;9;8;7;6;5;4;3;2;1;0" 
                        dur="1s" 
                        fill="freeze"
                    />
                </circle>
            </svg>
        `;
  }

  reset() {
    this.position = 21 * GRID_SIZE + 14;
    this.nextDirection = null;
    this.currentDirection = null;
    this.moveTimer = 0;
    this.isTunneling = false;
    // Reset visual state
    this.element.classList.remove("dying");
    this.element.innerHTML = this.createPacmanSvg();
    this.updatePosition();
  }

  createPacmanSvg() {
    return `
            <svg viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="10" fill="yellow">
                    <animate attributeName="r" values="9;10;9" dur="0.5s" repeatCount="indefinite"/>
                </circle>
                <path id="mouth" fill="black" d="M10,10 L20,5 A10,10 0 0,1 20,15 Z">
                    <animate attributeName="d" 
                        values="M10,10 L20,5 A10,10 0 0,1 20,15 Z;M10,10 L10,10 A10,10 0 0,1 10,10 Z;M10,10 L20,5 A10,10 0 0,1 20,15 Z"
                        dur="0.5s"
                        repeatCount="indefinite"/>
                </path>
            </svg>
        `;
  }
}