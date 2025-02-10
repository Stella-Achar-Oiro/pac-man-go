# Pac-Man Game

A modern implementation of the classic Pac-Man arcade game using HTML5, CSS3, and JavaScript. This version faithfully recreates the original game mechanics while adding modern visual enhancements.

## Features

### Core Gameplay
- Classic Pac-Man maze with dots, power pills, and fruits
- Four unique ghosts with authentic AI behaviors
- Progressive difficulty levels
- Score tracking and lives system
- Smooth animations and pixel-perfect movement
- Original sound effects
- Pause functionality

### Ghost AI Behaviors
- **Blinky (Red)**: The pursuer
  - Directly targets Pac-Man's current position
  - Starts outside the ghost house
  - Becomes faster when few dots remain ("Cruise Elroy" mode)

- **Pinky (Pink)**: The ambusher
  - Targets 4 tiles ahead of Pac-Man's current direction
  - First to leave the ghost house
  - Uses ambush tactics to trap Pac-Man

- **Inky (Cyan)**: The unpredictable
  - Uses both Blinky's position and Pac-Man's position for targeting
  - Leaves ghost house after 30 dots are eaten
  - Most unpredictable movement patterns

- **Clyde (Orange)**: The random
  - Alternates between chasing Pac-Man and returning to scatter mode
  - Last to leave ghost house (after 60 dots)
  - Moves randomly when close to Pac-Man

### Ghost Modes
1. **Chase Mode**: Each ghost uses their unique targeting behavior
2. **Scatter Mode**: Ghosts retreat to their home corners
3. **Frightened Mode**: When Pac-Man eats a power pill
   - Ghosts turn blue and can be eaten
   - Move randomly and at reduced speed
   - Flash before returning to normal

## Scoring System

- **Basic Items**:
  - Dot: 10 points
  - Power Pill: 50 points
  - Fruits (appear at specific intervals):
    - Cherry: 100 points
    - Strawberry: 300 points
    - Orange: 500 points
    - Apple: 700 points
    - Melon: 1000 points
    - Galaxian: 2000 points
    - Bell: 3000 points
    - Key: 5000 points

- **Ghost Combo System**:
  - 1st Ghost: 200 points
  - 2nd Ghost: 400 points
  - 3rd Ghost: 800 points
  - 4th Ghost: 1600 points
  - Combo resets when power pill effect ends

## Controls

- **Arrow Keys**: Move Pac-Man
- **ESC**: Pause/Unpause game
- **Start Button**: Begin new game
- **Continue Button**: Resume paused game
- **Restart Button**: Start fresh game

## Technical Details

### Built With
- HTML5 Canvas for rendering
- CSS3 for styling and animations
- Vanilla JavaScript for game logic
- Web Audio API for sound effects

### Performance Features
- Optimized collision detection
- Efficient ghost pathfinding
- Smooth animation system
- FPS monitoring and optimization

### Code Architecture
- Modular design with separate components for:
  - Game board management
  - Character movement
  - Ghost AI
  - Collision detection
  - Scoring system
  - Sound management

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Open `index.html` in a modern web browser
3. No additional dependencies or build steps required

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Any modern browser with HTML5 support

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.

## Credits

- Original Pac-Man game by Namco
- Sound effects and sprites inspired by the original arcade game
- Modern implementation by [Your Name/Team]