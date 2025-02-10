// index.js
import { LEVEL, OBJECT_TYPE, GHOST_MODES, GHOST_HOUSE, FRUITS } from './setup.js';
import Ghost from './ghost.js';
import GhostHouseController from './ghostHouseController.js';
import Board from './board.js';
import Pacman from './pacman.js';

// DOM Elements
const gameGrid = document.querySelector('#game');
const timerDisplay = document.querySelector('#timer');
const scoreDisplay = document.querySelector('#score');
const livesDisplay = document.querySelector('#lives');
const fpsDisplay = document.querySelector('#fps');
const startButton = document.querySelector('#start-button');
const pauseMenu = document.querySelector('#pause-menu');
const continueButton = document.querySelector('#continue-button');
const restartButton = document.querySelector('#restart-button');

// Game state
let gameStartTime = 0;
let gamePaused = false;
let lives = 3;
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;
let score = 0;
let gameWin = false;
let powerPillActive = false;
let powerPillTimer = null;
let animationFrameId = null;
let currentLevel = 1;
let ghostHouseController;
let currentFruit = null;
let fruitTimer = null;
let ghostComboCount = 0;


// Game constants
const POWER_PILL_TIME = 10000; // ms
const PACMAN_SPEED = 8; // Higher number = slower movement
const GHOST_SPEED = 10; // Higher number = slower movement
const gameBoard = Board.createGameBoard(gameGrid, LEVEL);

function createFruitElement(type, score) {
    const fruitDiv = document.createElement('div');
    fruitDiv.className = `fruit ${type}`;
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#${type}`);
    
    svg.appendChild(use);
    fruitDiv.appendChild(svg);
    
    return fruitDiv;
}

function showPoints(position, points) {
    const pointsText = document.createElement('div');
    pointsText.className = 'points-text';
    pointsText.textContent = points;
    
    const square = gameBoard.grid[position];
    const rect = square.getBoundingClientRect();
    pointsText.style.left = `${rect.left}px`;
    pointsText.style.top = `${rect.top}px`;
    
    document.body.appendChild(pointsText);
    
    setTimeout(() => {
        pointsText.remove();
    }, 800);
}

function spawnFruit() {
    // Get the appropriate fruit based on dots eaten
    let fruitType;
    let fruitScore;
    
    if (gameBoard.dotCount <= 70) {
        fruitType = 'CHERRY';
        fruitScore = 100;
    } else if (gameBoard.dotCount <= 170) {
        fruitType = 'STRAWBERRY';
        fruitScore = 300;
    } else if (gameBoard.dotCount <= 270) {
        fruitType = 'ORANGE';
        fruitScore = 500;
    } else if (gameBoard.dotCount <= 370) {
        fruitType = 'APPLE';
        fruitScore = 700;
    } else if (gameBoard.dotCount <= 470) {
        fruitType = 'MELON';
        fruitScore = 1000;
    } else if (gameBoard.dotCount <= 570) {
        fruitType = 'GALAXIAN';
        fruitScore = 2000;
    } else if (gameBoard.dotCount <= 670) {
        fruitType = 'BELL';
        fruitScore = 3000;
    } else {
        fruitType = 'KEY';
        fruitScore = 5000;
    }
    
    const centerPos = 261;
    
    currentFruit = {
        type: fruitType.toLowerCase(),
        position: centerPos,
        score: fruitScore
    };
    
    const fruitElement = createFruitElement(currentFruit.type, currentFruit.score);
    gameBoard.grid[centerPos].appendChild(fruitElement);
    
    fruitTimer = setTimeout(() => {
        removeFruit();
    }, 10000);
}

function removeFruit() {
    if (currentFruit) {
        const fruitElement = gameBoard.grid[currentFruit.position].querySelector('.fruit');
        if (fruitElement) {
            fruitElement.remove();
        }
        currentFruit = null;
        clearTimeout(fruitTimer);
    }
}

function updateTimer() {
    if (!gamePaused && gameStartTime > 0) {
        const currentTime = Math.floor((performance.now() - gameStartTime) / 1000);
        timerDisplay.textContent = `Time: ${currentTime}s`;
    }
}

function calculateFPS() {
    frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;

    if (deltaTime >= 1000) {
        fps = Math.round((frameCount * 1000) / deltaTime);
        frameCount = 0;
        lastTime = currentTime;
        fpsDisplay.textContent = `FPS: ${fps}`;
    }
}

