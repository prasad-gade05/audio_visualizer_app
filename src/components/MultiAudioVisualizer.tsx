import { useEffect, useRef, useState } from "react";
import { AudioData, MultiVisualizationConfig } from "@/types/audio";
import { Waves } from "lucide-react";
import { GridDraggableVisualizationItem } from "./GridDraggableVisualizationItem";
import { DragInstructions } from "./DragInstructions";
import { AdvancedAudioAnalytics } from "./AdvancedAudioAnalytics";

interface MultiAudioVisualizerProps {
  audioData: AudioData;
  isPlaying: boolean;
  config: MultiVisualizationConfig;
  onConfigChange?: (config: MultiVisualizationConfig) => void;
}

export const MultiAudioVisualizer = ({
  audioData,
  isPlaying,
  config,
  onConfigChange,
}: MultiAudioVisualizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const canvasRefs = useRef<{
    bars: HTMLCanvasElement | null;
    circular: HTMLCanvasElement | null;
    waveform: HTMLCanvasElement | null;
    particles: HTMLCanvasElement | null;
    "mirrored-waveform": HTMLCanvasElement | null;
    analytics: HTMLCanvasElement | null;
  }>({
    bars: null,
    circular: null,
    waveform: null,
    particles: null,
    "mirrored-waveform": null,
    analytics: null,
  });
  const animationRef = useRef<number | null>(null);

  // Get enabled visualizations
  const enabledVisualizations = Object.entries(config.enabled)
    .filter(([_, enabled]) => enabled)
    .map(([type, _]) => type as keyof typeof config.enabled);

  // Validate and fix any duplicate grid slots
  useEffect(() => {
    const positions = config.positions;
    const usedSlots = new Set<number>();
    const duplicates: string[] = [];
    
    // Find duplicates
    Object.entries(positions).forEach(([type, position]) => {
      if (config.enabled[type as keyof typeof config.enabled]) {
        if (usedSlots.has(position.gridSlot)) {
          duplicates.push(type);
        } else {
          usedSlots.add(position.gridSlot);
        }
      }
    });
    
    // Fix duplicates by reassigning to next available slots
    if (duplicates.length > 0) {
      console.warn(`Found duplicate grid slots, fixing:`, duplicates);
      
      const newPositions = { ...positions };
      let nextAvailableSlot = 0;
      
      duplicates.forEach(duplicateType => {
        // Find next available slot
        while (usedSlots.has(nextAvailableSlot)) {
          nextAvailableSlot++;
        }
        
        newPositions[duplicateType as keyof typeof positions] = {
          ...newPositions[duplicateType as keyof typeof positions],
          gridSlot: nextAvailableSlot,
        };
        
        usedSlots.add(nextAvailableSlot);
        nextAvailableSlot++;
      });
      
      if (onConfigChange) {
        onConfigChange({
          ...config,
          positions: newPositions,
        });
      }
    }
  }, [config.enabled, config.positions, onConfigChange]);

  // Hide instructions after 8 seconds or on first interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false);
    }, 8000);

    const handleInteraction = () => {
      setShowInstructions(false);
      clearTimeout(timer);
    };

    document.addEventListener('mousedown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Handle position changes (grid slot swapping)
  const handlePositionChange = (type: string, newGridSlot: number) => {
    setShowInstructions(false); // Hide instructions on first drag
    if (onConfigChange) {
      onConfigChange({
        ...config,
        positions: {
          ...config.positions,
          [type]: {
            ...config.positions[type as keyof typeof config.positions],
            gridSlot: newGridSlot,
          },
        },
      });
    }
  };

  // Handle grid slot swapping between two visualizations
  const handleGridSlotSwap = (draggedType: string, targetType: string) => {
    setShowInstructions(false); // Hide instructions on first drag
    if (onConfigChange) {
      const draggedPosition = config.positions[draggedType as keyof typeof config.positions];
      const targetPosition = config.positions[targetType as keyof typeof config.positions];
      
      if (draggedPosition && targetPosition) {
        // Ensure we're not swapping identical slots (safety check)
        if (draggedPosition.gridSlot === targetPosition.gridSlot) {
          console.warn(`Attempted to swap identical grid slots (${draggedPosition.gridSlot}) - ignoring swap`);
          return;
        }
        
        // Swap the grid slots in a single atomic operation
        onConfigChange({
          ...config,
          positions: {
            ...config.positions,
            [draggedType]: {
              ...draggedPosition,
              gridSlot: targetPosition.gridSlot,
            },
            [targetType]: {
              ...targetPosition,
              gridSlot: draggedPosition.gridSlot,
            },
          },
        });
      }
    }
  };

  // Sort visualizations by grid slot for consistent ordering
  const sortedVisualizations = [...enabledVisualizations].sort((a, b) => {
    const slotA = config.positions[a]?.gridSlot ?? 0;
    const slotB = config.positions[b]?.gridSlot ?? 0;
    return slotA - slotB;
  });

  const getGridLayout = (count: number) => {
    switch (count) {
      case 1:
        return { gridCols: "grid-cols-1", rows: "grid-rows-1", aspectRatio: "16:9" };
      case 2:
        return { gridCols: "grid-cols-2", rows: "grid-rows-1", aspectRatio: "4:3" };
      case 3:
        return { gridCols: "grid-cols-2", rows: "grid-rows-2", aspectRatio: "auto" }; // 2x2 grid with one empty
      case 4:
        return { gridCols: "grid-cols-2", rows: "grid-rows-2", aspectRatio: "1:1" };
      case 5:
        return { gridCols: "grid-cols-3", rows: "grid-rows-2", aspectRatio: "auto" }; // 3x2 grid with one empty
      case 6:
        return { gridCols: "grid-cols-3", rows: "grid-rows-2", aspectRatio: "auto" }; // 3x2 grid
      default:
        return { gridCols: "grid-cols-2", rows: "grid-rows-2", aspectRatio: "auto" };
    }
  };

  const { gridCols, rows, aspectRatio } = getGridLayout(sortedVisualizations.length);

  // Drawing functions
  const drawBars = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    config: MultiVisualizationConfig["configs"]["bars"]
  ) => {
    const barCount = config.barCount || 32;
    const barWidth = width / barCount;
    const dataStep = Math.floor(data.length / barCount);

    ctx.fillStyle = config.backgroundColor || "#0D0B14";
    ctx.fillRect(0, 0, width, height);

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
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    }
  };

  const drawCircular = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    config: MultiVisualizationConfig["configs"]["circular"]
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) / 4; // Increased from /8 to /4
    const radius = baseRadius * (config.radius || 1);
    const barCount = 64;
    const angleStep = (Math.PI * 2) / barCount;

    ctx.fillStyle = config.backgroundColor || "#0D0B14";
    ctx.fillRect(0, 0, width, height);

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
      ctx.lineWidth = 2;
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
    height: number,
    config: MultiVisualizationConfig["configs"]["waveform"]
  ) => {
    ctx.fillStyle = config.backgroundColor || "#0D0B14";
    ctx.fillRect(0, 0, width, height);

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

    if (config.secondaryColor) {
      ctx.strokeStyle = config.secondaryColor;
      ctx.lineWidth = 1;
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
    height: number,
    config: MultiVisualizationConfig["configs"]["particles"]
  ) => {
    ctx.fillStyle = config.backgroundColor || "#0D0B14";
    ctx.fillRect(0, 0, width, height);

    const baseParticleCount = config.particleCount || 100;
    const avgFrequency = data.reduce((sum, val) => sum + val, 0) / data.length;
    const dynamicParticleCount = Math.floor(
      baseParticleCount + (avgFrequency / 255) * 50 * config.sensitivity
    );

    const lowFreq = data.slice(0, 32).reduce((sum, val) => sum + val, 0) / 32;
    const midFreq = data.slice(32, 96).reduce((sum, val) => sum + val, 0) / 64;
    const highFreq =
      data.slice(96).reduce((sum, val) => sum + val, 0) / (data.length - 96);

    for (let i = 0; i < dynamicParticleCount; i++) {
      const particleType = i % 3;
      let x, y, size, alpha, color;

      if (particleType === 0) {
        const angle = Math.random() * Math.PI * 2;
        const distance =
          (lowFreq / 255) * Math.min(width, height) * 0.2 * config.sensitivity;
        x = width / 2 + Math.cos(angle) * distance;
        y = height / 2 + Math.sin(angle) * distance;
        size = Math.max(1, (lowFreq / 255) * 8 * config.sensitivity);
        alpha = Math.max(0.3, (lowFreq / 255) * 0.9);
        color = config.color;
      } else if (particleType === 1) {
        x = Math.random() * width;
        y = Math.random() * height;
        size = Math.max(0.5, (midFreq / 255) * 6 * config.sensitivity);
        alpha = Math.max(0.2, (midFreq / 255) * 0.8);
        color = config.secondaryColor || config.color;
      } else {
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
        size = Math.max(0.3, (highFreq / 255) * 4 * config.sensitivity);
        alpha = Math.max(0.1, (highFreq / 255) * 0.7);
        color = config.secondaryColor || config.color;
      }

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
  };

  const drawMirroredWaveform = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    config: MultiVisualizationConfig["configs"]["mirrored-waveform"]
  ) => {
    // Clear canvas with black background
    ctx.fillStyle = config.backgroundColor || "#000000";
    ctx.fillRect(0, 0, width, height);

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

  const resizeCanvas = (type: keyof typeof canvasRefs.current) => {
    const canvas = canvasRefs.current[type];
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

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
    if (!isPlaying) return;

    const render = () => {
      sortedVisualizations.forEach((type) => {
        // Skip analytics visualization as it's not canvas-based
        if (type === "analytics") return;
        
        const canvasType = type as Exclude<typeof type, "analytics">;
        const canvas = canvasRefs.current[canvasType];
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const container = canvas.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const width = Math.max(rect.width, 100);
        const height = Math.max(rect.height, 100);

        if (audioData.frequencyData.length === 0) return;

        switch (canvasType) {
          case "bars":
            drawBars(
              ctx,
              audioData.frequencyData,
              width,
              height,
              config.configs.bars
            );
            break;
          case "circular":
            drawCircular(
              ctx,
              audioData.frequencyData,
              width,
              height,
              config.configs.circular
            );
            break;
          case "waveform":
            drawWaveform(
              ctx,
              audioData.timeData,
              width,
              height,
              config.configs.waveform
            );
            break;
          case "particles":
            drawParticles(
              ctx,
              audioData.frequencyData,
              width,
              height,
              config.configs.particles
            );
            break;
          case "mirrored-waveform":
            drawMirroredWaveform(
              ctx,
              audioData.timeData,
              width,
              height,
              config.configs["mirrored-waveform"]
            );
            break;
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [audioData, isPlaying, config, sortedVisualizations]);

  useEffect(() => {
    const handleResize = () => {
      sortedVisualizations.forEach((type) => {
        // Skip analytics visualization as it's not canvas-based
        if (type === "analytics") return;
        const canvasType = type as Exclude<typeof type, "analytics">;
        resizeCanvas(canvasType as keyof typeof canvasRefs.current);
      });
    };

    window.addEventListener("resize", handleResize);

    // Initial resize
    sortedVisualizations.forEach((type) => {
      // Skip analytics visualization as it's not canvas-based
      if (type === "analytics") return;
      const canvasType = type as Exclude<typeof type, "analytics">;
      resizeCanvas(canvasType as keyof typeof canvasRefs.current);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [sortedVisualizations]);

  if (enabledVisualizations.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="text-center"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <Waves className="w-20 h-20 mx-auto mb-6 opacity-50" />
          <p className="text-2xl font-medium">No visualizations enabled</p>
          <p className="text-lg mt-2 opacity-70">
            Use the controller to enable visualizations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
    >
      {/* Drag Instructions */}
      <DragInstructions isVisible={showInstructions && enabledVisualizations.length > 1} />
      
      <div className={`grid ${gridCols} ${rows} gap-2 h-full w-full p-4`}>
        {sortedVisualizations.map((type, index) => {
          const position = config.positions[type];
          if (!position) return null;

          // Handle spanning for different grid layouts
          let spanClass = "";
          
          if (sortedVisualizations.length === 3 && index === 2) {
            // For 3 visualizations, make the third one span both columns
            spanClass = "col-span-2";
          } else if (sortedVisualizations.length === 5) {
            // For 5 visualizations in 3x2 grid, make the last one span columns 2-3 in the second row
            if (index === 4) {
              spanClass = "col-span-2";
            }
          }

          return (
            <GridDraggableVisualizationItem
              key={type}
              type={type}
              position={position}
              isPlaying={isPlaying}
              onPositionChange={handlePositionChange}
              onGridSlotSwap={handleGridSlotSwap}
              gridSlot={position.gridSlot}
              gridCols={gridCols}
              gridRows={rows}
              spanClass={spanClass}
              allTypes={sortedVisualizations}
            >
              {type === "analytics" ? (
                <AdvancedAudioAnalytics
                  audioData={audioData}
                  isPlaying={isPlaying}
                  className="w-full h-full"
                />
              ) : (
                <canvas
                  ref={(el) => {
                    if (type !== "analytics") {
                      const canvasType = type as Exclude<typeof type, "analytics">;
                      canvasRefs.current[canvasType] = el;
                    }
                  }}
                  className="absolute inset-0 w-full h-full"
                />
              )}
            </GridDraggableVisualizationItem>
          );
        })}
      </div>
    </div>
  );
};