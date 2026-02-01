import * as Tone from 'tone';

export type NoiseType = "white" | "pink" | "brown";

export class AudioCore {
    private static instance: AudioCore;

    public mic: Tone.UserMedia;
    public analyser: Tone.Analyser;
    public noise: Tone.Noise;
    public eq: Tone.EQ3;
    public filter: Tone.Filter;
    public master: Tone.Gain;
    public limiter: Tone.Limiter;

    public isInitialized: boolean = false;
    public isMicOpen: boolean = false;
    public adaptiveEnabled: boolean = false;
    // @ts-ignore
    private analysisInterval: number | null = null;

    private constructor() {
        // Microphone Input (Analysis only)
        this.mic = new Tone.UserMedia();
        this.analyser = new Tone.Analyser('fft', 1024);
        this.mic.connect(this.analyser);

        // Noise Chain: Noise -> EQ3 -> Filter -> Master -> Limiter -> Dest
        this.noise = new Tone.Noise("white");
        this.eq = new Tone.EQ3(0, 0, 0); // Low/Mid/High gain in dB
        this.filter = new Tone.Filter(20000, "lowpass");
        this.master = new Tone.Gain(0); // Start muted
        this.limiter = new Tone.Limiter(0).toDestination();

        this.noise.connect(this.eq);
        this.eq.connect(this.filter);
        this.filter.connect(this.master);
        this.master.connect(this.limiter);

        this.setupMediaSession();
        this.startAnalysisLoop();
    }

    public static getInstance(): AudioCore {
        if (!AudioCore.instance) {
            AudioCore.instance = new AudioCore();
        }
        return AudioCore.instance;
    }

    public async init(): Promise<void> {
        if (this.isInitialized) return;
        await Tone.start();
        console.log("Audio Context Started");

        // Start Noise generator immediately but muted
        if (this.noise.state !== 'started') {
            this.noise.start();
        }

        this.isInitialized = true;
    }

    public async startMic(): Promise<void> {
        await this.init();
        if (this.isMicOpen) return;
        try {
            await this.mic.open();
            this.isMicOpen = true;
            console.log("Mic Connected");
        } catch (e) {
            console.error("Mic Error:", e);
            throw e;
        }
    }

    public stopMic(): void {
        this.mic.close();
        this.isMicOpen = false;
    }

    public setNoiseType(type: NoiseType): void {
        this.noise.type = type;
    }

    public startNoise(): void {
        // Just fade in volume. Noise source is always running.
        this.master.gain.rampTo(0.8, 0.5);
    }

    public stopNoise(): void {
        // Just fade out volume.
        this.master.gain.rampTo(0, 0.5);
    }

    public setVolume(value: number): void {
        this.master.gain.rampTo(value, 0.1);
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

    private startAnalysisLoop() {
        this.analysisInterval = window.setInterval(() => {
            if (!this.adaptiveEnabled || !this.isMicOpen) return;

            const values = this.analyser.getValue();
            if (values instanceof Float32Array) {
                // Spectrum: 0-1024 bins.
                const low = this.getAverageDb(values, 0, 10);   // Bass
                const mid = this.getAverageDb(values, 10, 100); // Mids
                const high = this.getAverageDb(values, 100, 400); // Highs

                this.applyAdaptiveGain(this.eq.low, low);
                this.applyAdaptiveGain(this.eq.mid, mid);
                this.applyAdaptiveGain(this.eq.high, high);
            }
        }, 100);
    }

    private getAverageDb(data: Float32Array, start: number, end: number): number {
        let sum = 0;
        let count = 0;
        for (let i = start; i < end; i++) {
            let val = data[i];
            if (val > -100) { // Filter silence
                sum += val;
                count++;
            }
        }
        return count > 0 ? sum / count : -100;
    }

    private applyAdaptiveGain(param: Tone.Param<any>, inputDb: number) {
        // Input -100 (silent) to -30 (loud)
        // Target: Boost EQ when loud using simple inverse curve or positive mask?
        // Masking: If noise is loud (input), we need MORE noise to mask it.

        let targetGain = 0;
        if (inputDb > -60) {
            // Active noise detected
            // Map -60...-20 to 0...+12dB
            targetGain = ((inputDb + 60) / 40) * 12;
        } else {
            // Quiet
            targetGain = 0;
        }

        // Clamp
        targetGain = Math.min(Math.max(targetGain, 0), 15);
        param.rampTo(targetGain, 0.2);
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
}