function togglePause() {
    if (!lives || gameWin) return;
    
    gamePaused = !gamePaused;
    pauseMenu.classList.toggle('hide');
    
    if (!gamePaused) {
        lastTime = performance.now();
        requestAnimationFrame(() => gameLoop(pacmanInstance, ghostsInstances));
    }
}

function handleKeydown(e) {
    if (e.key === 'Escape') {
        togglePause();
    }
}

function gameOver(pacman, grid) {
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('keydown', pacman.handleKeyInput);

    if (lives > 1 && !gameWin) {
        lives--;
        livesDisplay.textContent = `Lives: ${lives}`;
        resetLevel(pacman);
        gamePaused = false;
        pauseMenu.classList.add('hide');
        requestAnimationFrame(() => gameLoop(pacman, ghostsInstances));
    } else {
        gameBoard.showGameStatus(gameWin);
        startButton.classList.remove('hide');
        cancelAnimationFrame(animationFrameId);
    }
}

function resetLevel(pacman) {
    powerPillActive = false;
    clearTimeout(powerPillTimer);
    
    // Remove all existing game objects
    gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.PACMAN]);
    ghostsInstances.forEach(ghost => {
        gameBoard.removeObject(ghost.pos, [
            OBJECT_TYPE.GHOST,
            OBJECT_TYPE.SCARED,
            ghost.name
        ]);
    });

    // Reset Pacman
    pacman.pos = 287;
    pacman.dir = null;
    pacman.timer = 0;
    pacman.powerPill = false;
    gameBoard.addObject(pacman.pos, [OBJECT_TYPE.PACMAN]);
    
    // Reset all ghosts
    ghostsInstances.forEach(ghost => {
        ghost.resetPosition();
        gameBoard.addObject(ghost.pos, [OBJECT_TYPE.GHOST, ghost.name]);
    });

    // Re-add event listeners
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('keydown', pacman.handleKeyInput);
    
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('keydown', (e) =>
        pacman.handleKeyInput(e, gameBoard.objectExist.bind(gameBoard))
    );
}

function checkCollision(pacman, ghosts) {
  const collidedGhost = ghosts.find((ghost) => pacman.pos === ghost.pos);

  if (collidedGhost) {
      if (pacman.powerPill) {
          // Remove ghost and send it back to house
          gameBoard.removeObject(collidedGhost.pos, [
              OBJECT_TYPE.GHOST,
              OBJECT_TYPE.SCARED,
              collidedGhost.name
          ]);

          // Calculate and show ghost score based on combo
          const ghostScore = Math.pow(2, ghostComboCount) * 200; // 200, 400, 800, 1600
          score += ghostScore;
          showPoints(collidedGhost.pos, ghostScore);
          scoreDisplay.textContent = `Score: ${score}`;
          ghostComboCount++;

          // Reset ghost position and state
          collidedGhost.isInHouse = true;
          collidedGhost.pos = GHOST_HOUSE.ENTRY;
          gameBoard.addObject(GHOST_HOUSE.ENTRY, [OBJECT_TYPE.GHOST, collidedGhost.name]);
      } else {
          gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.PACMAN]);
          gameBoard.rotateDiv(pacman.pos, 0);
          gameOver(pacman, gameGrid);
          return true;
      }
  }
  return false;
}

function startGhostModes() {
    ghostsInstances.forEach(ghost => {
        if (ghost.modeTimer) {
            clearTimeout(ghost.modeTimer);
        }
        ghost.setModeTimings(
            currentLevel <= 1 ? GHOST_MODES.LEVEL_1 :
            currentLevel <= 4 ? GHOST_MODES.LEVEL_2_4 :
            GHOST_MODES.LEVEL_5_PLUS
        );
    });
}

