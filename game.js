// game.js
import { GRID_SIZE, CELL_SIZE, GAME_STATES, SCORE, LEVEL_1, SPEED, GHOST_POINTS, FRUITS, FRUIT_RULES } from './config.js';
import Board from './board.js';
import Pacman from './pacman.js';
import GhostManager from './ghostManager.js';

const FRAME_RATE = 60;
const FRAME_TIME = 1000 / FRAME_RATE;
const MAX_FRAME_TIME = FRAME_TIME * 3; // Prevent spiral of death

export default class Game {
    constructor() {
        this.boardContainer = document.getElementById('game-board-container');
        this.boardContainer.innerHTML = '';

        this.state = GAME_STATES.READY;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.currentFPS = 60;
        this.pausedTime = 0;
        this.dotsEaten = 0;
        this.fruitSpawned = 0;  // Track how many fruits spawned this level
        this.activeFruit = null;
        this.fruitTimer = null;

        this.frameTimes = new Array(60).fill(FRAME_TIME);
        this.frameTimeIndex = 0;

        this.initializeUI();
        this.initializeGame();
        this.showReadyScreen();

        this.ghostsEatenInFright = 0;  // Track ghosts eaten during power mode
        
        // Add level-specific speeds
        this.levelSpeeds = {
            pacman: SPEED.pacman,
            ghost: SPEED.ghost,
            frightened: SPEED.frightened
        };

        this.elapsedTime = 0;

        this.handleKeydown = this.handleKeydown.bind(this);
        this.start = this.start.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        
        document.addEventListener('keydown', this.handleKeydown);

    }

    initializeGame() {
        this.board = new Board(LEVEL_1, this.boardContainer);
        this.pacman = new Pacman(this.board.element);
        this.ghostManager = new GhostManager(this.pacman, this.board.element);

        // Ensure proper initial positions
        this.resetPositions();
    }

    resetPositions() {
        // Reset Pacman to starting position and update display
        this.pacman.reset();
        this.pacman.updatePosition();

        // Reset all ghosts to their house positions and update display
        this.ghostManager.resetAll();
    }


    initializeUI() {
        this.gameStats = document.createElement('div');
        this.gameStats.id = 'game-stats';
        
        this.scoreElement = document.createElement('div');
        this.scoreElement.id = 'score';
        this.scoreElement.textContent = `Score: ${this.score}`;
        
        this.livesElement = document.createElement('div');
        this.livesElement.id = 'lives';
        this.livesElement.textContent = `Lives: ${this.lives}`;
        
        this.levelElement = document.createElement('div');
        this.levelElement.id = 'level';
        this.levelElement.textContent = `Level: ${this.level}`;

        this.timerElement = document.createElement('div');
        this.timerElement.id = 'timer';
        this.timerElement.textContent = 'Time: 00:00';

        this.gameStats.appendChild(this.scoreElement);
        this.gameStats.appendChild(this.livesElement);
        //this.gameStats.appendChild(this.levelElement);
        this.gameStats.appendChild(this.timerElement);
        
        this.boardContainer.before(this.gameStats);
    }

    handleKeydown(event) {
        // Prevent default behavior for game controls
        if (['Enter', ' ', 'Escape', 'p', 'P'].includes(event.key)) {
            event.preventDefault();
        }
    
        // Debug log to check key presses
        console.log('Key pressed:', event.key);
    
        if (this.state === GAME_STATES.READY) {
            if (event.key === 'Enter' || event.key === ' ') {
                const readyScreen = document.querySelector('.game-over');
                if (readyScreen) {
                    readyScreen.remove();
                }
                this.start();
                return;
            }
        }
    
        if (event.key === 'Escape' || event.key === 'p' || event.key === 'P') {
            this.togglePause();
            return;
        }
    
        if (this.state === GAME_STATES.PAUSED) {
            if (event.key === 'Enter' || event.key === ' ') {
                this.togglePause();
                return;
            }
        }
    
        if ((this.state === GAME_STATES.GAME_OVER || this.state === GAME_STATES.WIN) && 
            (event.key === 'Enter' || event.key === ' ')) {
            this.restart();
            return;
        }
    
        // Handle movement controls during gameplay
        if (this.state === GAME_STATES.PLAYING) {
            this.pacman.handleInput(event.key);
        }
    }
    
    checkGameConditions() {
        if (this.board.getRemainingDots() === 0) {
            this.state = GAME_STATES.WIN;
            this.showWinMenu();
        }
    }

