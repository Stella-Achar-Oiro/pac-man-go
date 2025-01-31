# Pac-Man Game

A modern implementation of the classic Pac-Man arcade game using HTML5, CSS3, and JavaScript.

## Features

- Authentic ghost AI behavior:
  - Blinky (red): Directly targets Pac-Man
  - Pinky (pink): Targets 4 tiles ahead of Pac-Man
  - Inky (cyan): Uses Blinky's position to ambush Pac-Man
  - Clyde (orange): Alternates between chasing and retreating
- Original game mechanics:
  - Ghost modes (Chase, Scatter, Frightened)
  - Power pellets
  - Authentic scoring system
  - Progressive difficulty
- Smooth animations and pixel-perfect movement
- Original sound effects
- Responsive controls
- Pause functionality

## How to Play

1. Use arrow keys to control Pac-Man
2. Eat all dots while avoiding ghosts
3. Collect power pellets to turn the tables and eat the ghosts
4. Press ESC to pause the game

## Scoring System

- Dot: 10 points
- Power Pellet: 50 points
- Ghost (during power mode):
  - 1st ghost: 200 points
  - 2nd ghost: 400 points
  - 3rd ghost: 800 points
  - 4th ghost: 1600 points

## Ghost Behavior

- **Scatter Mode**: Ghosts retreat to their respective corners
- **Chase Mode**: Each ghost has unique targeting behavior
- **Frightened Mode**: Ghosts move randomly and can be eaten
- **Cruise Elroy**: Blinky speeds up when few dots remain

## Technical Details

The game is built using:
- HTML5 Canvas for rendering
- CSS3 for animations and styling
- Vanilla JavaScript for game logic
- Web Audio API for sound effects

## Installation

1. Clone the repository
2. Open `index.html` in a modern web browser
3. No additional dependencies required

## Credits

Sound effects and game mechanics are inspired by the original Pac-Man game by Namco.

## License

This project is open source and available under the MIT License.