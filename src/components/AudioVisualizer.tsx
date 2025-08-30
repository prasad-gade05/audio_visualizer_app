import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AudioData, VisualizationConfig } from "@/types/audio";
import { BarChart3, Circle, Waves, Sparkles } from "lucide-react";

interface AudioVisualizerProps {
  audioData: AudioData;
  isPlaying: boolean;
}

export const AudioVisualizer = ({
  audioData,
  isPlaying,
}: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const [config, setConfig] = useState<VisualizationConfig>({
    type: "bars",
    color: "#3b82f6",
    sensitivity: 1,
    smoothing: 0.8,
  });

  const visualizationTypes = [
    { type: "bars" as const, icon: BarChart3, label: "Frequency Bars" },
    { type: "circular" as const, icon: Circle, label: "Circular" },
    { type: "waveform" as const, icon: Waves, label: "Waveform" },
    { type: "particles" as const, icon: Sparkles, label: "Particles" },
  ];

  const drawBars = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number
  ) => {
    const barCount = 64;
    const barWidth = width / barCount;
    const dataStep = Math.floor(data.length / barCount);

    ctx.clearRect(0, 0, width, height);

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
      gradient.addColorStop(1, config.color + "40");

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
    const radius = Math.min(width, height) / 4;
    const barCount = 128;
    const angleStep = (Math.PI * 2) / barCount;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < barCount; i++) {
      const value = data[i] / 255;
      const angle = i * angleStep;
      const barLength = value * radius * config.sensitivity;

      const startX = centerX + Math.cos(angle) * radius;
      const startY = centerY + Math.sin(angle) * radius;
      const endX = centerX + Math.cos(angle) * (radius + barLength);
      const endY = centerY + Math.sin(angle) * (radius + barLength);

      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, config.color + "80");
      gradient.addColorStop(1, config.color);

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
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = config.color;
    ctx.lineWidth = 2;
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
  };

  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height);

    // Increased particle count for more density
    const baseParticleCount = 200;
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
        size = Math.max(2, (lowFreq / 255) * 15 * config.sensitivity);
        alpha = Math.max(0.3, (lowFreq / 255) * 0.9);
        color = `hsla(240, 80%, 60%, ${alpha})`;
      } else if (particleType === 1) {
        // Mid frequency particles - medium size, scattered
        x = Math.random() * width;
        y = Math.random() * height;
        size = Math.max(1, (midFreq / 255) * 12 * config.sensitivity);
        alpha = Math.max(0.2, (midFreq / 255) * 0.8);
        color = `hsla(180, 70%, 50%, ${alpha})`;
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
        size = Math.max(0.5, (highFreq / 255) * 8 * config.sensitivity);
        alpha = Math.max(0.1, (highFreq / 255) * 0.7);
        color = `hsla(60, 90%, 70%, ${alpha})`;
      }

      // Add glow effect for brighter particles
      if (alpha > 0.5) {
        ctx.shadowColor = color;
        ctx.shadowBlur = size * 2;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add connecting lines between nearby particles for network effect
    if (avgFrequency > 50) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `hsla(200, 50%, 50%, ${Math.min(
        0.3,
        (avgFrequency / 255) * 0.5
      )})`;
      ctx.lineWidth = 1;

      const connectionDistance = 80;
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

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

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
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Debug logging
      if (audioData.frequencyData.length === 0) {
        console.log("No frequency data available yet");
      }

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

  return (
    <Card className="p-6 bg-black/90 border-gray-800 overflow-hidden">
      <div className="space-y-4">
        {/* Visualization Type Selector */}
        <div className="flex flex-wrap gap-2">
          {visualizationTypes.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              variant={config.type === type ? "default" : "outline"}
              size="sm"
              onClick={() => setConfig((prev) => ({ ...prev, type }))}
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
