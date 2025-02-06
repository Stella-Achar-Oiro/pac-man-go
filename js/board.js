import { GRID_SIZE, CELL_SIZE, OBJECT_TYPE, CLASS_LIST } from './setup.js';

class Board {
    constructor(DOMGrid) {
        this.dotCount = 0;
        this.grid = [];
        this.DOMGrid = DOMGrid;
        this.gameStatusDiv = document.createElement('div');
        this.gameStatusDiv.classList.add('game-status');
        this.fragment = document.createDocumentFragment();
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
        } else { // This is Pacman
            if (this.objectExist(nextMovePos, OBJECT_TYPE.DOT)) {
                this.removeObject(nextMovePos, [OBJECT_TYPE.DOT]);
                this.dotCount--;
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
}

export default Board;