function gameLoop(pacman, ghosts) {
    if (!gamePaused) {
        performance.mark('frameStart');
        
        calculateFPS();
        updateTimer();
        
        // Move Pacman
        gameBoard.moveCharacter(pacman);

        // Check Ghost collision
        if (checkCollision(pacman, ghosts)) return;

        // Move ghosts
        ghosts.forEach((ghost) => gameBoard.moveCharacter(ghost));

        // Do a new ghost collision check
        if (checkCollision(pacman, ghosts)) return;

        // Check if Pacman eats a dot
        if (gameBoard.objectExist(pacman.pos, OBJECT_TYPE.DOT)) {
            gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.DOT]);
            gameBoard.dotCount--;
            score += 10;
            scoreDisplay.textContent = `Score: ${score}`;
            showPoints(pacman.pos, 10);
            
            // Handle ghost releases
            ghostHouseController.handleDotEaten();
            
            // Check fruit spawn conditions - spawn at 70 and 170 dots remaining
            if (!currentFruit && (gameBoard.dotCount === 70 || gameBoard.dotCount === 170)) {
                spawnFruit();
            }
        }
        
        // Check if Pacman eats a fruit
        if (currentFruit && pacman.pos === currentFruit.position) {
            score += currentFruit.score;
            showPoints(currentFruit.position, currentFruit.score);
            scoreDisplay.textContent = `Score: ${score}`;
            removeFruit();
        }

        // Check if Pacman eats a power pill
        if (gameBoard.objectExist(pacman.pos, OBJECT_TYPE.PILL)) {
            gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.PILL]);
            pacman.powerPill = true;
            ghostComboCount = 0;
            score += 50;
            scoreDisplay.textContent = `Score: ${score}`;
            showPoints(pacman.pos, 50);

            clearTimeout(powerPillTimer);
            powerPillTimer = setTimeout(() => {
                pacman.powerPill = false;
                ghostComboCount = 0;
            }, POWER_PILL_TIME);
        }

        // Change ghost scare mode
        if (pacman.powerPill !== powerPillActive) {
            powerPillActive = pacman.powerPill;
            ghosts.forEach((ghost) => (ghost.isScared = pacman.powerPill));
        }

        // Check if all dots have been eaten
        if (gameBoard.dotCount === 0) {
            gameWin = true;
            gameOver(pacman, gameGrid);
        }

        performance.mark('frameEnd');
        performance.measure('Full Frame', 'frameStart', 'frameEnd');
    }
    
    animationFrameId = requestAnimationFrame(() => gameLoop(pacman, ghostsInstances));
}

let pacmanInstance;
let ghostsInstances;

function startGame() {
    performance.clearMarks();
    performance.clearMeasures();
    
    gameWin = false;
    gamePaused = false;
    powerPillActive = false;
    score = 0;
    lives = 3;
    frameCount = 0;
    lastTime = performance.now();
    gameStartTime = performance.now();
    fps = 0;
    currentLevel = 1;
    ghostComboCount = 0;

    // Reset displays
    scoreDisplay.textContent = `Score: ${score}`;
    livesDisplay.textContent = `Lives: ${lives}`;
    timerDisplay.textContent = 'Time: 0s';
    
    startButton.classList.add('hide');
    pauseMenu.classList.add('hide');

    gameBoard.createGrid(LEVEL);

    // Create Pacman
    pacmanInstance = new Pacman(PACMAN_SPEED, 287);
    gameBoard.addObject(287, [OBJECT_TYPE.PACMAN]);

    // Create ghosts
    const blinky = new Ghost(
        GHOST_SPEED,
        GHOST_HOUSE.BLINKY_START,
        'blinkyBehavior',
        OBJECT_TYPE.BLINKY,
        pacmanInstance
    );

    const pinky = new Ghost(
        GHOST_SPEED + 1,
        GHOST_HOUSE.PINKY_START,
        'pinkyBehavior',
        OBJECT_TYPE.PINKY,
        pacmanInstance
    );

    const inky = new Ghost(
        GHOST_SPEED + 2,
        GHOST_HOUSE.INKY_START,
        'inkyBehavior',
        OBJECT_TYPE.INKY,
        pacmanInstance,
        blinky
    );

    const clyde = new Ghost(
        GHOST_SPEED + 3,
        GHOST_HOUSE.CLYDE_START,
        'clydeBehavior',
        OBJECT_TYPE.CLYDE,
        pacmanInstance
    );

    ghostsInstances = [blinky, pinky, inky, clyde];
    
    // Initialize controllers
    ghostHouseController = new GhostHouseController(ghostsInstances);
    
    // Add ghosts to the board based on their initial states
    ghostsInstances.forEach(ghost => {
        if (ghost.name === OBJECT_TYPE.BLINKY) {
            gameBoard.addObject(ghost.pos, [OBJECT_TYPE.GHOST, ghost.name]);
        } else {
            gameBoard.addObject(ghost.pos, [OBJECT_TYPE.GHOST, OBJECT_TYPE.GHOSTLAIR, ghost.name]);
        }
    });

    startGhostModes();

    // Add event listeners
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('keydown', (e) =>
        pacmanInstance.handleKeyInput(e, gameBoard.objectExist.bind(gameBoard))
    );

    // Start game loop
    requestAnimationFrame(() => gameLoop(pacmanInstance, ghostsInstances));
}

// Initialize game
startButton.addEventListener('click', startGame);
continueButton.addEventListener('click', togglePause);
restartButton.addEventListener('click', () => {
    togglePause();
    startGame();
    startGhostModes();
});
