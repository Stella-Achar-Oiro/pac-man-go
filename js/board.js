// board.js
import { GRID_SIZE, CELL_SIZE, OBJECT_TYPE, CLASS_LIST, FRUITS } from './setup.js';

class Board {
    // Private fields
    #currentFruit = null;
    #totalDotsEaten = 0;
    #fruitTimer = null;
    #fruitPosition = null;
    #ghostPositions = new Map();

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

    createGrid(level) {
        this.dotCount = 0;
        this.grid = [];
        this.DOMGrid.innerHTML = '';
        
        // Set CSS Grid properties
        this.DOMGrid.style.setProperty('--grid-size', GRID_SIZE);
        this.DOMGrid.style.setProperty('--cell-size', `${CELL_SIZE}px`);
        this.DOMGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${GRID_SIZE}, ${CELL_SIZE}px);
            grid-template-rows: repeat(${GRID_SIZE}, ${CELL_SIZE}px);
            gap: 0;
        `;

        // Create grid squares
        level.forEach((square, index) => {
            const div = document.createElement('div');
            const squareType = CLASS_LIST[square];
            
            div.dataset.index = index;
            div.className = `square ${squareType}`;
            div.style.cssText = `width: ${CELL_SIZE}px; height: ${CELL_SIZE}px;`;
            
            this.fragment.appendChild(div);
            this.grid.push(div);
            
            if (squareType === OBJECT_TYPE.DOT) {
                this.dotCount++;
            }
        });

        this.DOMGrid.appendChild(this.fragment);
        console.log('Grid created with', this.dotCount, 'dots');
    }

    addObject(pos, classes) {
        if (this.isValidPosition(pos)) {
            const square = this.grid[pos];
            classes.forEach(className => {
                square.classList.add(className);
                
                // Track ghost positions
                if (className.includes('ghost')) {
                    this.#ghostPositions.set(className, pos);
                }
            });
            console.log(`Added ${classes.join(', ')} at position ${pos}`);
        }
    }

    removeObject(pos, classes) {
        if (this.isValidPosition(pos)) {
            const square = this.grid[pos];
            classes.forEach(className => {
                square.classList.remove(className);
                
                // Update ghost tracking
                if (className.includes('ghost')) {
                    this.#ghostPositions.delete(className);
                }
            });
            console.log(`Removed ${classes.join(', ')} from position ${pos}`);
        }
    }

    objectExist(pos, object) {
        return this.isValidPosition(pos) && this.grid[pos].classList.contains(object);
    }

    isValidPosition(pos) {
        return pos >= 0 && pos < this.grid.length;
    }

    rotateDiv(pos, deg) {
        if (this.isValidPosition(pos)) {
            this.grid[pos].style.transform = `rotate(${deg}deg)`;
        }
    }

    moveCharacter(character) {
        if (!character.shouldMove()) return;

        // Get next move
        const { nextMovePos, direction } = character.getNextMove(this.boundObjectExist);
        
        // Log movement attempt
        console.log(`${character.name || 'Pacman'} attempting move from ${character.pos} to ${nextMovePos}`);

        // Validate move
        if (!this.isValidPosition(nextMovePos)) {
            console.log(`Invalid position ${nextMovePos}, staying at ${character.pos}`);
            return;
        }

        // Check for collisions
        if (this.objectExist(nextMovePos, OBJECT_TYPE.WALL)) {
            console.log(`Wall collision detected at ${nextMovePos}`);
            return;
        }

        // Get classes to update
        const { classesToRemove, classesToAdd } = character.makeMove();

        // Only move if position is changing
        if (nextMovePos !== character.pos) {
            // Handle dots for ghosts
            if (character.name && this.grid[character.pos].hasAttribute('data-has-dot')) {
                this.addObject(character.pos, [OBJECT_TYPE.DOT]);
                this.grid[character.pos].removeAttribute('data-has-dot');
            }

            if (character.name && this.objectExist(nextMovePos, OBJECT_TYPE.DOT)) {
                this.grid[nextMovePos].setAttribute('data-has-dot', 'true');
                this.removeObject(nextMovePos, [OBJECT_TYPE.DOT]);
            }

            // Remove from current position
            this.removeObject(character.pos, classesToRemove);
            
            // Add to new position
            this.addObject(nextMovePos, classesToAdd);

            // Handle rotation
            if (character.rotation && direction) {
                this.rotateDiv(nextMovePos, direction.rotation);
                this.rotateDiv(character.pos, 0);
            }

            // Update character position
            character.setNewPos(nextMovePos, direction);
            
            console.log(`${character.name || 'Pacman'} moved to ${nextMovePos}`);
        } else {
            console.log(`${character.name || 'Pacman'} stayed at ${character.pos}`);
        }
    }

    spawnFruit(fruitType, score) {
        if (this.#currentFruit) {
            this.removeFruit();
        }

        this.#fruitPosition = 261; // Center position
        this.#currentFruit = { type: fruitType, score };
        
        this.addObject(this.#fruitPosition, [OBJECT_TYPE.FRUIT, fruitType]);
        console.log(`Spawned ${fruitType} at position ${this.#fruitPosition}`);

        this.#fruitTimer = setTimeout(() => this.removeFruit(), 10000);
    }

    removeFruit() {
        if (this.#currentFruit && this.#fruitPosition !== null) {
            this.removeObject(this.#fruitPosition, [OBJECT_TYPE.FRUIT, this.#currentFruit.type]);
            this.#currentFruit = null;
            this.#fruitPosition = null;
            clearTimeout(this.#fruitTimer);
            console.log('Fruit removed');
        }
    }

    incrementDotsEaten() {
        this.#totalDotsEaten++;
        console.log(`Dots eaten: ${this.#totalDotsEaten}`);
    }

    showGameStatus(gameWin) {
        this.gameStatusDiv.innerHTML = `${gameWin ? 'WIN!' : 'GAME OVER!'}`;
        this.DOMGrid.appendChild(this.gameStatusDiv);
    }

    static createGameBoard(DOMGrid, level) {
        const board = new this(DOMGrid);
        board.createGrid(level);
        return board;
    }

    resetGrid() {
        this.removeFruit();
        this.#totalDotsEaten = 0;
        this.#ghostPositions.clear();
        
        if (this.gameStatusDiv.parentNode) {
            this.gameStatusDiv.parentNode.removeChild(this.gameStatusDiv);
        }
        
        console.log('Grid reset');
    }

    getCurrentGridState() {
        return {
            dotCount: this.dotCount,
            totalDotsEaten: this.#totalDotsEaten,
            hasFruit: this.#currentFruit !== null,
            fruitPosition: this.#fruitPosition,
            ghostPositions: Object.fromEntries(this.#ghostPositions)
        };
    }

    cleanup() {
        if (this.#fruitTimer) {
            clearTimeout(this.#fruitTimer);
        }
        
        this.removeFruit();
        this.#ghostPositions.clear();
        this.grid = [];
        this.DOMGrid.innerHTML = '';
        
        console.log('Board cleaned up');
    }

    // Debug helper method
    printGridState() {
        console.log('Current Grid State:');
        console.log(`Dots remaining: ${this.dotCount}`);
        console.log(`Total dots eaten: ${this.#totalDotsEaten}`);
        console.log(`Ghost positions:`, Object.fromEntries(this.#ghostPositions));
        console.log(`Has fruit:`, this.#currentFruit !== null);
        if (this.#currentFruit) {
            console.log(`Fruit type: ${this.#currentFruit.type}`);
            console.log(`Fruit position: ${this.#fruitPosition}`);
        }
    }
}

export default Board;