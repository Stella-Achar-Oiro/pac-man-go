import { GRID_SIZE, CELL_SIZE, GHOST_COLORS, DIRECTIONS, SPEEDS, POWER_PELLET_DURATION, POINTS } from './constants.js';
import AudioManager from './AudioManager.js';

class Game {
    constructor() {
        this.board = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.timerElement = document.getElementById('timer');
        this.pauseMenu = document.getElementById('pause-menu');
        this.startScreen = document.getElementById('start-screen');
        this.gameContent = document.getElementById('game-content');
        
        this.score = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.lastTime = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.powerPelletActive = false;
        this.powerPelletTimer = null;
        this.isGameStarted = false;
        
        this.pacman = { x: 13, y: 23, direction: 'right' };
        this.ghosts = [
            { x: 13, y: 11, direction: 'up', color: GHOST_COLORS.BLINKY, state: 'normal' },
            { x: 14, y: 11, direction: 'up', color: GHOST_COLORS.PINKY, state: 'normal' },
            { x: 11, y: 11, direction: 'up', color: GHOST_COLORS.INKY, state: 'normal' },
            { x: 16, y: 11, direction: 'up', color: GHOST_COLORS.CLYDE, state: 'normal' }
        ];
        
        this.keys = {};
        this.soundManager = new AudioManager();
        this.setupEventListeners();
        this.createBoard();
    }

