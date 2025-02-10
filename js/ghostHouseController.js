// ghostHouseController.js
import { OBJECT_TYPE, GHOST_HOUSE, DIRECTIONS } from './setup.js';

class GhostHouseController {
    constructor(ghostInstances) {
        this.ghosts = ghostInstances;
        this.dotsEaten = 0;
        this.level = 1;
        this.ghostQueue = [];
        this.initializeGhostQueue();
    }

    initializeGhostQueue() {
        this.ghostQueue = [];
        
        // Get ghost instances
        const blinky = this.ghosts.find(ghost => ghost.name === OBJECT_TYPE.BLINKY);
        const pinky = this.ghosts.find(ghost => ghost.name === OBJECT_TYPE.PINKY);
        const inky = this.ghosts.find(ghost => ghost.name === OBJECT_TYPE.INKY);
        const clyde = this.ghosts.find(ghost => ghost.name === OBJECT_TYPE.CLYDE);

        // Set initial states
        if (blinky) {
            blinky.isInHouse = false;
            blinky.pos = GHOST_HOUSE.BLINKY_START;
            blinky.dir = DIRECTIONS.ArrowLeft;
        }

        if (pinky) {
            pinky.isInHouse = true;
            pinky.pos = GHOST_HOUSE.PINKY_START;
            pinky.dir = DIRECTIONS.ArrowUp;
            this.ghostQueue.push({ ghost: pinky, dotsRequired: 0 });
        }

        if (inky) {
            inky.isInHouse = true;
            inky.pos = GHOST_HOUSE.INKY_START;
            inky.dir = DIRECTIONS.ArrowUp;
            this.ghostQueue.push({ ghost: inky, dotsRequired: 30 });
        }

        if (clyde) {
            clyde.isInHouse = true;
            clyde.pos = GHOST_HOUSE.CLYDE_START;
            clyde.dir = DIRECTIONS.ArrowUp;
            this.ghostQueue.push({ ghost: clyde, dotsRequired: 60 });
        }
    }

    handleDotEaten() {
        this.dotsEaten++;
        
        // Check if any ghosts should be released
        while (this.ghostQueue.length > 0 && 
               this.dotsEaten >= this.ghostQueue[0].dotsRequired) {
            const { ghost } = this.ghostQueue.shift();
            this.releaseGhost(ghost);
        }
    }

    releaseGhost(ghost) {
        ghost.isInHouse = false;
        ghost.pos = GHOST_HOUSE.EXIT;
        ghost.dir = DIRECTIONS.ArrowLeft;
    }

    resetForLevel() {
        this.dotsEaten = 0;
        this.level++;
        this.initializeGhostQueue();
    }
}

export default GhostHouseController;