import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AudioData, VisualizationConfig } from "@/types/audio";
import { BarChart3, Circle, Waves, Sparkles, Activity } from "lucide-react";

interface AudioVisualizerProps {
  audioData: AudioData;
  isPlaying: boolean;
  fullScreen?: boolean;
  config?: VisualizationConfig;
  onConfigChange?: (config: VisualizationConfig) => void;
}

export const AudioVisualizer = ({
  audioData,
  isPlaying,
  fullScreen = false,
  config: externalConfig,
  onConfigChange,
}: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const [internalConfig, setInternalConfig] = useState<VisualizationConfig>({
    type: "bars",
    color: "#8A42FF",
    sensitivity: 1,
    smoothing: 0.8,
    secondaryColor: "#00D1FF",
    backgroundColor: "#0D0B14",
  });

  // Use external config if provided, otherwise use internal config
  const config = externalConfig || internalConfig;
  const setConfig = onConfigChange || setInternalConfig;

  const visualizationTypes = [
    { type: "bars" as const, icon: BarChart3, label: "Frequency Bars" },
    { type: "circular" as const, icon: Circle, label: "Circular" },
    { type: "waveform" as const, icon: Waves, label: "Waveform" },
    { type: "particles" as const, icon: Sparkles, label: "Particles" },
    { type: "mirrored-waveform" as const, icon: Activity, label: "Mirrored Waveform" },
  ];

  const drawBars = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number
  ) => {
    const barCount = config.barCount || 64;
    const barWidth = width / barCount;
    const dataStep = Math.floor(data.length / barCount);

    // Clear with custom background if in full screen
    if (fullScreen && config.backgroundColor) {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    for (let i = 0; i < barCount; i++) {
      const value = data[i * dataStep] / 255;
      const barHeight = value * height * config.sensitivity;

      const gradient = ctx.createLinearGradient(
        0,
        height,
        0,
        height - barHeight
      );
      gradient.addColorStop(0, config.color);
      gradient.addColorStop(1, config.secondaryColor || config.color + "40");

      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
    }
  };

  const drawCircular = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) / 6;
    const radius = baseRadius * (config.radius || 1);
    const barCount = 128;
    const angleStep = (Math.PI * 2) / barCount;

    // Clear with custom background if in full screen
    if (fullScreen && config.backgroundColor) {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    for (let i = 0; i < barCount; i++) {
      const value = data[i] / 255;
      const angle = i * angleStep;
      const barLength =
        value * radius * config.sensitivity * (config.intensity || 1);

      const startX = centerX + Math.cos(angle) * radius;
      const startY = centerY + Math.sin(angle) * radius;
      const endX = centerX + Math.cos(angle) * (radius + barLength);
      const endY = centerY + Math.sin(angle) * (radius + barLength);

      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, config.color + "80");
      gradient.addColorStop(1, config.secondaryColor || config.color);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  };

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number
  ) => {
    // Clear with custom background if in full screen
    if (fullScreen && config.backgroundColor) {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    ctx.strokeStyle = config.color;
    ctx.lineWidth = fullScreen ? 3 : 2;
    ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = (data[i] / 128.0) * config.sensitivity;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Add secondary waveform if secondary color is defined
    if (config.secondaryColor) {
      ctx.strokeStyle = config.secondaryColor;
      ctx.lineWidth = fullScreen ? 2 : 1;
      ctx.beginPath();

      x = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] / 128.0) * config.sensitivity * 0.7;
        const y = height - (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }
      ctx.stroke();
    }
  };

  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number
  ) => {
    // Clear with custom background if in full screen
    if (fullScreen && config.backgroundColor) {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    // Use configurable particle count
    const baseParticleCount = config.particleCount || (fullScreen ? 400 : 200);
    const avgFrequency = data.reduce((sum, val) => sum + val, 0) / data.length;

    // Make particle count responsive to audio intensity
    const dynamicParticleCount = Math.floor(
      baseParticleCount + (avgFrequency / 255) * 100 * config.sensitivity
    );

    // Calculate frequency bands for different particle behaviors
    const lowFreq = data.slice(0, 32).reduce((sum, val) => sum + val, 0) / 32;
    const midFreq = data.slice(32, 96).reduce((sum, val) => sum + val, 0) / 64;
    const highFreq =
      data.slice(96).reduce((sum, val) => sum + val, 0) / (data.length - 96);

    for (let i = 0; i < dynamicParticleCount; i++) {
      // Different particle types based on frequency bands
      const particleType = i % 3;
      let x, y, size, alpha, color;

      if (particleType === 0) {
        // Low frequency particles - larger, slower, center-focused
        const angle = Math.random() * Math.PI * 2;
        const distance =
          (lowFreq / 255) * Math.min(width, height) * 0.3 * config.sensitivity;
        x = width / 2 + Math.cos(angle) * distance;
        y = height / 2 + Math.sin(angle) * distance;
        size = Math.max(
          2,
          (lowFreq / 255) * (fullScreen ? 20 : 15) * config.sensitivity
        );
        alpha = Math.max(0.3, (lowFreq / 255) * 0.9);
        color = config.color;
      } else if (particleType === 1) {
        // Mid frequency particles - medium size, scattered
        x = Math.random() * width;
        y = Math.random() * height;
        size = Math.max(
          1,
          (midFreq / 255) * (fullScreen ? 16 : 12) * config.sensitivity
        );
        alpha = Math.max(0.2, (midFreq / 255) * 0.8);
        color = config.secondaryColor || config.color;
      } else {
        // High frequency particles - small, fast, edge-focused
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
          case 0:
            x = Math.random() * width;
            y = 0;
            break;
          case 1:
            x = width;
            y = Math.random() * height;
            break;
          case 2:
            x = Math.random() * width;
            y = height;
            break;
          default:
            x = 0;
            y = Math.random() * height;
            break;
        }
        size = Math.max(
          0.5,
          (highFreq / 255) * (fullScreen ? 12 : 8) * config.sensitivity
        );
        alpha = Math.max(0.1, (highFreq / 255) * 0.7);
        color = config.secondaryColor || config.color;
      }

      // Add glow effect for brighter particles
      if (alpha > 0.5 && fullScreen) {
        ctx.shadowColor = color;
        ctx.shadowBlur = size * 2;
      } else {
        ctx.shadowBlur = 0;
      }

      // Convert hex color to rgba
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 138, g: 66, b: 255 };
      };

      const rgb = hexToRgb(color);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add connecting lines between nearby particles for network effect
    if (avgFrequency > 50 && fullScreen) {
      ctx.shadowBlur = 0;

      // Convert hex color to rgba helper function
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 138, g: 66, b: 255 };
      };

      const rgb = hexToRgb(config.color);
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(
        0.3,
        (avgFrequency / 255) * 0.5
      )})`;
      ctx.lineWidth = 1;

      const connectionDistance = fullScreen ? 120 : 80;
      const maxConnections = Math.floor(dynamicParticleCount / 10);

      for (let i = 0; i < maxConnections; i++) {
        const x1 = Math.random() * width;
        const y1 = Math.random() * height;
        const x2 = x1 + (Math.random() - 0.5) * connectionDistance;
        const y2 = y1 + (Math.random() - 0.5) * connectionDistance;

        if (x2 >= 0 && x2 <= width && y2 >= 0 && y2 <= height) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }
  };

  const drawMirroredWaveform = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number
  ) => {
    // Clear canvas with black background
    if (fullScreen && config.backgroundColor) {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
    }

    if (!data || data.length === 0) return;

    const centerY = height / 2;
    const barWidth = width / data.length;
    
    // Create horizontal gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#FFA500"); // Orange
    gradient.addColorStop(0.2, "#FFFF00"); // Yellow
    gradient.addColorStop(0.4, "#FFFF00"); // Yellow
    gradient.addColorStop(0.5, "#FF00FF"); // Magenta/Pink
    gradient.addColorStop(0.6, "#FF00FF"); // Magenta
    gradient.addColorStop(0.8, "#0000FF"); // Deep Blue
    gradient.addColorStop(1, "#FF0000"); // Red
    
    ctx.fillStyle = gradient;

    // Calculate overall volume for dynamic intensity
    const avgAmplitude = data.reduce((sum, val) => sum + Math.abs(val - 128), 0) / data.length;
    const intensityMultiplier = Math.max(0.3, Math.min(2.0, avgAmplitude / 64)) * config.sensitivity;

    // Draw mirrored bars
    for (let i = 0; i < data.length; i++) {
      // Normalize amplitude from 0-255 to -1 to 1
      const amplitude = (data[i] - 128) / 128;
      
      // Calculate bar height with intensity modulation
      const barHeight = Math.abs(amplitude) * (height / 2) * intensityMultiplier;
      
      // Calculate x position
      const x = i * barWidth;
      
      // Draw upper bar (extending upward from center)
      ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);
      
      // Draw lower bar (extending downward from center)
      ctx.fillRect(x, centerY, barWidth, barHeight);
    }
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Ensure canvas fits exactly within container bounds
    const width = Math.max(rect.width, 100);
    const height = Math.max(rect.height, 100);

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 100);
      const height = Math.max(rect.height, 100);

      if (!isPlaying) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      // Check if we have valid audio data
      if (audioData.frequencyData.length === 0) {
        // Continue animation loop even without data
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      switch (config.type) {
        case "bars":
          drawBars(ctx, audioData.frequencyData, width, height);
          break;
        case "circular":
          drawCircular(ctx, audioData.frequencyData, width, height);
          break;
        case "waveform":
          drawWaveform(ctx, audioData.timeData, width, height);
          break;
        case "particles":
          drawParticles(ctx, audioData.frequencyData, width, height);
          break;
        case "mirrored-waveform":
          drawMirroredWaveform(ctx, audioData.timeData, width, height);
          break;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioData, isPlaying, config]);

  useEffect(() => {
    resizeCanvas();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  return fullScreen ? (
    // Full-screen mode for PlayerView
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-contain"
      />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="text-center"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <Waves className="w-20 h-20 mx-auto mb-6 opacity-50" />
            <p className="text-2xl font-medium">
              Play audio to see visualization
            </p>
          </div>
        </div>
      )}
    </div>
  ) : (
    // Card mode for embedded view
    <Card className="p-6 bg-black/90 border-gray-800 overflow-hidden">
      <div className="space-y-4">
        {/* Visualization Type Selector */}
        <div className="flex flex-wrap gap-2">
          {visualizationTypes.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              variant={config.type === type ? "default" : "outline"}
              size="sm"
              onClick={() => (setConfig ? setConfig({ ...config, type }) : {})}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Canvas Container */}
        <div
          ref={containerRef}
          className="relative bg-black rounded-lg overflow-hidden w-full h-[400px]"
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Waves className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Play audio to see visualization</p>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex justify-between items-center">
          <Badge variant={isPlaying ? "default" : "secondary"}>
            {isPlaying ? "Visualizing" : "Paused"}
          </Badge>
          <div className="text-sm text-gray-400">
            {audioData.frequencyData.length} frequency bins
          </div>
        </div>
      </div>
    </Card>
  );
};
