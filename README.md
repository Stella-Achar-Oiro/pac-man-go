# make-your-game

## Pac-Man Game

A modern implementation of the classic Pac-Man arcade game using vanilla JavaScript and HTML5.

## Features

- Classic Pac-Man gameplay mechanics
- Responsive design for both desktop and mobile devices
- Touch controls for mobile devices
- Score tracking and high scores
- Power pills and ghost frightening mechanics
- Fruit bonus system
- Pause/Resume functionality
- Multiple ghost AI behaviors
- Smooth animations and transitions

## Getting Started

### Prerequisites

- Modern web browser
- Local web server (for development)

### Installation

1. Clone the repository:
```bash
git clone https://gitea.com/steoiro/make-your-game.git
```

2. Navigate to the project directory:
```bash
cd make-your-game
```

3. Start a local server:
```bash
# Using Python 3
python -m http.server 8000

# Or using Node.js http-server
npx http-server
```

4. Open your browser and navigate to `http://localhost:8000`

## Controls

- **Arrow Keys** or **WASD**: Move Pac-Man
- **P** or **ESC**: Pause game
- **Space** or **Enter**: Start game/Continue
- **Touch Controls**: Available on mobile devices

## Project Structure

```
pacman-game/
├── index.html          # Main HTML file
├── styles.css          # Main stylesheet
├── js/
│   ├── config.js       # Game configuration and constants
│   ├── game.js         # Main game logic
│   ├── board.js        # Game board management
│   ├── pacman.js       # Pac-Man character logic
│   └── ghostManager.js # Ghost AI and management
├── README.md
└── LICENSE
```

## Technical Details

### Core Components

- **Board**: Manages the game grid, walls, dots, and power pills
- **Pacman**: Handles player movement and collision detection
- **GhostManager**: Controls ghost behaviors and AI
- **Game**: Orchestrates game states and scoring

### Key Features Implementation

1. **Ghost AI**:
   - Chase behavior: Directly targets Pac-Man
   - Scatter behavior: Moves to corner positions
   - Frightened behavior: Random movement when vulnerable
   - Ambush behavior: Predicts Pac-Man's movement

2. **Performance Optimizations**:
   - RequestAnimationFrame for smooth animations
   - CSS transforms for better performance
   - Efficient collision detection


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT [License](LICENSE) - see the LICENSE file for details.

## Acknowledgments

- Original Pac-Man game by Namco
- Ghost AI patterns based on the original arcade game mechanics
- Community contributions and feedback
