import { useEffect, useRef, useState, useMemo } from "react";
import { AudioData, MultiVisualizationConfig } from "@/types/audio";
import { Waves } from "lucide-react";
import { GridDraggableVisualizationItem } from "./GridDraggableVisualizationItem";
import { DragInstructions } from "./DragInstructions";
import { AdvancedAudioAnalytics } from "./AdvancedAudioAnalytics";
import { AudioGlobe3D } from "./AudioGlobe3D";

// Helper function moved outside to avoid recreation
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
    "3d-globe": HTMLCanvasElement | null;
    analytics: HTMLCanvasElement | null;
  }>({
    bars: null,
    circular: null,
    waveform: null,
    particles: null,
    "mirrored-waveform": null,
    "3d-globe": null,
    analytics: null,
  });
  const animationRef = useRef<number | null>(null);
  const lastResizeRef = useRef<{ [key: string]: { width: number; height: number } }>({});
  const gradientCacheRef = useRef<{ [key: string]: CanvasGradient }>({});
  const contextCacheRef = useRef<{ [key: string]: CanvasRenderingContext2D | null }>({});

  // Get enabled visualizations
  const enabledVisualizations = useMemo(() => Object.entries(config.enabled)
    .filter(([_, enabled]) => enabled)
    .map(([type, _]) => type as keyof typeof config.enabled), [config.enabled]);

  // Clear caches when visualizations are toggled
  useEffect(() => {
    // Clear context and gradient caches for disabled visualizations
    Object.keys(config.enabled).forEach((type) => {
      if (!config.enabled[type as keyof typeof config.enabled]) {
        delete contextCacheRef.current[type];
        delete lastResizeRef.current[type];
        // Clear gradients for this type
        const gradientKeys = Object.keys(gradientCacheRef.current).filter(k => k.startsWith(type));
        gradientKeys.forEach(key => delete gradientCacheRef.current[key]);
      }
    });
  }, [config.enabled]);

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
  const sortedVisualizations = useMemo(() => [...enabledVisualizations].sort((a, b) => {
    const slotA = config.positions[a]?.gridSlot ?? 0;
    const slotB = config.positions[b]?.gridSlot ?? 0;
    return slotA - slotB;
  }), [enabledVisualizations, config.positions]);

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
      case 7:
        return { gridCols: "grid-cols-3", rows: "grid-rows-3", aspectRatio: "auto" }; // 3x3 grid
      default:
        return { gridCols: "grid-cols-3", rows: "grid-rows-3", aspectRatio: "auto" };
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
    // Validate canvas dimensions
    if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
      return;
    }

    const barCount = config.barCount || 32;
    const barWidth = width / barCount;
    const dataStep = Math.floor(data.length / barCount);

    ctx.fillStyle = config.backgroundColor || "#0D0B14";
    ctx.fillRect(0, 0, width, height);

    // Optimization: Cache gradient for reuse
    const gradientKey = `bars-${width}-${height}-${config.color}-${config.secondaryColor}`;
    let gradient = gradientCacheRef.current[gradientKey];
    if (!gradient) {
      gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, config.color);
      gradient.addColorStop(1, config.secondaryColor || config.color + "40");
      gradientCacheRef.current[gradientKey] = gradient;
    }
    ctx.fillStyle = gradient;

    // Batch draw operations
    ctx.beginPath();
    for (let i = 0; i < barCount; i++) {
      const value = data[i * dataStep] / 255;
      const barHeight = value * height * config.sensitivity;
      ctx.rect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    }
    ctx.fill();

    // Add graph scales and legend for multi-visualization mode
    // Find peak frequency
    let maxValue = 0;
    let peakIndex = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > maxValue) {
        maxValue = data[i];
        peakIndex = i;
      }
    }
    
    // Draw peak frequency indicator
    const peakPosition = (peakIndex / data.length) * width;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(peakPosition - 3, height - 8);
    ctx.lineTo(peakPosition + 3, height - 8);
    ctx.lineTo(peakPosition, height - 2);
    ctx.closePath();
    ctx.fill();
    
    // Draw minimal frequency scale
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    
    // Draw scale marks at key frequencies (100Hz, 1kHz, 10kHz)
    const frequencies = [100, 1000, 10000];
    frequencies.forEach(freq => {
      const bin = Math.floor((freq / 22050) * data.length);
      const position = (bin / data.length) * width;
      if (position < width) {
        ctx.fillText(freq >= 1000 ? `${freq/1000}k` : `${freq}`, position, height - 2);
      }
    });
    
    // Draw small RMS level indicator
    let rmsSum = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = data[i] / 255;
      rmsSum += normalized * normalized;
    }
    const rms = Math.sqrt(rmsSum / data.length);
    
    // Draw small RMS meter with scale
    const meterWidth = 40;
    const meterHeight = 4;
    const meterX = width - meterWidth - 5;
    const meterY = 5;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    
    ctx.fillStyle = config.color;
    ctx.fillRect(meterX, meterY, meterWidth * rms, meterHeight);
    
    // Draw meter scale
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.textAlign = "center";
    ctx.font = "6px monospace";
    ctx.fillText("0", meterX, meterY + meterHeight + 6);
    ctx.fillText("1", meterX + meterWidth, meterY + meterHeight + 6);
    
    // Draw legend
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(5, 5, 60, 25);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 5, 60, 25);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Freq. Bars", 8, 15);
    
    ctx.font = "6px monospace";
    ctx.fillStyle = config.color;
    ctx.fillText("• Current", 8, 22);
    ctx.fillStyle = config.secondaryColor || config.color + "40";
    ctx.fillText("• Gradient", 8, 29);
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
    const baseRadius = Math.min(width, height) / 4; 
    const radius = baseRadius * (config.radius || 1);
    const barCount = 64;
    const angleStep = (Math.PI * 2) / barCount;

    // Validate canvas dimensions
    if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0 || !isFinite(radius)) {
      return;
    }

    ctx.fillStyle = config.backgroundColor || "#0D0B14";
    ctx.fillRect(0, 0, width, height);

    // Pre-calculate colors once
    const colorStart = config.color + "80";
    const colorEnd = config.secondaryColor || config.color;

    ctx.lineWidth = 2;

    // Use batch path operations for better performance
    const paths: { startX: number; startY: number; endX: number; endY: number; }[] = [];
    
    for (let i = 0; i < barCount; i++) {
      const value = data[i] / 255;
      const angle = i * angleStep;
      const barLength =
        value * radius * config.sensitivity * (config.intensity || 1);

      const startX = centerX + Math.cos(angle) * radius;
      const startY = centerY + Math.sin(angle) * radius;
      const endX = centerX + Math.cos(angle) * (radius + barLength);
      const endY = centerY + Math.sin(angle) * (radius + barLength);

      // Validate coordinates
      if (!isFinite(startX) || !isFinite(startY) || !isFinite(endX) || !isFinite(endY)) {
        continue;
      }

      paths.push({ startX, startY, endX, endY });
    }

    // Draw all paths with gradients (unavoidable for radial effect)
    paths.forEach(({ startX, startY, endX, endY }) => {
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, colorStart);
      gradient.addColorStop(1, colorEnd);
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    });

    // Add graph scales and legend for multi-visualization mode
    // Find peak frequency
    let maxValue = 0;
    let peakIndex = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > maxValue) {
        maxValue = data[i];
        peakIndex = i;
      }
    }
    
    // Draw compass-style peak indicator
    const peakAngle = (peakIndex / data.length) * Math.PI * 2;
    const indicatorRadius = radius + 15;
    const indicatorX = centerX + Math.cos(peakAngle) * indicatorRadius;
    const indicatorY = centerY + Math.sin(peakAngle) * indicatorRadius;
    
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw center pulse indicator
    const avgValue = data.reduce((sum, val) => sum + val, 0) / data.length / 255;
    const pulseRadius = 3 + avgValue * 5;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw angular scale marks
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "6px monospace";
    ctx.textAlign = "center";
    
    const scaleMarks = [
      { angle: 0, label: "0°" },
      { angle: Math.PI/2, label: "90°" },
      { angle: Math.PI, label: "180°" },
      { angle: Math.PI*1.5, label: "270°" }
    ];
    
    scaleMarks.forEach(mark => {
      const scaleRadius = radius + 10;
      const x = centerX + Math.cos(mark.angle) * scaleRadius;
      const y = centerY + Math.sin(mark.angle) * scaleRadius;
      ctx.fillText(mark.label, x, y + 3);
    });
    
    // Draw legend
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(5, 5, 60, 25);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 5, 60, 25);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Radial", 8, 15);
    
    ctx.font = "6px monospace";
    ctx.fillStyle = config.color + "80";
    ctx.fillText("• Inner", 8, 22);
    ctx.fillStyle = config.secondaryColor || config.color;
    ctx.fillText("• Outer", 8, 29);
  };

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    config: MultiVisualizationConfig["configs"]["waveform"]
  ) => {
    // Validate canvas dimensions
    if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
      return;
    }

    ctx.fillStyle = config.backgroundColor || "#0D0B14";
    ctx.fillRect(0, 0, width, height);

    const sliceWidth = width / data.length;
    const halfHeight = height / 2;
    const sensitivity = config.sensitivity;

    // Draw primary waveform
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const v = (data[i] / 128.0) * sensitivity;
      const y = (v * halfHeight);

      if (i === 0) {
        ctx.moveTo(0, y);
      } else {
        ctx.lineTo(i * sliceWidth, y);
      }
    }

    ctx.stroke();

    // Draw secondary waveform if configured
    if (config.secondaryColor) {
      ctx.strokeStyle = config.secondaryColor;
      ctx.lineWidth = 1;
      ctx.beginPath();

      const sensitivity2 = sensitivity * 0.7;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] / 128.0) * sensitivity2;
        const y = height - (v * halfHeight);

        if (i === 0) {
          ctx.moveTo(0, y);
        } else {
          ctx.lineTo(i * sliceWidth, y);
        }
      }
      ctx.stroke();
    }

    // Add graph scales and legend for multi-visualization mode
    // Draw small amplitude scale
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "6px monospace";
    ctx.textAlign = "right";
    
    const amplitudeMarks = [
      { value: 1.0, label: "+1" },
      { value: 0, label: "0" },
      { value: -1.0, label: "-1" }
    ];
    
    amplitudeMarks.forEach(mark => {
      const y = (height / 2) - (mark.value * height / 2);
      ctx.fillText(mark.label, 15, y + 2);
    });
    
    // Draw small time scale
    ctx.textAlign = "center";
    const timeMarks = [
      { position: 0, label: "0s" },
      { position: 0.5, label: "0.5s" },
      { position: 1, label: "1s" }
    ];
    
    timeMarks.forEach(mark => {
      const x = mark.position * width;
      ctx.fillText(mark.label, x, height - 2);
    });
    
    // Draw small RMS level indicator
    let rmsSum = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128;
      rmsSum += normalized * normalized;
    }
    const rms = Math.sqrt(rmsSum / data.length);
    
    // Draw small RMS meter with scale
    const meterWidth = 40;
    const meterHeight = 4;
    const meterX = width - meterWidth - 5;
    const meterY = 5;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    
    ctx.fillStyle = config.color;
    ctx.fillRect(meterX, meterY, meterWidth * rms, meterHeight);
    
    // Draw meter scale
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.textAlign = "center";
    ctx.font = "6px monospace";
    ctx.fillText("0", meterX, meterY + meterHeight + 6);
    ctx.fillText("1", meterX + meterWidth, meterY + meterHeight + 6);
    
    // Draw legend
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(5, 5, 60, 25);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 5, 60, 25);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Waveform", 8, 15);
    
    ctx.font = "6px monospace";
    ctx.fillStyle = config.color;
    ctx.fillText("• Primary", 8, 22);
    
    if (config.secondaryColor) {
      ctx.fillStyle = config.secondaryColor;
      ctx.fillText("• Secondary", 8, 29);
    }
  };

  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    config: MultiVisualizationConfig["configs"]["particles"]
  ) => {
    // Validate canvas dimensions
    if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
      return;
    }

    ctx.fillStyle = config.backgroundColor || "#0D0B14";
    ctx.fillRect(0, 0, width, height);

    const baseParticleCount = config.particleCount || 100;
    
    // Optimize frequency calculations - use typed array views
    let avgFrequency = 0;
    let lowFreq = 0;
    let midFreq = 0;
    let highFreq = 0;
    
    for (let i = 0; i < data.length; i++) {
      avgFrequency += data[i];
      if (i < 32) lowFreq += data[i];
      else if (i < 96) midFreq += data[i];
      else highFreq += data[i];
    }
    
    avgFrequency /= data.length;
    lowFreq /= 32;
    midFreq /= 64;
    highFreq /= (data.length - 96);
    
    const dynamicParticleCount = Math.floor(
      baseParticleCount + (avgFrequency / 255) * 50 * config.sensitivity
    );

    // Pre-calculate colors once
    const primaryRgb = hexToRgb(config.color);
    const secondaryRgb = hexToRgb(config.secondaryColor || config.color);
    
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const minDim = Math.min(width, height);

    // Batch particles by color for better performance
    const primaryParticles: { x: number; y: number; size: number; alpha: number }[] = [];
    const secondaryParticles: { x: number; y: number; size: number; alpha: number }[] = [];

    for (let i = 0; i < dynamicParticleCount; i++) {
      const particleType = i % 3;
      let x, y, size, alpha;

      if (particleType === 0) {
        const angle = Math.random() * Math.PI * 2;
        const distance = (lowFreq / 255) * minDim * 0.2 * config.sensitivity;
        x = halfWidth + Math.cos(angle) * distance;
        y = halfHeight + Math.sin(angle) * distance;
        size = Math.max(1, (lowFreq / 255) * 8 * config.sensitivity);
        alpha = Math.max(0.3, (lowFreq / 255) * 0.9);
        primaryParticles.push({ x, y, size, alpha });
      } else if (particleType === 1) {
        x = Math.random() * width;
        y = Math.random() * height;
        size = Math.max(0.5, (midFreq / 255) * 6 * config.sensitivity);
        alpha = Math.max(0.2, (midFreq / 255) * 0.8);
        secondaryParticles.push({ x, y, size, alpha });
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
        secondaryParticles.push({ x, y, size, alpha });
      }
    }

    // Draw primary particles in batch
    primaryParticles.forEach(({ x, y, size, alpha }) => {
      ctx.fillStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw secondary particles in batch
    secondaryParticles.forEach(({ x, y, size, alpha }) => {
      ctx.fillStyle = `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Add graph scales and legend for multi-visualization mode
    // Draw particle count indicator
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "8px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${dynamicParticleCount}`, 5, 15);
    
    // Draw small frequency distribution bars
    const bassLevel = lowFreq / 255;
    const midLevel = midFreq / 255;
    const trebleLevel = highFreq / 255;
    
    // Draw tiny bars for each frequency band
    const barWidth = 20;
    const barHeight = 3;
    const barSpacing = 3;
    const barY = 5;
    
    // Bass bar (purple)
    ctx.fillStyle = "rgba(138, 66, 255, 0.3)";
    ctx.fillRect(5, barY, barWidth, barHeight);
    ctx.fillStyle = "#8A42FF";
    ctx.fillRect(5, barY, barWidth * bassLevel, barHeight);
    
    // Mid bar (green)
    ctx.fillStyle = "rgba(0, 255, 128, 0.3)";
    ctx.fillRect(5, barY + barHeight + barSpacing, barWidth, barHeight);
    ctx.fillStyle = "#00FF80";
    ctx.fillRect(5, barY + barHeight + barSpacing, barWidth * midLevel, barHeight);
    
    // Treble bar (cyan)
    ctx.fillStyle = "rgba(0, 209, 255, 0.3)";
    ctx.fillRect(5, barY + (barHeight + barSpacing) * 2, barWidth, barHeight);
    ctx.fillStyle = "#00D1FF";
    ctx.fillRect(5, barY + (barHeight + barSpacing) * 2, barWidth * trebleLevel, barHeight);
    
    // Draw legend
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(width - 65, 5, 60, 25);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(width - 65, 5, 60, 25);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Particles", width - 62, 15);
    
    ctx.font = "6px monospace";
    ctx.fillStyle = "#8A42FF";
    ctx.fillText("• Bass", width - 62, 22);
    ctx.fillStyle = "#00FF80";
    ctx.fillText("• Mid", width - 62, 29);
  };

  const drawMirroredWaveform = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    config: MultiVisualizationConfig["configs"]["mirrored-waveform"]
  ) => {
    // Validate canvas dimensions
    if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
      return;
    }

    // Clear canvas with black background
    ctx.fillStyle = config.backgroundColor || "#000000";
    ctx.fillRect(0, 0, width, height);

    if (!data || data.length === 0) return;

    const centerY = height / 2;
    const barWidth = width / data.length;
    const halfHeight = height / 2;
    
    // Cache gradient
    const gradientKey = `mirrored-${width}`;
    let gradient = gradientCacheRef.current[gradientKey];
    if (!gradient) {
      gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#FFA500");
      gradient.addColorStop(0.2, "#FFFF00");
      gradient.addColorStop(0.4, "#FFFF00");
      gradient.addColorStop(0.5, "#FF00FF");
      gradient.addColorStop(0.6, "#FF00FF");
      gradient.addColorStop(0.8, "#0000FF");
      gradient.addColorStop(1, "#FF0000");
      gradientCacheRef.current[gradientKey] = gradient;
    }
    
    ctx.fillStyle = gradient;

    // Optimize amplitude calculation
    let avgAmplitude = 0;
    for (let i = 0; i < data.length; i++) {
      avgAmplitude += Math.abs(data[i] - 128);
    }
    avgAmplitude /= data.length;
    const intensityMultiplier = Math.max(0.3, Math.min(2.0, avgAmplitude / 64)) * config.sensitivity;

    // Batch draw using single path
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const amplitude = (data[i] - 128) / 128;
      const barHeight = Math.abs(amplitude) * halfHeight * intensityMultiplier;
      const x = i * barWidth;
      
      // Draw upper bar
      ctx.rect(x, centerY - barHeight, barWidth, barHeight);
    }
    ctx.fill();
    
    // Draw lower bars in batch
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const amplitude = (data[i] - 128) / 128;
      const barHeight = Math.abs(amplitude) * halfHeight * intensityMultiplier;
      const x = i * barWidth;
      
      // Draw lower bar
      ctx.rect(x, centerY, barWidth, barHeight);
    }
    ctx.fill();

    // Add graph scales and legend for multi-visualization mode
    // Draw dynamic range indicator
    const minValue = Math.min(...Array.from(data));
    const maxValue = Math.max(...Array.from(data));
    const dynamicRange = maxValue - minValue;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "8px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${Math.round(dynamicRange)}`, 5, 15);
    
    // Draw small intensity meter
    const meterWidth = 40;
    const meterHeight = 4;
    const meterX = width - meterWidth - 5;
    const meterY = 5;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    
    ctx.fillStyle = "#FF00FF";
    ctx.fillRect(meterX, meterY, meterWidth * intensityMultiplier / 2, meterHeight);
    
    // Draw meter scale
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.textAlign = "center";
    ctx.font = "6px monospace";
    ctx.fillText("0", meterX, meterY + meterHeight + 6);
    ctx.fillText("1", meterX + meterWidth, meterY + meterHeight + 6);
    
    // Draw legend
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(5, height - 30, 70, 25);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(5, height - 30, 70, 25);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Mirrored", 8, height - 20);
    
    // Draw small gradient legend
    const gradientLegendWidth = 30;
    const gradientLegendHeight = 3;
    const gradientLegendX = 8;
    const gradientLegendY = height - 12;
    
    // Create horizontal gradient for legend
    const legendGradient = ctx.createLinearGradient(gradientLegendX, 0, gradientLegendX + gradientLegendWidth, 0);
    legendGradient.addColorStop(0, "#FFA500"); // Orange
    legendGradient.addColorStop(0.5, "#FF00FF"); // Magenta
    legendGradient.addColorStop(1, "#0000FF"); // Blue
    
    ctx.fillStyle = legendGradient;
    ctx.fillRect(gradientLegendX, gradientLegendY, gradientLegendWidth, gradientLegendHeight);
  };

  const resizeCanvas = (type: keyof typeof canvasRefs.current) => {
    const canvas = canvasRefs.current[type];
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (parent) {
      const newWidth = parent.clientWidth;
      const newHeight = parent.clientHeight;
      
      // Only resize if dimensions changed
      const lastSize = lastResizeRef.current[type];
      if (!lastSize || lastSize.width !== newWidth || lastSize.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        lastResizeRef.current[type] = { width: newWidth, height: newHeight };
        
        // Clear gradient cache for this visualization when resizing
        const keysToDelete = Object.keys(gradientCacheRef.current).filter(k => k.startsWith(type));
        keysToDelete.forEach(key => delete gradientCacheRef.current[key]);
      }
    }
  };

  useEffect(() => {
    const render = () => {
      if (!isPlaying) return;

      // Draw enabled visualizations
      enabledVisualizations.forEach((type) => {
        if (type === "analytics" || type === "3d-globe") return; // Handled by separate components

        const canvas = canvasRefs.current[type];
        if (!canvas) return;

        // Cache context for reuse
        let ctx = contextCacheRef.current[type];
        if (!ctx) {
          ctx = canvas.getContext("2d", { alpha: false }); // alpha: false for better performance
          if (!ctx) return;
          contextCacheRef.current[type] = ctx;
        }

        // Optimize: Only check resize on every other frame or when actually needed
        const parentWidth = canvas.parentElement?.clientWidth || 0;
        const parentHeight = canvas.parentElement?.clientHeight || 0;
        
        if (canvas.width !== parentWidth || canvas.height !== parentHeight) {
          resizeCanvas(type);
        }

        const width = canvas.width;
        const height = canvas.height;

        // Skip rendering if canvas has no size
        if (width === 0 || height === 0) return;

        switch (type) {
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
      }
    };
  }, [audioData, isPlaying, config, enabledVisualizations]);

  return (
    <div className="w-full h-full relative p-4">
      {showInstructions && <DragInstructions />}
      
      <div
        ref={containerRef}
        className={`grid ${gridCols} ${rows} gap-4 w-full h-full transition-all duration-500 ease-in-out`}
      >
        {sortedVisualizations.map((type) => (
          <GridDraggableVisualizationItem
            key={type}
            type={type}
            position={config.positions[type]}
            isPlaying={isPlaying}
            onPositionChange={handlePositionChange}
            onGridSlotSwap={handleGridSlotSwap}
            gridSlot={config.positions[type]?.gridSlot ?? 0}
            gridCols={gridCols}
            gridRows={rows}
            spanClass="w-full h-full min-h-[200px]"
            allTypes={enabledVisualizations}
          >
            {type === "analytics" && (
              <AdvancedAudioAnalytics 
                audioData={audioData}
                isPlaying={isPlaying}
              />
            )}
            
            {type === "3d-globe" && (
              <AudioGlobe3D 
                audioData={audioData}
                isPlaying={isPlaying}
              />
            )}

            {type !== "analytics" && type !== "3d-globe" && (
              <canvas
                ref={(el) => (canvasRefs.current[type] = el)}
                className="w-full h-full"
              />
            )}
          </GridDraggableVisualizationItem>
        ))}
      </div>
    </div>
  );
};