import { useEffect, useRef } from "react";
import { AudioData } from "@/types/audio";

interface MirroredWaveformVisualizerProps {
  audioData: AudioData;
  isPlaying: boolean;
  className?: string;
  width?: number;
  height?: number;
}

export const MirroredWaveformVisualizer = ({
  audioData,
  isPlaying,
  className = "",
  width = 800,
  height = 400,
}: MirroredWaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Create a vibrant horizontal gradient
  const createGradient = (ctx: CanvasRenderingContext2D, width: number) => {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    
    // Left side: Orange to Yellow
    gradient.addColorStop(0, "#FFA500"); // Orange
    gradient.addColorStop(0.2, "#FFFF00"); // Yellow
    
    // Center: Yellow to Magenta/Pink
    gradient.addColorStop(0.4, "#FFFF00"); // Yellow
    gradient.addColorStop(0.5, "#FF00FF"); // Magenta/Pink
    
    // Right side: Magenta to Deep Blue to Red
    gradient.addColorStop(0.6, "#FF00FF"); // Magenta
    gradient.addColorStop(0.8, "#0000FF"); // Deep Blue
    gradient.addColorStop(1, "#FF0000"); // Red
    
    return gradient;
  };

  const drawMirroredWaveform = (
    ctx: CanvasRenderingContext2D,
    timeData: Uint8Array,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Clear canvas with black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (!timeData || timeData.length === 0) return;

    const centerY = canvasHeight / 2;
    const barWidth = canvasWidth / timeData.length;
    
    // Create the horizontal gradient
    const gradient = createGradient(ctx, canvasWidth);
    ctx.fillStyle = gradient;

    // Calculate overall volume for dynamic intensity
    const avgAmplitude = timeData.reduce((sum, val) => sum + Math.abs(val - 128), 0) / timeData.length;
    const intensityMultiplier = Math.max(0.3, Math.min(2.0, avgAmplitude / 64));

    // Draw mirrored bars
    for (let i = 0; i < timeData.length; i++) {
      // Normalize amplitude from 0-255 to -1 to 1
      const amplitude = (timeData[i] - 128) / 128;
      
      // Calculate bar height with intensity modulation
      const barHeight = Math.abs(amplitude) * (canvasHeight / 2) * intensityMultiplier;
      
      // Calculate x position
      const x = i * barWidth;
      
      // Draw upper bar (extending upward from center)
      ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);
      
      // Draw lower bar (extending downward from center)
      ctx.fillRect(x, centerY, barWidth, barHeight);
    }
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!isPlaying) {
      // Clear canvas when not playing
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Use time domain data for waveform visualization
    if (audioData.timeData && audioData.timeData.length > 0) {
      drawMirroredWaveform(ctx, audioData.timeData, canvas.width, canvas.height);
    }

    // Continue animation loop
    animationRef.current = requestAnimationFrame(render);
  };

  // Initialize canvas and start animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Start animation loop when playing
    if (isPlaying) {
      render();
    } else {
      // Clear canvas when stopped
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }
    }

    // Cleanup animation frame on unmount or when isPlaying changes
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, width, height]);

  // Update render loop when audioData changes
  useEffect(() => {
    if (isPlaying && !animationRef.current) {
      render();
    }
  }, [audioData, isPlaying]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          background: "#000000",
        }}
      />
    </div>
  );
};