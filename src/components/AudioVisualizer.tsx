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
    color: "#10B981",
    sensitivity: 1,
    smoothing: 0.8,
    secondaryColor: "#F59E0B",
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

      // Each bar gets a color from the palette based on its position
      const colorVariant = i % 6;
      let bottomColor, topColor;
      
      switch(colorVariant) {
        case 0: // Cyan to Emerald
          bottomColor = "#06B6D4";
          topColor = "#10B981";
          break;
        case 1: // Emerald to Amber
          bottomColor = "#10B981";
          topColor = "#F59E0B";
          break;
        case 2: // Amber to Coral
          bottomColor = "#F59E0B";
          topColor = "#FB7185";
          break;
        case 3: // Coral to Pink
          bottomColor = "#FB7185";
          topColor = "#EC4899";
          break;
        case 4: // Pink to Violet
          bottomColor = "#EC4899";
          topColor = "#8B5CF6";
          break;
        default: // Violet to Cyan
          bottomColor = "#8B5CF6";
          topColor = "#06B6D4";
          break;
      }

      const gradient = ctx.createLinearGradient(
        0,
        height,
        0,
        height - barHeight
      );
      gradient.addColorStop(0, bottomColor);
      gradient.addColorStop(1, topColor);

      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
    }

    // Add comprehensive graph scales and legend
    if (!fullScreen) {
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
      ctx.moveTo(peakPosition - 5, height - 15);
      ctx.lineTo(peakPosition + 5, height - 15);
      ctx.lineTo(peakPosition, height - 5);
      ctx.closePath();
      ctx.fill();
      
      // Draw frequency scale (logarithmic) at bottom
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      
      // Draw scale marks at key frequencies (20Hz, 100Hz, 1kHz, 10kHz, 20kHz)
      const frequencies = [20, 100, 1000, 10000, 20000];
      frequencies.forEach(freq => {
        const bin = Math.floor((freq / 22050) * data.length);
        const position = (bin / data.length) * width;
        if (position < width && position > 0) {
          // Draw tick mark
          ctx.beginPath();
          ctx.moveTo(position, height - 20);
          ctx.lineTo(position, height - 15);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Draw frequency label
          ctx.fillText(freq >= 1000 ? `${freq/1000}k` : `${freq}`, position, height - 5);
        }
      });
      
      // Draw frequency axis label
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText("Frequency (Hz)", width / 2, height - 2);
      
      // Draw amplitude scale on the left
      ctx.textAlign = "right";
      const amplitudeMarks = [
        { value: 1.0, label: "100%" },
        { value: 0.75, label: "75%" },
        { value: 0.5, label: "50%" },
        { value: 0.25, label: "25%" },
        { value: 0, label: "0%" }
      ];
      
      amplitudeMarks.forEach(mark => {
        const y = height - (mark.value * (height - 30)); // 30px margin for frequency scale
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
      ctx.translate(15, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText("Amplitude", 0, 0);
      ctx.restore();
      
      // Draw legend
      const legendX = width - 120;
      const legendY = 20;
      
      // Legend background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(legendX - 5, legendY - 15, 120, 80);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX - 5, legendY - 15, 120, 80);
      
      // Legend title
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Frequency Bars", legendX, legendY);
      
      // Show color spectrum with small bars
      ctx.font = "9px monospace";
      const colorPairs = [
        { name: "Cyan→Emerald", bottom: "#06B6D4", top: "#10B981" },
        { name: "Emerald→Amber", bottom: "#10B981", top: "#F59E0B" },
        { name: "Amber→Coral", bottom: "#F59E0B", top: "#FB7185" },
        { name: "Coral→Pink", bottom: "#FB7185", top: "#EC4899" },
        { name: "Pink→Violet", bottom: "#EC4899", top: "#8B5CF6" },
        { name: "Violet→Cyan", bottom: "#8B5CF6", top: "#06B6D4" }
      ];
      
      // Draw compact color spectrum
      const spectrumBarWidth = 15;
      const spectrumBarHeight = 8;
      const spectrumY = legendY + 15;
      
      colorPairs.forEach((pair, idx) => {
        const x = legendX + (idx % 3) * (spectrumBarWidth + 5);
        const y = spectrumY + Math.floor(idx / 3) * (spectrumBarHeight + 10);
        
        const gradient = ctx.createLinearGradient(x, y + spectrumBarHeight, x, y);
        gradient.addColorStop(0, pair.bottom);
        gradient.addColorStop(1, pair.top);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, spectrumBarWidth, spectrumBarHeight);
        
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, spectrumBarWidth, spectrumBarHeight);
      });
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "8px monospace";
      ctx.textAlign = "left";
      ctx.fillText("6 Color Gradients", legendX, spectrumY + spectrumBarHeight * 2 + 20);
      
      // Draw RMS level indicator
      let rmsSum = 0;
      for (let i = 0; i < data.length; i++) {
        const normalized = data[i] / 255;
        rmsSum += normalized * normalized;
      }
      const rms = Math.sqrt(rmsSum / data.length);
      
      // Draw RMS meter with scale
      const meterWidth = 80;
      const meterHeight = 10;
      const meterX = legendX;
      const meterY = legendY + 55;
      
      // Meter background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
      
      // Meter fill with gradient
      const meterGradient = ctx.createLinearGradient(meterX, 0, meterX + meterWidth, 0);
      meterGradient.addColorStop(0, "#06B6D4");
      meterGradient.addColorStop(0.5, "#F59E0B");
      meterGradient.addColorStop(1, "#EC4899");
      ctx.fillStyle = meterGradient;
      ctx.fillRect(meterX, meterY, meterWidth * rms, meterHeight);
      
      // Meter border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
      
      // Meter label
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.textAlign = "left";
      ctx.fillText("RMS:", meterX, meterY - 2);
      
      // Meter scale
      ctx.textAlign = "center";
      ctx.fillText("0", meterX, meterY + meterHeight + 10);
      ctx.fillText("1", meterX + meterWidth, meterY + meterHeight + 10);
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

    // Add comprehensive graph scales and legend for circular visualization
    if (!fullScreen) {
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
      const indicatorRadius = radius + 40;
      const indicatorX = centerX + Math.cos(peakAngle) * indicatorRadius;
      const indicatorY = centerY + Math.sin(peakAngle) * indicatorRadius;
      
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw center pulse indicator
      const avgValue = data.reduce((sum, val) => sum + val, 0) / data.length / 255;
      const pulseRadius = 5 + avgValue * 15;
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw angular scale with labels
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      
      // Draw scale marks at cardinal directions
      const scaleMarks = [
        { angle: 0, label: "0° (20Hz)" },
        { angle: Math.PI/2, label: "90° (5.5kHz)" },
        { angle: Math.PI, label: "180° (11kHz)" },
        { angle: Math.PI*1.5, label: "270° (16.5kHz)" }
      ];
      
      scaleMarks.forEach(mark => {
        const scaleRadius = radius + 25;
        const x = centerX + Math.cos(mark.angle) * scaleRadius;
        const y = centerY + Math.sin(mark.angle) * scaleRadius;
        
        // Draw tick mark
        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(mark.angle) * (radius + 20),
          centerY + Math.sin(mark.angle) * (radius + 20)
        );
        ctx.lineTo(
          centerX + Math.cos(mark.angle) * (radius + 25),
          centerY + Math.sin(mark.angle) * (radius + 25)
        );
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw label
        ctx.fillText(mark.label, x, y + 4);
      });
      
      // Draw radial amplitude scale
      const amplitudeLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
      amplitudeLevels.forEach(level => {
        const levelRadius = radius * level;
        
        // Draw concentric circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, levelRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Draw amplitude label
        if (level === 1.0) {
          ctx.textAlign = "left";
          ctx.fillText(`${Math.round(level * 100)}%`, centerX + levelRadius + 5, centerY - 2);
        }
      });
      
      // Draw legend
      const legendX = width - 120;
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
      ctx.fillText("Radial Display", legendX, legendY);
      
      // Legend items
      ctx.font = "10px monospace";
      ctx.fillStyle = config.color + "80";
      ctx.fillText("• Inner", legendX, legendY + 15);
      ctx.fillStyle = config.secondaryColor || config.color;
      ctx.fillText("• Outer", legendX, legendY + 28);
      
      // Draw RMS level indicator
      let rmsSum = 0;
      for (let i = 0; i < data.length; i++) {
        const normalized = data[i] / 255;
        rmsSum += normalized * normalized;
      }
      const rms = Math.sqrt(rmsSum / data.length);
      
      // Draw RMS meter with scale
      const meterWidth = 80;
      const meterHeight = 10;
      const meterX = legendX;
      const meterY = legendY + 35;
      
      // Meter background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
      
      // Meter fill
      ctx.fillStyle = config.color;
      ctx.fillRect(meterX, meterY, meterWidth * rms, meterHeight);
      
      // Meter border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
      
      // Meter label
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.textAlign = "left";
      ctx.fillText("RMS:", meterX, meterY - 2);
      
      // Meter scale
      ctx.textAlign = "center";
      ctx.fillText("0", meterX, meterY + meterHeight + 10);
      ctx.fillText("1", meterX + meterWidth, meterY + meterHeight + 10);
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

    // Add comprehensive graph scales and legend for waveform visualization
    if (!fullScreen) {
      // Draw amplitude scale on the left
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      
      // Draw amplitude scale marks
      const amplitudeMarks = [
        { value: 1.0, label: "+1" },
        { value: 0.5, label: "+0.5" },
        { value: 0, label: "0" },
        { value: -0.5, label: "-0.5" },
        { value: -1.0, label: "-1" }
      ];
      
      amplitudeMarks.forEach(mark => {
        const y = (height / 2) - (mark.value * height / 2);
        // Draw tick mark
        ctx.beginPath();
        ctx.moveTo(32, y);
        ctx.lineTo(38, y);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw amplitude label
        ctx.fillText(mark.label, 30, y + 4);
      });
      
      // Draw amplitude axis label
      ctx.save();
      ctx.translate(15, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText("Amplitude", 0, 0);
      ctx.restore();
      
      // Draw time scale at bottom
      ctx.textAlign = "center";
      const timeMarks = [
        { position: 0, label: "0s" },
        { position: 0.25, label: "0.25s" },
        { position: 0.5, label: "0.5s" },
        { position: 0.75, label: "0.75s" },
        { position: 1, label: "1s" }
      ];
      
      timeMarks.forEach(mark => {
        const x = mark.position * width;
        // Draw tick mark
        ctx.beginPath();
        ctx.moveTo(x, height - 12);
        ctx.lineTo(x, height - 8);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw time label
        ctx.fillText(mark.label, x, height - 5);
      });
      
      // Draw time axis label
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText("Time (seconds)", width / 2, height - 2);
      
      // Draw legend
      const legendX = width - 120;
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
      ctx.fillText("Waveform", legendX, legendY);
      
      // Legend items
      ctx.font = "10px monospace";
      ctx.fillStyle = config.color;
      ctx.fillText("• Primary", legendX, legendY + 15);
      
      if (config.secondaryColor) {
        ctx.fillStyle = config.secondaryColor;
        ctx.fillText("• Secondary", legendX, legendY + 28);
      }
      
      // Draw RMS level indicator
      let rmsSum = 0;
      for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128;
        rmsSum += normalized * normalized;
      }
      const rms = Math.sqrt(rmsSum / data.length);
      
      // Draw RMS meter with scale
      const meterWidth = 80;
      const meterHeight = 10;
      const meterX = legendX;
      const meterY = legendY + 35;
      
      // Meter background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
      
      // Meter fill
      ctx.fillStyle = config.color;
      ctx.fillRect(meterX, meterY, meterWidth * rms, meterHeight);
      
      // Meter border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
      
      // Meter label
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.textAlign = "left";
      ctx.fillText("RMS:", meterX, meterY - 2);
      
      // Meter scale
      ctx.textAlign = "center";
      ctx.fillText("0", meterX, meterY + meterHeight + 10);
      ctx.fillText("1", meterX + meterWidth, meterY + meterHeight + 10);
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

    // Add comprehensive graph scales and legend for particles visualization
    if (!fullScreen) {
      // Draw particle count indicator
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Particles: ${dynamicParticleCount}`, 10, 20);
      
      // Draw frequency band distribution with legend
      const bassLevel = lowFreq / 255;
      const midLevel = midFreq / 255;
      const trebleLevel = highFreq / 255;
      
      // Draw frequency distribution bars with scale
      const barWidth = 100;
      const barHeight = 12;
      const barSpacing = 8;
      const barY = 35;
      
      // Bass bar (coral)
      ctx.fillStyle = "rgba(251, 113, 133, 0.3)";
      ctx.fillRect(10, barY, barWidth, barHeight);
      ctx.fillStyle = "#FB7185";
      ctx.fillRect(10, barY, barWidth * bassLevel, barHeight);
      
      // Mid bar (emerald)
      ctx.fillStyle = "rgba(16, 185, 129, 0.3)";
      ctx.fillRect(10, barY + barHeight + barSpacing, barWidth, barHeight);
      ctx.fillStyle = "#10B981";
      ctx.fillRect(10, barY + barHeight + barSpacing, barWidth * midLevel, barHeight);
      
      // Treble bar (amber)
      ctx.fillStyle = "rgba(245, 158, 11, 0.3)";
      ctx.fillRect(10, barY + (barHeight + barSpacing) * 2, barWidth, barHeight);
      ctx.fillStyle = "#F59E0B";
      ctx.fillRect(10, barY + (barHeight + barSpacing) * 2, barWidth * trebleLevel, barHeight);
      
      // Draw labels with scale
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("Bass (20-250Hz)", 8, barY + barHeight - 2);
      ctx.fillText("Mid (250-4kHz)", 8, barY + barHeight + barSpacing + barHeight - 2);
      ctx.fillText("Treble (4-20kHz)", 8, barY + (barHeight + barSpacing) * 2 + barHeight - 2);
      
      // Draw scale for frequency bars
      ctx.textAlign = "center";
      ctx.fillText("0%", 10, barY + (barHeight + barSpacing) * 3 + 15);
      ctx.fillText("100%", 10 + barWidth, barY + (barHeight + barSpacing) * 3 + 15);
      
      // Draw legend
      const legendX = width - 120;
      const legendY = 20;
      
      // Legend background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(legendX - 5, legendY - 15, 120, 75);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX - 5, legendY - 15, 120, 75);
      
      // Legend title
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Particle System", legendX, legendY);
      
      // Legend items
      ctx.font = "10px monospace";
      ctx.fillStyle = "#FB7185";
      ctx.fillText("• Bass Particles", legendX, legendY + 15);
      ctx.fillStyle = "#10B981";
      ctx.fillText("• Mid Particles", legendX, legendY + 28);
      ctx.fillStyle = "#F59E0B";
      ctx.fillText("• Treble Particles", legendX, legendY + 41);
      
      // Draw connection lines indicator
      ctx.fillStyle = config.color;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY + 50);
      ctx.lineTo(legendX + 20, legendY + 50);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillText("• Connections", legendX + 25, legendY + 52);
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
    gradient.addColorStop(0, "#06B6D4"); // Cyan
    gradient.addColorStop(0.2, "#10B981"); // Emerald
    gradient.addColorStop(0.4, "#F59E0B"); // Amber
    gradient.addColorStop(0.5, "#FB7185"); // Coral
    gradient.addColorStop(0.6, "#EC4899"); // Pink
    gradient.addColorStop(0.8, "#8B5CF6"); // Violet
    gradient.addColorStop(1, "#06B6D4"); // Back to Cyan
    
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

    // Add comprehensive graph scales and legend for mirrored waveform
    if (!fullScreen) {
      // Draw dynamic range indicator
      const minValue = Math.min(...Array.from(data));
      const maxValue = Math.max(...Array.from(data));
      const dynamicRange = maxValue - minValue;
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Range: ${Math.round(dynamicRange)}`, 10, 20);
      
      // Draw peak hold indicator
      let peakValue = 0;
      for (let i = 0; i < data.length; i++) {
        const amplitude = Math.abs(data[i] - 128);
        if (amplitude > peakValue) {
          peakValue = amplitude;
        }
      }
      
      const peakHeight = (peakValue / 128) * (height / 2);
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
        const bin = Math.floor((freq / 22050) * data.length);
        const position = (bin / data.length) * width;
        if (position < width && position > 0) {
          // Draw tick mark
          ctx.beginPath();
          ctx.moveTo(position, height - 20);
          ctx.lineTo(position, height - 15);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Draw frequency label
          ctx.fillText(freq >= 1000 ? `${freq/1000}k` : `${freq}`, position, height - 5);
        }
      });
      
      // Draw frequency axis label
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText("Frequency (Hz)", width / 2, height - 2);
      
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
      ctx.translate(15, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText("Amplitude", 0, 0);
      ctx.restore();
      
      // Draw legend
      const legendX = width - 120;
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
      legendGradient.addColorStop(0, "#06B6D4"); // Cyan
      legendGradient.addColorStop(0.2, "#10B981"); // Emerald
      legendGradient.addColorStop(0.4, "#F59E0B"); // Amber
      legendGradient.addColorStop(0.5, "#FB7185"); // Coral
      legendGradient.addColorStop(0.6, "#EC4899"); // Pink
      legendGradient.addColorStop(0.8, "#8B5CF6"); // Violet
      legendGradient.addColorStop(1, "#06B6D4"); // Back to Cyan
      
      ctx.fillStyle = legendGradient;
      ctx.fillRect(gradientLegendX, gradientLegendY, gradientLegendWidth, gradientLegendHeight);
      
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(gradientLegendX, gradientLegendY, gradientLegendWidth, gradientLegendHeight);
      
      // Draw gradient labels
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Cyan", gradientLegendX + 10, gradientLegendY + gradientLegendHeight + 10);
      ctx.fillText("Emerald", gradientLegendX + 30, gradientLegendY + gradientLegendHeight + 10);
      ctx.fillText("Coral", gradientLegendX + 50, gradientLegendY + gradientLegendHeight + 10);
      ctx.fillText("Violet", gradientLegendX + 70, gradientLegendY + gradientLegendHeight + 10);
      
      // Draw intensity meter
      const meterWidth = 80;
      const meterHeight = 10;
      const meterX = legendX;
      const meterY = legendY + 45;
      
      // Meter background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
      
      // Meter fill
      ctx.fillStyle = "#EC4899";
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
