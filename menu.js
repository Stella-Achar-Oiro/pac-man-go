// menu.js
import Game from './game.js';

class MenuManager {
    constructor() {
        this.currentGame = null;
        this.initializeEventListeners();
        this.checkMobileDevice();
    }

    initializeEventListeners() {
        // Menu navigation
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('how-to-play').addEventListener('click', () => this.showTutorial());
        document.getElementById('back-to-menu').addEventListener('click', () => this.backToMenu());
        document.getElementById('high-scores').addEventListener('click', () => this.showHighScores());
        document.getElementById('back-from-scores').addEventListener('click', () => this.backToMenu());

        // Pause menu controls
        document.getElementById('resume-game')?.addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-game')?.addEventListener('click', () => this.restartGame());
        document.getElementById('quit-to-menu')?.addEventListener('click', () => this.quitToMenu());

        // Touch controls
        this.initializeTouchControls();

        // Keyboard controls for main menu
        document.addEventListener('keydown', (event) => this.handleKeyboardControls(event));
    }

    startGame() {
        document.getElementById('main-menu').style.display = 'none';
        if (this.currentGame) {
            this.currentGame.destroy();
        }
        this.currentGame = new Game();
        this.currentGame.start();
    }

    showTutorial() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('tutorial').style.display = 'block';
    }

    backToMenu() {
        document.querySelectorAll('.menu-screen').forEach(screen => {
            screen.style.display = 'none';
        });
        document.getElementById('main-menu').style.display = 'block';
    }

    showHighScores() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('scores-screen').style.display = 'block';
        const scores = JSON.parse(localStorage.getItem('pacman-high-scores') || '[]');
        const scoresList = scores
            .map((s, i) => `<div class="score-entry">${i + 1}. ${s.score}</div>`)
            .join('');
        document.getElementById('high-scores-list').innerHTML = scoresList || 'No scores yet!';
    }

    resumeGame() {
        if (this.currentGame) {
            document.getElementById('pause-screen').style.display = 'none';
            this.currentGame.togglePause();
        }
    }

    restartGame() {
        if (this.currentGame) {
            document.getElementById('pause-screen').style.display = 'none';
            this.currentGame.restart();
        }
    }

    quitToMenu() {
        if (this.currentGame) {
            document.getElementById('pause-screen').style.display = 'none';
            document.getElementById('main-menu').style.display = 'block';
            this.currentGame.destroy();
            this.currentGame = null;
        }
    }

    initializeTouchControls() {
        const touchButtons = document.querySelectorAll('.touch-button');
        touchButtons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.currentGame) {
                    const direction = button.dataset.direction;
                    this.currentGame.pacman.handleInput(direction);
                }
            });
        });
    }

    handleKeyboardControls(event) {
        if ((event.key === 'Enter' || event.key === ' ') && 
            document.getElementById('main-menu').style.display !== 'none') {
            event.preventDefault();
            this.startGame();
        }
    }

    checkMobileDevice() {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            document.getElementById('touch-controls').style.display = 'grid';
        }
    }
}

// Initialize menu system
const menuManager = new MenuManager();