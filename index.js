import { LEVEL, OBJECT_TYPE } from './js/setup.js';
import Ghost, { randomMovement } from './js/ghost.js';
// Classes
import Board from './js/board.js';
import Pacman from './js/pacman.js';

// Dom Elements
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

// Game constants
const POWER_PILL_TIME = 10000; // ms
const PACMAN_SPEED = 4; // Higher number = slower movement
const GHOST_SPEED = 5; // Higher number = slower movement
const gameBoard = Board.createGameBoard(gameGrid, LEVEL);

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
  } else {
    gameBoard.showGameStatus(gameWin);
    startButton.classList.remove('hide');
    cancelAnimationFrame(animationFrameId);
  }
}

function resetLevel(pacman) {
  powerPillActive = false;
  
  // Clear the board of existing characters
  gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.PACMAN]);
  ghostsInstances.forEach(ghost => {
    gameBoard.removeObject(ghost.pos, [
      OBJECT_TYPE.GHOST,
      OBJECT_TYPE.SCARED,
      ghost.name
    ]);
  });

  // Reset positions
  pacman.pos = 287; // Starting position
  gameBoard.addObject(pacman.pos, [OBJECT_TYPE.PACMAN]);
  
  ghostsInstances.forEach(ghost => {
    ghost.pos = ghost.startPos;
    ghost.isScared = false;
    gameBoard.addObject(ghost.pos, [OBJECT_TYPE.GHOST, ghost.name]);
  });

  // Reset event listeners
  document.removeEventListener('keydown', pacman.handleKeyInput);
  document.addEventListener('keydown', (e) =>
    pacman.handleKeyInput(e, gameBoard.objectExist.bind(gameBoard))
  );

  requestAnimationFrame(() => gameLoop(pacman, ghostsInstances));
}

function checkCollision(pacman, ghosts) {
  const collidedGhost = ghosts.find((ghost) => pacman.pos === ghost.pos);

  if (collidedGhost) {
    if (pacman.powerPill) {
      // Remove ghost and send it back to start
      gameBoard.removeObject(collidedGhost.pos, [
        OBJECT_TYPE.GHOST,
        OBJECT_TYPE.SCARED,
        collidedGhost.name
      ]);
      collidedGhost.pos = collidedGhost.startPos;
      gameBoard.addObject(collidedGhost.startPos, [OBJECT_TYPE.GHOST, collidedGhost.name]);
      score += 100;
      scoreDisplay.textContent = `Score: ${score}`;
    } else {
      // Remove Pacman
      gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.PACMAN]);
      gameBoard.rotateDiv(pacman.pos, 0);
      gameOver(pacman, gameGrid);
      return true; // Indicate collision occurred
    }
  }
  return false;
}

function gameLoop(pacman, ghosts) {
  if (!gamePaused) {
    performance.mark('frameStart');
    
    calculateFPS();
    updateTimer();
    
    // 1. Move Pacman
    performance.mark('movePacmanStart');
    gameBoard.moveCharacter(pacman);
    performance.mark('movePacmanEnd');
    performance.measure('Pacman Movement', 'movePacmanStart', 'movePacmanEnd');

    // 2. Check Ghost collision on the old positions
    performance.mark('collisionStart');
    if (checkCollision(pacman, ghosts)) return;
    performance.mark('collisionEnd');
    performance.measure('Collision Check', 'collisionStart', 'collisionEnd');

    // 3. Move ghosts
    performance.mark('moveGhostsStart');
    ghosts.forEach((ghost) => gameBoard.moveCharacter(ghost));
    performance.mark('moveGhostsEnd');
    performance.measure('Ghost Movement', 'moveGhostsStart', 'moveGhostsEnd');

    // 4. Do a new ghost collision check on the new positions
    if (checkCollision(pacman, ghosts)) return;

    // 5. Check if Pacman eats a dot
    performance.mark('dotCheckStart');
    if (gameBoard.objectExist(pacman.pos, OBJECT_TYPE.DOT)) {
      gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.DOT]);
      gameBoard.dotCount--;
      score += 10;
      scoreDisplay.textContent = `Score: ${score}`;
    }
    performance.mark('dotCheckEnd');
    performance.measure('Dot Check', 'dotCheckStart', 'dotCheckEnd');

    // 6. Check if Pacman eats a power pill
    if (gameBoard.objectExist(pacman.pos, OBJECT_TYPE.PILL)) {
      gameBoard.removeObject(pacman.pos, [OBJECT_TYPE.PILL]);
      pacman.powerPill = true;
      score += 50;
      scoreDisplay.textContent = `Score: ${score}`;

      clearTimeout(powerPillTimer);
      powerPillTimer = setTimeout(
        () => (pacman.powerPill = false),
        POWER_PILL_TIME
      );
    }

    // 7. Change ghost scare mode depending on powerpill
    if (pacman.powerPill !== powerPillActive) {
      powerPillActive = pacman.powerPill;
      ghosts.forEach((ghost) => (ghost.isScared = pacman.powerPill));
    }

    // 8. Check if all dots have been eaten
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
  // Clear previous performance marks
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

  // Reset displays
  scoreDisplay.textContent = `Score: ${score}`;
  livesDisplay.textContent = `Lives: ${lives}`;
  timerDisplay.textContent = 'Time: 0s';
  
  startButton.classList.add('hide');
  pauseMenu.classList.add('hide');

  gameBoard.createGrid(LEVEL);

  pacmanInstance = new Pacman(PACMAN_SPEED, 287);
  gameBoard.addObject(287, [OBJECT_TYPE.PACMAN]);
  
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('keydown', (e) =>
    pacmanInstance.handleKeyInput(e, gameBoard.objectExist.bind(gameBoard))
  );

  ghostsInstances = [
    new Ghost(GHOST_SPEED, 188, randomMovement, OBJECT_TYPE.BLINKY),
    new Ghost(GHOST_SPEED + 1, 209, randomMovement, OBJECT_TYPE.PINKY),
    new Ghost(GHOST_SPEED + 2, 230, randomMovement, OBJECT_TYPE.INKY),
    new Ghost(GHOST_SPEED + 3, 251, randomMovement, OBJECT_TYPE.CLYDE)
  ];

  requestAnimationFrame(() => gameLoop(pacmanInstance, ghostsInstances));
}

// Initialize game
startButton.addEventListener('click', startGame);
continueButton.addEventListener('click', togglePause);
restartButton.addEventListener('click', () => {
  togglePause();
  startGame();
});