    setupEventListeners() {
        // Start button listener
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });

        // Only set up game controls after game starts
        window.addEventListener('keydown', (e) => {
            if (!this.isGameStarted) return;
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) {
                this.keys[e.key] = true;
                if (e.key === 'Escape') this.togglePause();
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (!this.isGameStarted) return;
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.keys[e.key] = false;
            }
        });

        document.getElementById('continue').addEventListener('click', () => this.togglePause());
        document.getElementById('restart').addEventListener('click', () => this.restartGame());
    }

    createBoard() {
        this.board.style.gridTemplateColumns = `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`;
        this.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('empty'));
        
        // Initialize board with walls, dots, and power pellets
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                
                if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) {
                    cell.classList.add('wall');
                    this.grid[y][x] = 'wall';
                } else if ((x === 1 && y === 1) || 
                         (x === GRID_SIZE - 2 && y === 1) ||
                         (x === 1 && y === GRID_SIZE - 2) ||
                         (x === GRID_SIZE - 2 && y === GRID_SIZE - 2)) {
                    const powerPellet = document.createElement('div');
                    powerPellet.classList.add('dot', 'power-pellet');
                    cell.appendChild(powerPellet);
                    this.grid[y][x] = 'power-pellet';
                } else {
                    const dot = document.createElement('div');
                    dot.classList.add('dot');
                    cell.appendChild(dot);
                    this.grid[y][x] = 'dot';
                }
                
                this.board.appendChild(cell);
            }
        }
    }

    updatePacman(deltaTime) {
        const speed = SPEEDS.PACMAN * deltaTime;
        let newX = this.pacman.x;
        let newY = this.pacman.y;
        let newDirection = this.pacman.direction;

        if (this.keys['ArrowLeft']) {
            newX -= speed;
            newDirection = 'left';
        }
        if (this.keys['ArrowRight']) {
            newX += speed;
            newDirection = 'right';
        }
        if (this.keys['ArrowUp']) {
            newY -= speed;
            newDirection = 'up';
        }
        if (this.keys['ArrowDown']) {
            newY += speed;
            newDirection = 'down';
        }

        // Collision detection and movement
        if (!this.checkCollision(Math.round(newX), Math.round(newY))) {
            this.pacman.x = newX;
            this.pacman.y = newY;
            this.pacman.direction = newDirection;
        }

        // Check for dot collection
        const gridX = Math.round(this.pacman.x);
        const gridY = Math.round(this.pacman.y);
        if (this.grid[gridY][gridX] === 'dot') {
            this.collectDot(gridX, gridY);
        } else if (this.grid[gridY][gridX] === 'power-pellet') {
            this.collectPowerPellet(gridX, gridY);
        }

        // Update visual position and rotation
        const pacmanElement = document.querySelector('.pacman') || document.createElement('div');
        pacmanElement.className = 'pacman';
        pacmanElement.style.backgroundColor = 'var(--pacman-color)';
        
        const rotation = {
            'left': 180,
            'up': 270,
            'down': 90,
            'right': 0
        }[this.pacman.direction];

        pacmanElement.style.transform = `translate(${this.pacman.x * CELL_SIZE}px, ${this.pacman.y * CELL_SIZE}px) rotate(${rotation}deg)`;
        
        if (!pacmanElement.parentElement) this.board.appendChild(pacmanElement);
    }

    updateGhosts(deltaTime) {
        this.ghosts.forEach((ghost, index) => {
            const speed = (ghost.state === 'frightened' ? SPEEDS.GHOST_FRIGHTENED : SPEEDS.GHOST_NORMAL) * deltaTime;
            
            // Ghost AI based on state
            if (ghost.state === 'frightened') {
                // Run away from Pacman
                const dx = this.pacman.x - ghost.x;
                const dy = this.pacman.y - ghost.y;
                ghost.x -= Math.sign(dx) * speed;
                ghost.y -= Math.sign(dy) * speed;
            } else {
                // Chase Pacman with some randomness
                const dx = this.pacman.x - ghost.x;
                const dy = this.pacman.y - ghost.y;
                if (Math.random() < 0.95) { // 95% chance to chase
                    if (Math.abs(dx) > Math.abs(dy)) {
                        ghost.x += Math.sign(dx) * speed;
                    } else {
                        ghost.y += Math.sign(dy) * speed;
                    }
                } else { // 5% chance to move randomly
                    const directions = Object.values(DIRECTIONS);
                    const randomDir = directions[Math.floor(Math.random() * directions.length)];
                    ghost.x += randomDir.x * speed;
                    ghost.y += randomDir.y * speed;
                }
            }

            // Update ghost visual
            const ghostElement = document.querySelector(`.ghost-${index}`) || document.createElement('div');
            ghostElement.className = `ghost ghost-${index} ${ghost.state === 'frightened' ? 'frightened' : ''}`;
            ghostElement.style.backgroundColor = ghost.state === 'frightened' ? 'var(--frightened-color)' : ghost.color;
            ghostElement.style.transform = `translate(${ghost.x * CELL_SIZE}px, ${ghost.y * CELL_SIZE}px)`;
            
            if (!ghostElement.parentElement) this.board.appendChild(ghostElement);

            // Check collision with Pacman
            if (this.checkGhostCollision(ghost)) {
                if (ghost.state === 'frightened') {
                    this.eatGhost(ghost);
                } else {
                    this.handleGhostCollision();
                }
            }
        });
    }

    collectDot(x, y) {
        const cell = this.board.children[y * GRID_SIZE + x];
        const dot = cell.querySelector('.dot');
        if (dot) {
            cell.removeChild(dot);
            this.grid[y][x] = 'empty';
            this.score += POINTS.DOT;
            this.soundManager.play('eat_dot');
        }
    }

    collectPowerPellet(x, y) {
        this.collectDot(x, y); // Remove the power pellet
        this.score += POINTS.POWER_PELLET;
        this.activatePowerPellet();
        this.soundManager.play('power_pellet');
    }

    activatePowerPellet() {
        this.powerPelletActive = true;
        this.ghosts.forEach(ghost => ghost.state = 'frightened');
        
        if (this.powerPelletTimer) clearTimeout(this.powerPelletTimer);
        
        this.powerPelletTimer = setTimeout(() => {
            this.powerPelletActive = false;
            this.ghosts.forEach(ghost => ghost.state = 'normal');
        }, POWER_PELLET_DURATION);
    }

    eatGhost(ghost) {
        ghost.state = 'normal';
        this.score += POINTS.GHOST;
        this.soundManager.play('eat_ghost');
        this.resetGhostPosition(ghost);
    }

    resetGhostPosition(ghost) {
        ghost.x = 13 + Math.random() * 3 - 1.5;
        ghost.y = 11;
    }

    checkCollision(x, y) {
        return this.grid[Math.floor(y)][Math.floor(x)] === 'wall';
    }

    checkGhostCollision(ghost) {
        const distance = Math.hypot(ghost.x - this.pacman.x, ghost.y - this.pacman.y);
        return distance < 0.8;
    }

    handleGhostCollision() {
        this.lives--;
        this.livesElement.textContent = this.lives;
        this.soundManager.play('death');
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetPositions();
        }
    }

    resetPositions() {
        this.pacman = { x: 13, y: 23, direction: 'right' };
        this.ghosts.forEach(ghost => {
            ghost.state = 'normal';
            this.resetGhostPosition(ghost);
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseMenu.classList.toggle('hidden');
        if (!this.isPaused) {
            this.lastTime = performance.now();
            this.soundManager.play('siren');
        } else {
            this.soundManager.stop('siren');
        }
    }

    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.isGameOver = false;
        this.powerPelletActive = false;
        if (this.powerPelletTimer) clearTimeout(this.powerPelletTimer);
        this.resetPositions();
        this.updateHUD();
        this.soundManager.stopAll();
        this.board.innerHTML = '';
        this.createBoard();
        this.togglePause();
    }

    gameOver() {
        this.isGameOver = true;
        this.soundManager.stopAll();
        this.pauseMenu.querySelector('h2').textContent = 'GAME OVER';
        this.togglePause();
    }

    updateHUD() {
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
        this.timerElement.textContent = Math.floor(this.gameTime / 1000);
    }

    startGame() {
        this.isGameStarted = true;
        this.startScreen.classList.add('hidden');
        this.gameContent.classList.remove('hidden');
        this.lastTime = performance.now();
        this.soundManager.play('start');
        setTimeout(() => {
            if (this.isGameStarted && !this.isPaused) {
                this.soundManager.play('siren');
            }
        }, 4000);
        this.gameLoop();
    }

    gameLoop(currentTime = 0) {
        if (!this.isGameStarted) return;
        
        if (!this.isPaused) {
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            if (!this.isGameOver) {
                this.gameTime += deltaTime * 1000;
                this.updatePacman(deltaTime);
                this.updateGhosts(deltaTime);
                this.updateHUD();
            }
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 