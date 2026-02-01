import { useAudioStore } from './store/audioStore';
import { Visualizer } from './components/Visualizer';
import { Play, Pause, Mic, Volume2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export const App = () => {
  const { isPlaying, togglePlay, isMicActive, toggleMic } = useAudioStore();

  const handlePlay = () => {
    // Needs user gesture interaction for AudioContext
    togglePlay();
  };

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Background Blob/Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }} />

      <header className="absolute top-6 left-6 flex items-center gap-2 z-10">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold">S</div>
        <span className="font-medium tracking-tight">Shum</span>
      </header>

      <main className="w-full max-w-2xl flex flex-col gap-8 z-10">

        {/* Visualizer Container */}
        <Visualizer isActive={isPlaying} />

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">

          {/* Mic Toggle */}
          <button
            onClick={toggleMic}
            className={twMerge(
              "p-4 rounded-full transition-all duration-300 border border-white/10 backdrop-blur-sm",
              isMicActive ? "bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "bg-surface/50 text-zinc-400 hover:bg-surface hover:text-white"
            )}
            aria-label="Toggle Microphone"
          >
            <Mic size={24} />
          </button>

          {/* Main Play Button */}
          <button
            onClick={handlePlay}
            className={twMerge(
              "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl",
              isPlaying
                ? "bg-white text-black shadow-[0_0_50px_rgba(255,255,255,0.4)] scale-100"
                : "bg-white text-black hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            )}
            aria-label={isPlaying ? "Pause" : "Start"}
          >
            {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
          </button>

          {/* Volume (Placeholder for now) */}
          <button
            className="p-4 rounded-full bg-surface/50 text-zinc-400 border border-white/10 backdrop-blur-sm hover:bg-surface hover:text-white transition-all"
          >
            <Volume2 size={24} />
          </button>

        </div>

        {/* Status Text */}
        <div className="text-center space-y-2">
          <p className="text-zinc-500 text-sm font-medium tracking-wider uppercase">
            {isPlaying ? "Active Focus Mode" : "Ready to Focus"}
          </p>
          {isMicActive && (
            <p className="text-xs text-accent animate-pulse">
              Adaptive Masking Enabled
            </p>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;
