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
    // Clear canvas with dark background
    ctx.fillStyle = "#0d0b14";
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

    // Add comprehensive graph scales and legend
    // Draw dynamic range indicator
    const minValue = Math.min(...Array.from(timeData));
    const maxValue = Math.max(...Array.from(timeData));
    const dynamicRange = maxValue - minValue;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Range: ${Math.round(dynamicRange)}`, 10, 20);
    
    // Draw peak hold indicator
    let peakValue = 0;
    for (let i = 0; i < timeData.length; i++) {
      const amplitude = Math.abs(timeData[i] - 128);
      if (amplitude > peakValue) {
        peakValue = amplitude;
      }
    }
    
    const peakHeight = (peakValue / 128) * (canvasHeight / 2);
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(0, centerY - peakHeight, 3, 3);
    ctx.fillRect(0, centerY + peakHeight - 3, 3, 3);
    
    // Draw frequency scale at bottom
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    
    // Draw scale marks at key frequencies (20Hz, 100Hz, 1kHz, 10kHz, 20kHz)
    const frequencies = [20, 100, 1000, 10000, 20000];
    frequencies.forEach(freq => {
      const bin = Math.floor((freq / 22050) * timeData.length);
      const position = (bin / timeData.length) * canvasWidth;
      if (position < canvasWidth && position > 0) {
        // Draw tick mark
        ctx.beginPath();
        ctx.moveTo(position, canvasHeight - 20);
        ctx.lineTo(position, canvasHeight - 15);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw frequency label
        ctx.fillText(freq >= 1000 ? `${freq/1000}k` : `${freq}`, position, canvasHeight - 5);
      }
    });
    
    // Draw frequency axis label
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("Frequency (Hz)", canvasWidth / 2, canvasHeight - 2);
    
    // Draw amplitude scale on the left
    ctx.textAlign = "right";
    const amplitudeMarks = [
      { value: 1.0, label: "+1" },
      { value: 0.5, label: "+0.5" },
      { value: 0, label: "0" },
      { value: -0.5, label: "-0.5" },
      { value: -1.0, label: "-1" }
    ];
    
    amplitudeMarks.forEach(mark => {
      const y = centerY - (mark.value * centerY);
      // Draw tick mark
      ctx.beginPath();
      ctx.moveTo(5, y);
      ctx.lineTo(10, y);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw amplitude label
      ctx.fillText(mark.label, 0, y + 4);
    });
    
    // Draw amplitude axis label (rotated)
    ctx.save();
    ctx.translate(15, canvasHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("Amplitude", 0, 0);
    ctx.restore();
    
    // Draw legend
    const legendX = canvasWidth - 120;
    const legendY = 20;
    
    // Legend background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(legendX - 5, legendY - 15, 120, 60);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX - 5, legendY - 15, 120, 60);
    
    // Legend title
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Mirrored Bars", legendX, legendY);
    
    // Draw gradient legend
    const gradientLegendWidth = 80;
    const gradientLegendHeight = 10;
    const gradientLegendX = legendX;
    const gradientLegendY = legendY + 20;
    
    // Create horizontal gradient for legend
    const legendGradient = ctx.createLinearGradient(gradientLegendX, 0, gradientLegendX + gradientLegendWidth, 0);
    legendGradient.addColorStop(0, "#FFA500"); // Orange
    legendGradient.addColorStop(0.2, "#FFFF00"); // Yellow
    legendGradient.addColorStop(0.4, "#FFFF00"); // Yellow
    legendGradient.addColorStop(0.5, "#FF00FF"); // Magenta/Pink
    legendGradient.addColorStop(0.6, "#FF00FF"); // Magenta
    legendGradient.addColorStop(0.8, "#0000FF"); // Deep Blue
    legendGradient.addColorStop(1, "#FF0000"); // Red
    
    ctx.fillStyle = legendGradient;
    ctx.fillRect(gradientLegendX, gradientLegendY, gradientLegendWidth, gradientLegendHeight);
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(gradientLegendX, gradientLegendY, gradientLegendWidth, gradientLegendHeight);
    
    // Draw gradient labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Orange", gradientLegendX + 10, gradientLegendY + gradientLegendHeight + 10);
    ctx.fillText("Yellow", gradientLegendX + 30, gradientLegendY + gradientLegendHeight + 10);
    ctx.fillText("Magenta", gradientLegendX + 50, gradientLegendY + gradientLegendHeight + 10);
    ctx.fillText("Blue", gradientLegendX + 70, gradientLegendY + gradientLegendHeight + 10);
    
    // Draw intensity meter
    const meterWidth = 80;
    const meterHeight = 10;
    const meterX = legendX;
    const meterY = legendY + 45;
    
    // Meter background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    
    // Meter fill
    ctx.fillStyle = "#FF00FF";
    ctx.fillRect(meterX, meterY, meterWidth * intensityMultiplier / 2, meterHeight);
    
    // Meter border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    
    // Meter label
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.textAlign = "left";
    ctx.fillText("Intensity:", meterX, meterY - 2);
    
    // Meter scale
    ctx.textAlign = "center";
    ctx.fillText("0", meterX, meterY + meterHeight + 10);
    ctx.fillText("1", meterX + meterWidth, meterY + meterHeight + 10);
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!isPlaying) {
      // Clear canvas when not playing
      ctx.fillStyle = "#0d0b14";
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
        ctx.fillStyle = "#0d0b14";
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
          background: "#0d0b14",
        }}
      />
    </div>
  );
};