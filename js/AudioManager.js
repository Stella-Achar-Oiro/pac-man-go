class AudioManager {
    constructor() {
        this.context = null;
        this.sounds = {};
        this.initialized = false;
        
        // Create audio context on user interaction
        document.addEventListener('click', () => this.initAudioContext(), { once: true });
        document.addEventListener('keydown', () => this.initAudioContext(), { once: true });
    }

    initAudioContext() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            this.createSounds();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    async createSounds() {
        // Create oscillator-based sounds instead of loading audio files
        if (!this.context) return;

        // Game start sound (descending tone)
        this.sounds.start = () => this.createTone(523.25, 0.3, 'sine', 0.2);  // C5 note

        // Death sound (descending tone)
        this.sounds.death = () => this.createTone(440, 0.3, 'sawtooth', -0.3);  // A4 note

        // Eat dot sound (short beep)
        this.sounds.eat_dot = () => this.createTone(660, 0.05, 'sine');  // E5 note

        // Eat ghost sound (ascending tone)
        this.sounds.eat_ghost = () => this.createTone(880, 0.2, 'square', 0.3);  // A5 note

        // Power pellet sound (repeated beep)
        this.sounds.power_pellet = () => {
            this.createTone(440, 0.1, 'square');
            setTimeout(() => this.createTone(440, 0.1, 'square'), 200);
        };

        // Siren sound (alternating tones)
        this.sounds.siren = () => {
            if (this._sirenInterval) return;
            const frequencies = [440, 466.16];  // A4 and Bb4
            let index = 0;
            this._sirenInterval = setInterval(() => {
                this.createTone(frequencies[index], 0.2, 'triangle', 0);
                index = (index + 1) % frequencies.length;
            }, 500);
        };
    }

    createTone(frequency, duration, type = 'sine', pitch_shift = 0) {
        if (!this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
        if (pitch_shift) {
            oscillator.frequency.exponentialRampToValueAtTime(
                frequency * (1 + pitch_shift),
                this.context.currentTime + duration
            );
        }

        gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.start();
        oscillator.stop(this.context.currentTime + duration);
    }

    play(soundName) {
        if (!this.initialized) {
            this.initAudioContext();
        }
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound();
        }
    }

    stop(soundName) {
        if (soundName === 'siren' && this._sirenInterval) {
            clearInterval(this._sirenInterval);
            this._sirenInterval = null;
        }
    }

    stopAll() {
        if (this._sirenInterval) {
            clearInterval(this._sirenInterval);
            this._sirenInterval = null;
        }
    }
}

export default AudioManager; 