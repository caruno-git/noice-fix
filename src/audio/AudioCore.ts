import * as Tone from 'tone';

export type NoiseType = "white" | "pink" | "brown";

export class AudioCore {
    private static instance: AudioCore;

    public mic: Tone.UserMedia;
    public analyser: Tone.Analyser;
    public noise: Tone.Noise;
    public filter: Tone.Filter;
    public master: Tone.Gain;
    public limiter: Tone.Limiter;

    public isInitialized: boolean = false;
    public isMicOpen: boolean = false;

    private constructor() {
        // Master Output
        this.master = new Tone.Gain(0.8);
        this.limiter = new Tone.Limiter(0).toDestination();
        this.master.connect(this.limiter);

        // Microphone Input (Analysis only, not monitoring)
        this.mic = new Tone.UserMedia();
        this.analyser = new Tone.Analyser('fft', 1024); // Reduced for lower latency
        this.mic.connect(this.analyser);

        // Noise Generator
        this.filter = new Tone.Filter(20000, "lowpass");
        this.noise = new Tone.Noise("white");

        // Chain: Noise -> Filter -> Master -> Limiter -> Dest
        this.noise.connect(this.filter);
        this.filter.connect(this.master);

        this.setupMediaSession();
    }

    private setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'Shum',
                artist: 'Noise Generator',
                album: 'Focus Mode',
                artwork: [
                    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => this.startNoise());
            navigator.mediaSession.setActionHandler('pause', () => this.stopNoise());
        }
    }

    public static getInstance(): AudioCore {
        if (!AudioCore.instance) {
            AudioCore.instance = new AudioCore();
        }
        return AudioCore.instance;
    }

    /**
     * Initialize AudioContext. Must be called from a user gesture.
     */
    public async init(): Promise<void> {
        if (this.isInitialized) return;

        await Tone.start();
        console.log("Audio Context Started");
        this.isInitialized = true;
    }

    /**
     * Request Microphone Access
     */
    public async startMic(): Promise<void> {
        await this.init();
        if (this.isMicOpen) return;

        try {
            await this.mic.open();
            this.isMicOpen = true;
            console.log("Microphone connected");
        } catch (e) {
            console.error("Microphone access denied:", e);
            throw e;
        }
    }

    public stopMic(): void {
        this.mic.close();
        this.isMicOpen = false;
    }

    /**
     * Control Noise
     */
    public setNoiseType(type: NoiseType): void {
        // Ramp to avoid clicks? Tone.Noise type change is instant.
        // Better to crossfade if needed, but for MVP instant is okay.
        this.noise.type = type;
    }

    public startNoise(): void {
        if (this.noise.state === 'started') return;
        this.noise.start();
        // Fade in
        this.master.gain.rampTo(0.8, 0.5);
    }

    public stopNoise(): void {
        // Fade out
        this.master.gain.rampTo(0, 0.5);
        setTimeout(() => {
            if (this.master.gain.value === 0) {
                this.noise.stop();
            }
        }, 500);
    }

    public setAdaptive(enabled: boolean): void {
        this.adaptiveEnabled = enabled;
        if (!enabled) {
            // Reset EQ to flat
            this.eq.low.rampTo(0, 1);
            this.eq.mid.rampTo(0, 1);
            this.eq.high.rampTo(0, 1);
        }
    }
}
