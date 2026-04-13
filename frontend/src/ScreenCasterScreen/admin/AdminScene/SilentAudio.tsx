import {Component} from 'react';

export class SilentAudio extends Component {
    private audioCtx: AudioContext | null = null;
    private isRunning: boolean = false;

    componentDidMount() {
        const startAudio = () => this.initAudio(startAudio);

        window.addEventListener('click', startAudio);
        window.addEventListener('keydown', startAudio);
        window.addEventListener('touchstart', startAudio);
    }

    componentWillUnmount() {
        this.stopAudio();
    }

    private initAudio = (cleanupFn: () => void) => {
        if (this.isRunning) return;

        try {
            // AudioContext initialisieren
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();

            gainNode.gain.value = 0;

            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);

            oscillator.start();
            this.isRunning = true;
            console.log("Silent Audio: aktiv");

            // Aufräumen der Event-Listener nach erfolgreichem Start
            window.removeEventListener('click', cleanupFn);
            window.removeEventListener('keydown', cleanupFn);
            window.removeEventListener('touchstart', cleanupFn);
        } catch (e) {
            console.error(e);
        }
    };

    private stopAudio() {
        if (this.audioCtx) {
            this.audioCtx.close();
            this.isRunning = false;
        }
    }

    render() {
        // Die Komponente muss nichts rendern
        return null;
    }
}