    showWinMenu() {
        const winMenu = document.createElement('div');
        winMenu.className = 'game-over';
        winMenu.innerHTML = `
            <h2>You Win!</h2>
            <p>Final Score: ${this.score}</p>
            <button id="restart-button">Play Again</button>
        `;
        this.boardContainer.appendChild(winMenu);
        
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restart();
        });
    }

    restart() {
        this.hidePauseMenu();
        const gameOverMenu = document.querySelector('.game-over');
        if (gameOverMenu) {
            gameOverMenu.remove();
        }

        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.elapsedTime = 0;
        
        this.boardContainer.innerHTML = '';
        this.initializeGame();
        this.updateUI();
        
        this.state = GAME_STATES.PLAYING;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }

    start() {
        console.log('Starting game sequence...');
        
        // Hide any existing game over or ready screens
        const existingScreens = document.querySelectorAll('.game-over');
        existingScreens.forEach(screen => screen.remove());
    
        // Create and show the "READY!" text
        const readyText = document.createElement('div');
        readyText.className = 'ready-text';
        readyText.innerHTML = 'READY!';
        readyText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: yellow;
            font-size: 24px;
            font-family: 'Press Start 2P', cursive;
            z-index: 1000;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            animation: blink 1s infinite;
        `;
        this.boardContainer.appendChild(readyText);

        // Make sure characters are in correct positions before starting
        this.resetPositions();
    
        // Initialize game state but don't start movement yet
        this.state = GAME_STATES.READY;
        this.lastTime = performance.now();
    
        // Set a timer for the ready sequence
        setTimeout(() => {
            readyText.remove();
            this.state = GAME_STATES.PLAYING;
            requestAnimationFrame(this.gameLoop);
        }, 2000); // 2 second delay
    }

    togglePause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
            this.showPauseMenu();
            this.pausedTime = 0;  // Reset pause animation timer
        } else if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            this.hidePauseMenu();
            this.lastTime = performance.now();  // Reset timing to prevent large delta
            this.accumulatedTime = 0;  // Reset accumulated time
        }
    }


    showPauseMenu() {
        this.hidePauseMenu();

        this.pauseMenu = document.createElement('div');
        this.pauseMenu.className = 'game-over';
        this.pauseMenu.style.transition = 'opacity 0.3s';  // Smooth opacity transitions
        this.pauseMenu.innerHTML = `
            <h2>Game Paused</h2>
            <p>Current Score: ${this.score}</p>
            <button id="continue-button">Continue</button>
            <button id="restart-button">Restart</button>
        `;
        
        this.boardContainer.appendChild(this.pauseMenu);
        
        document.getElementById('continue-button').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restart();
        });
    }

    hidePauseMenu() {
        if (this.pauseMenu && this.pauseMenu.parentNode) {
            this.pauseMenu.remove();
            this.pauseMenu = null;
        }
    }

    showReadyScreen() {
        this.state = GAME_STATES.READY;
        const readyScreen = document.createElement('div');
        readyScreen.className = 'game-over';
        readyScreen.innerHTML = `
            <h2>Welcome to Pac-Man!</h2>
            <p>Controls:</p>
            <div style="text-align: left; margin: 10px auto; display: inline-block;">
                <p>• Arrow Keys or WASD to move</p>
                <p>• P or ESC to pause</p>
                <p>• Press SPACE or ENTER to start</p>
            </div>
            <button id="start-button" class="start-button">Start Game</button>
        `;
        
        this.boardContainer.appendChild(readyScreen);
        
        const startButton = document.getElementById('start-button');
        startButton.addEventListener('click', () => {
            this.start();
        });
    }
    

    gameLoop(currentTime) {
        // Calculate delta time
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Prevent spiral of death
        if (deltaTime > MAX_FRAME_TIME) {
            deltaTime = FRAME_TIME;
        }

        // Track frame times for monitoring
        this.frameTimes[this.frameTimeIndex] = deltaTime;
        this.frameTimeIndex = (this.frameTimeIndex + 1) % this.frameTimes.length;

        // Calculate average FPS
        this.frameCount++;
        if (currentTime - this.lastFPSUpdate >= 1000) {
            const avgFrameTime = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
            this.currentFPS = Math.round(1000 / avgFrameTime);
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
            console.log(`Current FPS: ${this.currentFPS}`);
        }

        if (this.state === GAME_STATES.PLAYING) {
            // Fixed time step accumulator
            this.accumulatedTime += deltaTime;

            // Update game state in fixed time steps
            let numUpdateSteps = 0;
            while (this.accumulatedTime >= FRAME_TIME && numUpdateSteps < 240) {
                this.update(FRAME_TIME);
                this.accumulatedTime -= FRAME_TIME;
                numUpdateSteps++;
            }

            // If we're falling behind, just drop frames
            if (numUpdateSteps >= 240) {
                this.accumulatedTime = 0;
            }

            this.checkGameConditions();
        } else if (this.state === GAME_STATES.PAUSED) {
            this.updatePausedState(deltaTime);
        }

        // Request next frame using optimal timing
        if (window.requestAnimationFrame) {
            this.animationFrameId = requestAnimationFrame(this.gameLoop);
        } else {
            // Fallback for older browsers
            this.animationFrameId = setTimeout(() => {
                this.gameLoop(performance.now());
            }, FRAME_TIME);
        }
    }

    updatePausedState(deltaTime) {
        // You can add paused state animations here
        // For example, pulsing effects, rotating elements, etc.
        this.pausedTime += deltaTime;
        
        // Example: Make the pause menu pulse
        if (this.pauseMenu) {
            const opacity = 0.8 + Math.sin(this.pausedTime / 500) * 0.2;
            this.pauseMenu.style.opacity = opacity;
        }
    }

    update(deltaTime) {
        // Use fixed time step for all updates
        const fixedDelta = FRAME_TIME;
        
        // Update game entities
        this.pacman.update(fixedDelta, this.board);
        this.ghostManager.update(fixedDelta, this.board);
        this.checkCollisions();
        this.updateUI();

        // Update time
        this.elapsedTime += fixedDelta;
    }

    getCurrentFruit() {
        const fruits = Object.values(FRUITS);
        return fruits[Math.min(this.level - 1, fruits.length - 1)];
    }

    spawnFruit() {
        if (this.fruitSpawned >= 2) return; // Max 2 fruits per level
        
        const fruit = this.getCurrentFruit();
        this.activeFruit = {
            position: FRUIT_RULES.POSITION,
            type: fruit
        };

        // Create fruit element
        const fruitElement = document.createElement('div');
        fruitElement.className = 'fruit';
        fruitElement.innerHTML = fruit.symbol;
        fruitElement.style.gridArea = `${Math.floor(FRUIT_RULES.POSITION / GRID_SIZE) + 1} / ${(FRUIT_RULES.POSITION % GRID_SIZE) + 1}`;
        this.board.element.appendChild(fruitElement);

        // Set despawn timer
        this.fruitTimer = setTimeout(() => {
            this.despawnFruit();
        }, FRUIT_RULES.DURATION);

        this.fruitSpawned++;
    }

    despawnFruit() {
        if (this.activeFruit) {
            const fruitElement = document.querySelector('.fruit');
            if (fruitElement) fruitElement.remove();
            this.activeFruit = null;
            clearTimeout(this.fruitTimer);
        }
    }

    checkCollisions() {
        // Check dot collection and fruit spawning
        if (this.board.isDot(this.pacman.position)) {
            this.score += SCORE.dot;
            this.board.removeDot(this.pacman.position);
            this.dotsEaten++;

            // Check fruit spawn conditions
            if (this.dotsEaten === FRUIT_RULES.FIRST_TRIGGER || 
                this.dotsEaten === FRUIT_RULES.SECOND_TRIGGER) {
                this.spawnFruit();
            }
        }

        // Check fruit collection
        if (this.activeFruit && this.pacman.position === this.activeFruit.position) {
            this.score += this.activeFruit.type.points;
            this.showPointsAnimation(this.activeFruit.type.points, this.pacman.position);
            this.despawnFruit();
        }

        // Check power pill collection
        if (this.board.isPowerPill(this.pacman.position)) {
            this.score += SCORE.powerPill;
            this.board.removePowerPill(this.pacman.position);
            this.ghostManager.frightenGhosts();
            this.ghostsEatenInFright = 0;  // Reset ghost combo counter
        }

        // Check ghost collisions with combo points
        const collidedGhost = this.ghostManager.checkCollision(this.pacman.position);
        if (collidedGhost) {
            if (collidedGhost.isScared) {
                this.ghostsEatenInFright++;
                // Award increasing points for consecutive ghost catches
                const points = GHOST_POINTS[
                    ['first', 'second', 'third', 'fourth'][
                        Math.min(this.ghostsEatenInFright - 1, 3)
                    ]
                ];
                this.score += points;
                
                // Show score animation
                this.showPointsAnimation(points, this.pacman.position);
                
                collidedGhost.returnToHouse();
            } else {
                this.handleDeath();
            }
        }
    }

    showPointsAnimation(points, position) {
        const x = (position % GRID_SIZE) * CELL_SIZE;
        const y = Math.floor(position / GRID_SIZE) * CELL_SIZE;
        
        const pointsElement = document.createElement('div');
        pointsElement.className = 'points-animation';
        pointsElement.textContent = points;
        pointsElement.style.left = `${x}px`;
        pointsElement.style.top = `${y}px`;
        
        this.board.element.appendChild(pointsElement);
        
        // Remove after animation
        setTimeout(() => pointsElement.remove(), 1000);
    }

    handleDeath() {
        this.state = GAME_STATES.DYING;
        this.pacman.playDeathAnimation();
        
        setTimeout(() => {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                // Reset positions
                this.pacman.reset();
                this.ghostManager.resetAll();
                
                // Brief pause before resuming
                setTimeout(() => {
                    this.state = GAME_STATES.PLAYING;
                    this.lastTime = performance.now();
                    requestAnimationFrame(this.gameLoop);
                }, 1500);
            }
        }, 1000);
    }

    resetLevel() {
        this.pacman.reset();
        this.ghostManager.resetAll();
    }

    nextLevel() {
        this.level++;
        this.board.loadLevel(LEVEL_1); // In a full game, you'd load different levels
        this.resetLevel();
        
        // Increase speeds based on level
        this.levelSpeeds.ghost = Math.max(SPEED.ghost * Math.pow(0.95, this.level - 1), 100);
        this.levelSpeeds.pacman = Math.max(SPEED.pacman * Math.pow(0.95, this.level - 1), 80);
        
        // Update ghost speeds
        this.ghostManager.updateSpeeds(this.levelSpeeds);
    
        this.updateUI();
    }

    gameOver() {
        this.state = GAME_STATES.GAME_OVER;
        this.showGameOver();
    }

    showGameOver() {
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
        const gameOver = document.createElement('div');
        gameOver.className = 'game-over';
        gameOver.innerHTML = `
            <h2>Game Over</h2>
            <p>Final Score: ${this.score}</p>
            <p>Time: ${timeString}</p>
            <button id="restart-button">Play Again</button>
        `;
        this.boardContainer.appendChild(gameOver);
        
        this.saveHighScore();  // Save score when game ends
        
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restart();
        });
    }

    updateUI() {
        this.scoreElement.textContent = `Score: ${this.score}`;
        this.livesElement.textContent = `Lives: ${this.lives}`;
        this.levelElement.textContent = `Level: ${this.level}`;
        
        // Format time as MM:SS
        const totalSeconds = Math.floor(this.elapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        this.timerElement.textContent = `Time: ${formattedTime}`;
    }

    saveHighScore() {
        const highScores = JSON.parse(localStorage.getItem('pacman-high-scores') || '[]');
        const newScore = {
            score: this.score,
            time: this.elapsedTime,
            level: this.level,
            date: new Date().toISOString()
        };
        highScores.push(newScore);
        
        // Sort by score first, then by shortest time for equal scores
        highScores.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.time - b.time;
        });
    
        // Keep top 10
        highScores.splice(10);
        localStorage.setItem('pacman-high-scores', JSON.stringify(highScores));
    }

    showHighScores() {
        const scores = JSON.parse(localStorage.getItem('pacman-high-scores') || '[]');
        return scores.map((s, i) => {
            const minutes = Math.floor(s.time / 60000);
            const seconds = Math.floor((s.time % 60000) / 1000);
            return `<div class="score-entry">
                ${i + 1}. Score: ${s.score} | Time: ${minutes}:${String(seconds).padStart(2, '0')}
            </div>`;
        }).join('');
    }

    destroy() {
        if (window.requestAnimationFrame) {
            cancelAnimationFrame(this.animationFrameId);
        } else {
            clearTimeout(this.animationFrameId);
        }
        document.removeEventListener('keydown', this.handleKeydown);
        this.boardContainer.innerHTML = '';
        this.gameStats.remove();
        this.hidePauseMenu();
    }
}