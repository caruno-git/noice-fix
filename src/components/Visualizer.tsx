import React, { useEffect, useRef } from 'react';
import { AudioCore } from '../audio/AudioCore';

interface VisualizerProps {
    isActive: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const core = AudioCore.getInstance();
        // Use a buffer for smoothing if needed, but Tone.Analyser returns TypedArray

        const render = () => {
            if (!isActive) {
                // Fade out effect
                ctx.fillStyle = 'rgba(9, 9, 11, 0.2)'; // Zinc-950 with fade
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                // animationRef.current = requestAnimationFrame(render); 
                // Don't loop endlessly if inactive to save battery on PWA
                return;
            }

            // Get Frequency Data
            // getValue() returns Float32Array in dB usually, but since we set 'fft' and want 'byte' typical behavior
            // We might need to handle Tone.Analyser specifics.
            // Tone.Analyser.getValue() returns Float32Array usually.
            // Let's us raw web audio node for byte data if performance is key? 
            // Or just map Float32.

            // Tone.js analyser.getValue() returns Float32Array of decibels. Range ~ -100 to 0.
            const data = core.analyser.getValue();
            // Standardize to 0-255 for drawing

            // Clear
            ctx.fillStyle = '#09090b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / data.length) * 2.5;
            let x = 0;

            for (let i = 0; i < data.length; i++) {
                const val = data[i] as number; // -100 to -30 usually
                // Map -100dB (min) to 0 (max) -> 0 to 1
                // Actually Tone.js returns -Infinity for silence.

                let percent = (val + 100) / 70; // Map -100..-30 to 0..1
                if (percent < 0) percent = 0;
                if (percent > 1) percent = 1;

                const barHeight = percent * canvas.height;

                // Gradient or premium color
                // const hue = i * 2;
                // ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

                // Premium white/zinc look
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
                gradient.addColorStop(0, '#3b82f6'); // Blue-500
                gradient.addColorStop(1, '#fafafa'); // Zinc-50

                ctx.fillStyle = gradient;

                // Rounded tops?
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }

            animationRef.current = requestAnimationFrame(render);
        };

        if (isActive) {
            render();
        } else {
            // One clear frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isActive]);

    // Handle high-DPI scaling
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth * window.devicePixelRatio;
                canvas.height = parent.clientHeight * window.devicePixelRatio;

                // Helper to scale context? Or just handle in render
                // For simplicity, we just use logical pixels in CSS and raw in Canvas
            }
        };

        window.addEventListener('resize', resize);
        resize();

        return () => window.removeEventListener('resize', resize);
    }, []);

    return (
        <div className="w-full h-64 md:h-96 relative flex items-center justify-center rounded-3xl overflow-hidden bg-surface/50 border border-white/5 backdrop-blur-md shadow-2xl">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};
