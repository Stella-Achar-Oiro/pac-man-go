//board.js
import { GRID_SIZE, CELL_SIZE, OBJECT_TYPE, CLASS_LIST } from './setup.js';

// board.js - Optimized Board class
class Board {
  constructor(DOMGrid) {
    this.dotCount = 0;
    this.grid = [];
    this.DOMGrid = DOMGrid;
    // Pre-create reusable elements
    this.gameStatusDiv = document.createElement('div');
    this.gameStatusDiv.classList.add('game-status');
    // Create a document fragment for batch DOM operations
    this.fragment = document.createDocumentFragment();
    // Cache commonly used methods
    this.boundObjectExist = this.objectExist.bind(this);
  }

  showGameStatus(gameWin) {
    this.gameStatusDiv.innerHTML = `${gameWin ? 'WIN!' : 'GAME OVER!'}`;
    this.DOMGrid.appendChild(this.gameStatusDiv);
  }

  createGrid(level) {
    this.dotCount = 0;
    this.grid = [];
    this.DOMGrid.innerHTML = '';
    
    // Set grid template using CSS custom property for better performance
    this.DOMGrid.style.setProperty('--grid-size', GRID_SIZE);
    this.DOMGrid.style.setProperty('--cell-size', `${CELL_SIZE}px`);

    // Create squares using document fragment
    level.forEach((square) => {
      const div = document.createElement('div');
      const squareType = CLASS_LIST[square];
      div.className = `square ${squareType}`;
      div.style.cssText = `width: ${CELL_SIZE}px; height: ${CELL_SIZE}px;`;
      this.fragment.appendChild(div);
      this.grid.push(div);
      if (squareType === OBJECT_TYPE.DOT) this.dotCount++;
    });

    // Batch DOM update
    this.DOMGrid.appendChild(this.fragment);
  }

  // Optimized class manipulation methods
  addObject(pos, classes) {
    if (pos >= 0 && pos < this.grid.length) {
      this.grid[pos].classList.add(...classes);
    }
  }

  removeObject(pos, classes) {
    if (pos >= 0 && pos < this.grid.length) {
      this.grid[pos].classList.remove(...classes);
    }
  }

  objectExist(pos, object) {
    return pos >= 0 && pos < this.grid.length && this.grid[pos].classList.contains(object);
  }

  // Use CSS transform for better performance
  rotateDiv(pos, deg) {
    if (pos >= 0 && pos < this.grid.length) {
      this.grid[pos].style.transform = `rotate(${deg}deg)`;
    }
  }

  moveCharacter(character) {
    if (!character.shouldMove()) return;

    const { nextMovePos, direction } = character.getNextMove(this.boundObjectExist);
    const { classesToRemove, classesToAdd } = character.makeMove();

    if (character.rotation && nextMovePos !== character.pos && direction) {
      this.rotateDiv(nextMovePos, direction.rotation);
      this.rotateDiv(character.pos, 0);
    }

    this.removeObject(character.pos, classesToRemove);
    this.addObject(nextMovePos, classesToAdd);
    character.setNewPos(nextMovePos, direction);
  }

  static createGameBoard(DOMGrid, level) {
    const board = new this(DOMGrid);
    board.createGrid(level);
    return board;
  }
}

export default Board;