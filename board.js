// board.js
import { GRID_SIZE, CELL_SIZE } from './config.js';

export default class Board {
    constructor(levelData, container) {
        this.grid = [];
        this.dotCount = 0;
        this.element = document.createElement('div');
        this.element.id = 'game-board';
        this.element.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${GRID_SIZE}, ${CELL_SIZE}px);
            gap: 0;
            background: black;
            padding: 0;
            border-radius: 8px;
            position: relative;
            border: 5px solid black;
        `;
        
        container.appendChild(this.element);
        this.loadLevel(levelData);
    }

    loadLevel(levelData) {
        this.element.innerHTML = '';
        this.grid = [...levelData];
        this.dotCount = 0;

        levelData.forEach((cell, index) => {
            const div = document.createElement('div');
            div.style.width = `${CELL_SIZE}px`;
            div.style.height = `${CELL_SIZE}px`;
            
            switch(cell) {
                case 0: // Wall
                    div.className = 'wall';
                    break;
                case 1: // Dot
                    div.className = 'dot';
                    this.dotCount++;
                    break;
                case 3: // Power Pill
                    div.className = 'power-pill';
                    break;
                case 4: // Ghost House
                    div.className = 'ghost-house';
                    break;
                default:
                    div.className = 'empty';
            }
            
            this.element.appendChild(div);
        });
    }

    isWall(position) {
        return this.grid[position] === 0;
    }

    isDot(position) {
        return this.grid[position] === 1;
    }

    isPowerPill(position) {
        return this.grid[position] === 3;
    }

    isGhostHouse(position) {
        return this.grid[position] === 4;
    }

    removeDot(position) {
        if (this.isDot(position)) {
            this.grid[position] = 2;
            this.element.children[position].className = 'empty';
            this.dotCount--;
        }
    }

    removePowerPill(position) {
        if (this.isPowerPill(position)) {
            this.grid[position] = 2;
            this.element.children[position].className = 'empty';
        }
    }

    getRemainingDots() {
        return this.dotCount;
    }

    getValidMoves(position) {
        const moves = [];
        const x = position % GRID_SIZE;
        const y = Math.floor(position / GRID_SIZE);

        // Check all four directions
        if (x > 0 && !this.isWall(position - 1)) moves.push(position - 1);
        if (x < GRID_SIZE - 1 && !this.isWall(position + 1)) moves.push(position + 1);
        if (y > 0 && !this.isWall(position - GRID_SIZE)) moves.push(position - GRID_SIZE);
        if (y < GRID_SIZE - 1 && !this.isWall(position + GRID_SIZE)) moves.push(position + GRID_SIZE);

        return moves;
    }
}