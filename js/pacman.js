// pacman.js
import { OBJECT_TYPE, DIRECTIONS } from './setup.js';

class Pacman {
    constructor(speed, startPos) {
        this.pos = startPos;
        this.speed = speed;
        this.dir = null;
        this.timer = 0;
        this.powerPill = false;
        this.rotation = true;
        this.requestedDir = null; // Store the next requested direction
        this.powerPillTimerId = null;
        this.powerPillBlinkId = null;
        this.isPowerPillBlinking = false;
    }

    shouldMove() {
        // Don't move if no direction is set
        if (this.dir === null) return false;
        
        // Only move on game speed timer
        if (this.timer === this.speed) {
            this.timer = 0;
            return true;
        }
        this.timer++;
        return false;
    }

    getNextMove(objectExist) {
        // If no direction is set, stay in current position
        if (this.dir === null) {
            return { nextMovePos: this.pos, direction: this.dir };
        }

        let nextMovePos = this.pos + this.dir.movement;

        // First try the requested direction if it exists
        if (this.requestedDir !== null) {
            const requestedNextMovePos = this.pos + this.requestedDir.movement;
            if (!objectExist(requestedNextMovePos, OBJECT_TYPE.WALL) && 
                !objectExist(requestedNextMovePos, OBJECT_TYPE.GHOSTLAIR)) {
                this.dir = this.requestedDir;
                this.requestedDir = null;
                nextMovePos = requestedNextMovePos;
            }
        }

        // Check if next move is possible, if not stay in current position
        if (objectExist(nextMovePos, OBJECT_TYPE.WALL) || 
            objectExist(nextMovePos, OBJECT_TYPE.GHOSTLAIR)) {
            nextMovePos = this.pos;
        }

        return { nextMovePos, direction: this.dir };
    }

    makeMove() {
        const classesToRemove = [OBJECT_TYPE.PACMAN];
        const classesToAdd = [OBJECT_TYPE.PACMAN];

        return { classesToRemove, classesToAdd };
    }

    setNewPos(nextMovePos) {
        this.pos = nextMovePos;
    }

    handleKeyInput = (e, objectExist) => {
        let dir;

        if (e.keyCode >= 37 && e.keyCode <= 40) {
            dir = DIRECTIONS[e.key];
        } else {
            return;
        }

        // Store the requested direction
        if (this.dir === null) {
            // If Pacman is not moving, try to move immediately
            const nextMovePos = this.pos + dir.movement;
            if (!objectExist(nextMovePos, OBJECT_TYPE.WALL) && 
                !objectExist(nextMovePos, OBJECT_TYPE.GHOSTLAIR)) {
                this.dir = dir;
            }
        } else {
            // Store the requested direction for the next move
            this.requestedDir = dir;
        }
    };

    startPowerPill() {
        this.powerPill = true;
        this.isPowerPillBlinking = false;
        
        // Clear any existing timers
        if (this.powerPillTimerId) clearTimeout(this.powerPillTimerId);
        if (this.powerPillBlinkId) clearInterval(this.powerPillBlinkId);
        
        // Set timer for power pill duration
        this.powerPillTimerId = setTimeout(() => {
            this.powerPill = false;
            this.isPowerPillBlinking = false;
        }, 10000); // 10 seconds

        // Start blinking warning at 7 seconds
        this.powerPillBlinkId = setTimeout(() => {
            this.startPowerPillBlink();
        }, 7000);
    }

    startPowerPillBlink() {
        this.isPowerPillBlinking = true;
        this.powerPillBlinkId = setInterval(() => {
            this.powerPill = !this.powerPill;
        }, 250); // Blink every 250ms
    }

    stopPowerPill() {
        this.powerPill = false;
        this.isPowerPillBlinking = false;
        if (this.powerPillTimerId) clearTimeout(this.powerPillTimerId);
        if (this.powerPillBlinkId) clearInterval(this.powerPillBlinkId);
    }

    reset() {
        this.dir = null;
        this.timer = 0;
        this.powerPill = false;
        this.rotation = true;
        this.requestedDir = null;
        this.stopPowerPill();
    }
}

export default Pacman;