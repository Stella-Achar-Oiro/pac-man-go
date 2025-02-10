// ghostHouseController.js
import { OBJECT_TYPE, GHOST_HOUSE, DIRECTIONS, GHOST_RELEASE } from './setup.js';

class GhostHouseController {
    constructor(ghostInstances) {
        this.ghosts = ghostInstances;
        this.dotsEaten = 0;
        this.level = 1;
        this.ghostQueue = [];
        this.activeGhosts = new Set();
        this.housePositions = new Map();
        this.releaseTimers = new Map();
        
        // Initialize controller
        this.setupHousePositions();
        this.initializeGhostQueue();
        
        console.log('Ghost House Controller initialized');
    }

    setupHousePositions() {
        // Map initial house positions for each ghost
        this.housePositions.set(OBJECT_TYPE.BLINKY, GHOST_HOUSE.BLINKY_START);
        this.housePositions.set(OBJECT_TYPE.PINKY, GHOST_HOUSE.PINKY_START);
        this.housePositions.set(OBJECT_TYPE.INKY, GHOST_HOUSE.INKY_START);
        this.housePositions.set(OBJECT_TYPE.CLYDE, GHOST_HOUSE.CLYDE_START);
    }

    initializeGhostQueue() {
        console.log('Initializing ghost queue');
        this.ghostQueue = [];
        this.activeGhosts.clear();
        
        // Clear any existing release timers
        this.releaseTimers.forEach(timer => clearTimeout(timer));
        this.releaseTimers.clear();

        // Initialize each ghost
        this.ghosts.forEach(ghost => {
            this.initializeGhost(ghost);
        });

        console.log('Ghost queue initialized:', this.ghostQueue.map(q => q.ghost.name));
    }

    initializeGhost(ghost) {
        console.log(`Initializing ${ghost.name}`);
        
        // Get starting position from map
        const startPos = this.housePositions.get(ghost.name);
        
        switch(ghost.name) {
            case OBJECT_TYPE.BLINKY:
                this.setupBlinky(ghost, startPos);
                break;
            case OBJECT_TYPE.PINKY:
                this.setupPinky(ghost, startPos);
                break;
            case OBJECT_TYPE.INKY:
                this.setupInky(ghost, startPos);
                break;
            case OBJECT_TYPE.CLYDE:
                this.setupClyde(ghost, startPos);
                break;
        }
    }

    setupBlinky(ghost, startPos) {
        ghost.isInHouse = false;
        ghost.pos = startPos;
        ghost.dir = DIRECTIONS.ArrowLeft;
        this.activeGhosts.add(ghost.name);
        console.log('Blinky setup:', { pos: ghost.pos, inHouse: ghost.isInHouse });
    }

    setupPinky(ghost, startPos) {
        ghost.isInHouse = true;
        ghost.pos = startPos;
        ghost.dir = DIRECTIONS.ArrowUp;
        this.ghostQueue.push({ 
            ghost, 
            dotsRequired: GHOST_RELEASE.PINKY,
            released: false 
        });
        console.log('Pinky setup:', { pos: ghost.pos, inHouse: ghost.isInHouse });
    }

    setupInky(ghost, startPos) {
        ghost.isInHouse = true;
        ghost.pos = startPos;
        ghost.dir = DIRECTIONS.ArrowUp;
        this.ghostQueue.push({ 
            ghost, 
            dotsRequired: GHOST_RELEASE.INKY,
            released: false 
        });
        console.log('Inky setup:', { pos: ghost.pos, inHouse: ghost.isInHouse });
    }

    setupClyde(ghost, startPos) {
        ghost.isInHouse = true;
        ghost.pos = startPos;
        ghost.dir = DIRECTIONS.ArrowUp;
        this.ghostQueue.push({ 
            ghost, 
            dotsRequired: GHOST_RELEASE.CLYDE,
            released: false 
        });
        console.log('Clyde setup:', { pos: ghost.pos, inHouse: ghost.isInHouse });
    }

    handleDotEaten() {
        this.dotsEaten++;
        console.log('Dots eaten:', this.dotsEaten);
        
        // Check release conditions for each ghost in queue
        this.ghostQueue = this.ghostQueue.filter(entry => {
            if (!entry.released && this.dotsEaten >= entry.dotsRequired) {
                this.scheduleGhostRelease(entry.ghost);
                return false; // Remove from queue
            }
            return true; // Keep in queue
        });
    }

    scheduleGhostRelease(ghost) {
        console.log(`Scheduling release for ${ghost.name}`);
        
        // Calculate release delay based on ghost type
        const delay = this.calculateReleaseDelay(ghost);
        
        // Schedule release
        const timer = setTimeout(() => {
            this.releaseGhost(ghost);
        }, delay);
        
        // Store timer reference
        this.releaseTimers.set(ghost.name, timer);
    }

    calculateReleaseDelay(ghost) {
        // Base delay of 500ms
        let delay = 500;
        
        // Add additional delay based on ghost type
        switch(ghost.name) {
            case OBJECT_TYPE.PINKY:
                delay += 0; // Pinky leaves immediately after condition met
                break;
            case OBJECT_TYPE.INKY:
                delay += 1000; // Inky waits 1 second
                break;
            case OBJECT_TYPE.CLYDE:
                delay += 2000; // Clyde waits 2 seconds
                break;
        }
        
        return delay;
    }

    releaseGhost(ghost) {
        console.log(`Releasing ${ghost.name} from house`);
        
        // Clear any existing timer
        if (this.releaseTimers.has(ghost.name)) {
            clearTimeout(this.releaseTimers.get(ghost.name));
            this.releaseTimers.delete(ghost.name);
        }

        // Update ghost state
        ghost.isInHouse = false;
        ghost.pos = GHOST_HOUSE.EXIT;
        ghost.dir = DIRECTIONS.ArrowLeft;
        
        // Add to active ghosts
        this.activeGhosts.add(ghost.name);
        
        console.log(`${ghost.name} released at position ${ghost.pos}`);
    }

    returnGhostToHouse(ghost) {
        console.log(`Returning ${ghost.name} to house`);
        
        // Reset ghost state
        ghost.isInHouse = true;
        ghost.pos = this.housePositions.get(ghost.name);
        ghost.dir = DIRECTIONS.ArrowUp;
        ghost.isScared = false;
        
        // Schedule re-release
        this.scheduleGhostRelease(ghost);
    }

    resetForLevel() {
        console.log(`Resetting for level ${this.level + 1}`);
        
        this.dotsEaten = 0;
        this.level++;
        
        // Clear timers
        this.releaseTimers.forEach(timer => clearTimeout(timer));
        this.releaseTimers.clear();
        
        // Reset all ghosts
        this.initializeGhostQueue();
        
        console.log('Ghost house reset complete');
    }

    getCurrentState() {
        return {
            dotsEaten: this.dotsEaten,
            level: this.level,
            activeGhosts: Array.from(this.activeGhosts),
            queuedGhosts: this.ghostQueue.map(entry => ({
                name: entry.ghost.name,
                dotsRequired: entry.dotsRequired,
                released: entry.released
            }))
        };
    }

    cleanup() {
        // Clear all timers
        this.releaseTimers.forEach(timer => clearTimeout(timer));
        this.releaseTimers.clear();
        
        // Reset state
        this.ghostQueue = [];
        this.activeGhosts.clear();
        this.dotsEaten = 0;
        
        console.log('Ghost house controller cleaned up');
    }
}

export default GhostHouseController;