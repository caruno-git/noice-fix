import { create } from 'zustand';
import { AudioCore, type NoiseType } from '../audio/AudioCore';

interface AudioState {
    isPlaying: boolean;
    volume: number;
    noiseType: NoiseType;
    isMicActive: boolean;

    // Actions
    togglePlay: () => Promise<void>;
    setVolume: (val: number) => void;
    setNoiseType: (type: NoiseType) => void;
    toggleMic: () => Promise<void>;
    setAdaptive: (enabled: boolean) => void;
    startAudio: () => Promise<void>; // Explicit start specifically for user gesture
}

export const useAudioStore = create<AudioState>((set, get) => ({
    isPlaying: false,
    volume: 0.8,
    noiseType: 'white',
    isMicActive: false,
    isAdaptive: false,

    togglePlay: async () => {
        const core = AudioCore.getInstance();
        await core.init(); // Ensure context is started

        const { isPlaying } = get();
        if (isPlaying) {
            core.stopNoise();
            set({ isPlaying: false });
        } else {
            core.startNoise();
            set({ isPlaying: true });
        }
    },

    setVolume: (val) => {
        const core = AudioCore.getInstance();
        core.setVolume(val);
        set({ volume: val });
    },

    setNoiseType: (type) => {
        const core = AudioCore.getInstance();
        core.setNoiseType(type);
        set({ noiseType: type });
    },

    setAdaptive: (enabled) => {
        const core = AudioCore.getInstance();
        core.setAdaptive(enabled);
        set({ isAdaptive: enabled }); // Note: Add isAdaptive property to interface if missing
    },

    toggleMic: async () => {
        const core = AudioCore.getInstance();
        const { isMicActive } = get();

        if (isMicActive) {
            core.stopMic();
            set({ isMicActive: false });
        } else {
            try {
                await core.startMic();
                set({ isMicActive: true });
            } catch (err) {
                console.error("Mic failed", err);
                // Handle error state if needed
            }
        }
    },

    startAudio: async () => {
        const core = AudioCore.getInstance();
        await core.init();
    }
}));
