// board.js
import { GRID_SIZE, CELL_SIZE, OBJECT_TYPE, CLASS_LIST, FRUITS } from './setup.js';

class Board {
    // Private fields
    #currentFruit = null;
    #totalDotsEaten = 0;
    #fruitTimer = null;
    #fruitPosition = null;

    constructor(DOMGrid) {
        this.dotCount = 0;
        this.grid = [];
        this.DOMGrid = DOMGrid;
        this.gameStatusDiv = document.createElement('div');
        this.gameStatusDiv.classList.add('game-status');
        this.fragment = document.createDocumentFragment();
        this.boundObjectExist = this.objectExist.bind(this);
    }

    // Getters for private fields
    get currentFruit() {
        return this.#currentFruit;
    }

    get totalDotsEaten() {
        return this.#totalDotsEaten;
    }

    get fruitPosition() {
        return this.#fruitPosition;
    }

    // Fruit management methods
    spawnFruit(fruitType, score) {
        // Clear any existing fruit
        if (this.#currentFruit) {
            this.removeFruit();
        }

        // Place fruit in the center of the maze
        this.#fruitPosition = 261; // Center position
        this.#currentFruit = { type: fruitType, score };
        
        // Add fruit to the board
        this.addObject(this.#fruitPosition, [OBJECT_TYPE.FRUIT, fruitType]);

        // Set timer to remove fruit after 10 seconds
        this.#fruitTimer = setTimeout(() => this.removeFruit(), 10000);
    }

    removeFruit() {
        if (this.#currentFruit && this.#fruitPosition !== null) {
            this.removeObject(this.#fruitPosition, [OBJECT_TYPE.FRUIT, this.#currentFruit.type]);
            this.#currentFruit = null;
            this.#fruitPosition = null;
            clearTimeout(this.#fruitTimer);
        }
    }

    incrementDotsEaten() {
        this.#totalDotsEaten++;
    }

    showGameStatus(gameWin) {
        this.gameStatusDiv.innerHTML = `${gameWin ? 'WIN!' : 'GAME OVER!'}`;
        this.DOMGrid.appendChild(this.gameStatusDiv);
    }

    createGrid(level) {
        this.dotCount = 0;
        this.grid = [];
        this.DOMGrid.innerHTML = '';
        this.DOMGrid.style.setProperty('--grid-size', GRID_SIZE);
        this.DOMGrid.style.setProperty('--cell-size', `${CELL_SIZE}px`);

        level.forEach((square) => {
            const div = document.createElement('div');
            const squareType = CLASS_LIST[square];
            div.className = `square ${squareType}`;
            div.style.cssText = `width: ${CELL_SIZE}px; height: ${CELL_SIZE}px;`;
            this.fragment.appendChild(div);
            this.grid.push(div);
            if (squareType === OBJECT_TYPE.DOT) this.dotCount++;
        });

        this.DOMGrid.appendChild(this.fragment);
    }

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

    rotateDiv(pos, deg) {
        if (pos >= 0 && pos < this.grid.length) {
            this.grid[pos].style.transform = `rotate(${deg}deg)`;
        }
    }

    moveCharacter(character) {
        if (!character.shouldMove()) return;

        const { nextMovePos, direction } = character.getNextMove(this.boundObjectExist);
        const { classesToRemove, classesToAdd } = character.makeMove();

        // Handle ghost movement
        if (character.name) { // This is a ghost
            // Check if moving onto a dot
            if (this.objectExist(nextMovePos, OBJECT_TYPE.DOT)) {
                this.grid[nextMovePos].setAttribute('data-has-dot', 'true');
                this.removeObject(nextMovePos, [OBJECT_TYPE.DOT]);
            }

            // Check if leaving a dot
            if (this.grid[character.pos].hasAttribute('data-has-dot')) {
                this.addObject(character.pos, [OBJECT_TYPE.DOT]);
                this.grid[character.pos].removeAttribute('data-has-dot');
            }
        }

        // Handle rotation
        if (character.rotation && nextMovePos !== character.pos && direction) {
            this.rotateDiv(nextMovePos, direction.rotation);
            this.rotateDiv(character.pos, 0);
        }

        // Move character
        this.removeObject(character.pos, classesToRemove);
        this.addObject(nextMovePos, classesToAdd);
        
        character.setNewPos(nextMovePos, direction);
    }

    static createGameBoard(DOMGrid, level) {
        const board = new this(DOMGrid);
        board.createGrid(level);
        return board;
    }

    getDotCount() {
        return this.dotCount;
    }

    resetGrid() {
        // Clear all existing fruits
        this.removeFruit();
        
        // Reset dot count tracking
        this.#totalDotsEaten = 0;
        
        // Clear any existing game status
        if (this.gameStatusDiv.parentNode) {
            this.gameStatusDiv.parentNode.removeChild(this.gameStatusDiv);
        }
    }

    getCurrentGridState() {
        return {
            dotCount: this.dotCount,
            totalDotsEaten: this.#totalDotsEaten,
            hasFruit: this.#currentFruit !== null,
            fruitPosition: this.#fruitPosition
        };
    }

    cleanup() {
        // Clear any running timers
        if (this.#fruitTimer) {
            clearTimeout(this.#fruitTimer);
        }
        
        // Remove any existing fruits
        this.removeFruit();
        
        // Clear grid
        this.grid = [];
        this.DOMGrid.innerHTML = '';
    }
}

export default Board;