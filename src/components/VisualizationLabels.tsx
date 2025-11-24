import React from "react";
import { AudioData } from "@/types/audio";

// Define frequency ranges in Hz
export const FREQUENCY_RANGES = {
  bass: { min: 20, max: 250, bins: { start: 0, end: 32 } },
  mid: { min: 250, max: 4000, bins: { start: 32, end: 96 } },
  treble: { min: 4000, max: 20000, bins: { start: 96, end: 160 } },
};

// Audio analysis utility functions
export const analyzeAudioData = (audioData: AudioData) => {
  if (!audioData.frequencyData || audioData.frequencyData.length === 0) {
    return {
      bassLevel: 0,
      midLevel: 0,
      trebleLevel: 0,
      overallRMS: 0,
      peakFrequency: 0,
      dynamicRange: 0,
      activeFrequencyCount: 0,
      avgAmplitude: 0,
    };
  }

  const { frequencyData, timeData } = audioData;

  // Calculate frequency band levels
  const bassData = frequencyData.slice(FREQUENCY_RANGES.bass.bins.start, FREQUENCY_RANGES.bass.bins.end);
  const midData = frequencyData.slice(FREQUENCY_RANGES.mid.bins.start, FREQUENCY_RANGES.mid.bins.end);
  const trebleData = frequencyData.slice(FREQUENCY_RANGES.treble.bins.start, FREQUENCY_RANGES.treble.bins.end);

  const bassLevel = bassData.reduce((sum, val) => sum + val, 0) / bassData.length;
  const midLevel = midData.reduce((sum, val) => sum + val, 0) / midData.length;
  const trebleLevel = trebleData.reduce((sum, val) => sum + val, 0) / trebleData.length;

  // Calculate overall RMS from time domain data
  let rmsSum = 0;
  if (timeData && timeData.length > 0) {
    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128; // Normalize to -1 to 1
      rmsSum += sample * sample;
    }
  }
  const overallRMS = Math.sqrt(rmsSum / (timeData?.length || 1));

  // Find peak frequency
  let maxValue = 0;
  let peakIndex = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    if (frequencyData[i] > maxValue) {
      maxValue = frequencyData[i];
      peakIndex = i;
    }
  }

  // Convert bin index to frequency (assuming 44.1kHz sample rate)
  const nyquist = audioData.sampleRate / 2;
  const peakFrequency = (peakIndex / frequencyData.length) * nyquist;

  // Calculate dynamic range
  const maxFreq = Math.max(...Array.from(frequencyData));
  const minFreq = Math.min(...Array.from(frequencyData));
  const dynamicRange = maxFreq - minFreq;

  // Count active frequency bins (above threshold)
  const activeFrequencyCount = Array.from(frequencyData).filter(val => val > 10).length;

  // Calculate average amplitude from time domain
  let avgAmplitude = 0;
  if (timeData && timeData.length > 0) {
    avgAmplitude = timeData.reduce((sum, val) => sum + Math.abs(val - 128), 0) / timeData.length;
  }

  return {
    bassLevel: bassLevel / 255,
    midLevel: midLevel / 255,
    trebleLevel: trebleLevel / 255,
    overallRMS,
    rmsLevel: 20 * Math.log10(overallRMS + 0.001), // Add dB conversion
    peakFrequency,
    dynamicRange,
    activeFrequencyCount,
    activeBins: activeFrequencyCount, // Add alias for compatibility
    avgAmplitude: avgAmplitude / 128,
  };
};

interface VisualizationLabelsProps {
  audioData: AudioData;
  visualizationType: "bars" | "circular" | "waveform" | "particles" | "mirrored-waveform" | "3d-globe" | "3d-disc" | "analytics";
  isPlaying: boolean;
  showDetailedStats?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}

export const VisualizationLabels: React.FC<VisualizationLabelsProps> = ({
  audioData,
  visualizationType,
  isPlaying,
  showDetailedStats = true,
  position = "top-left",
  className = "",
}) => {
  const stats = analyzeAudioData(audioData);

  const positionClasses = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
  };

  const formatFrequency = (freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)}kHz`;
    }
    return `${Math.round(freq)}Hz`;
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  const getVisualizationTitle = () => {
    switch (visualizationType) {
      case "bars":
        return "Frequency Spectrum";
      case "circular":
        return "Radial Frequency Display";
      case "waveform":
        return "Time Domain Waveform";
      case "particles":
        return "Frequency Particle System";
      case "mirrored-waveform":
        return "Mirrored Spectrum Bars";
      case "3d-globe":
        return "3D Globe Visualizer";
      case "3d-disc":
        return "3D Radial Disc";
      case "analytics":
        return "Advanced Audio Analytics";
      default:
        return "Audio Visualization";
    }
  };

  const getKeyStats = () => {
    switch (visualizationType) {
      case "bars":
        return [`Peak: ${formatFrequency(stats.peakFrequency)}`, `Active: ${stats.activeFrequencyCount}/${audioData.frequencyData.length}`];
      case "circular":
        return [`Peak: ${formatFrequency(stats.peakFrequency)}`, `360° frequency`];
      case "waveform":
        return [`${formatFrequency(audioData.sampleRate)}`, `RMS: ${(20 * Math.log10(stats.overallRMS + 0.001)).toFixed(1)}dB`];
      case "particles":
        return [`Bass: ${formatPercentage(stats.bassLevel)}`, `Mid: ${formatPercentage(stats.midLevel)}`, `Treble: ${formatPercentage(stats.trebleLevel)}`];
      case "mirrored-waveform":
        return [`Range: ${Math.round(stats.dynamicRange)}`, `Avg: ${formatPercentage(stats.avgAmplitude)}`];
      case "3d-globe":
        return [`Frequency Sphere`, `Interactive 3D`];
      case "3d-disc":
        return [`Radial Waveform`, `128 Spokes`];
      case "analytics":
        return [`Peak: ${formatFrequency(stats.peakFrequency)}`, `RMS: ${stats.rmsLevel.toFixed(1)}dB`, `Range: ${stats.dynamicRange.toFixed(1)}dB`];
      default:
        return [];
    }
  };

  if (!isPlaying) {
    return (
      <div className={`absolute ${positionClasses[position]} ${className} pointer-events-none`}>
        <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-md px-2 py-1 text-white/60 text-xs">
          <div className="font-medium">{getVisualizationTitle()}</div>
        </div>
      </div>
    );
  }

  const keyStats = getKeyStats();

  return (
    <div className={`absolute ${positionClasses[position]} ${className} pointer-events-none z-10`}>
      <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-md px-2 py-1 text-white/80 text-xs space-y-1">
        {/* Compact title */}
        <div className="font-medium text-white/90 text-xs">
          {getVisualizationTitle()}
        </div>

        {/* Key stats only - maximum 3 lines */}
        {showDetailedStats && keyStats.length > 0 && (
          <div className="space-y-0.5">
            {keyStats.slice(0, 3).map((stat, index) => (
              <div key={index} className="text-white/70 font-mono text-xs">
                {stat}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Frequency Scale Component for visualizations that need axis labels
interface FrequencyScaleProps {
  width: number;
  height: number;
  orientation: "horizontal" | "vertical";
  frequencyRange: { min: number; max: number };
  position: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const FrequencyScale: React.FC<FrequencyScaleProps> = ({
  width,
  height,
  orientation,
  frequencyRange,
  position,
  className = "",
}) => {
  const generateScaleMarks = () => {
    const marks = [];
    const { min, max } = frequencyRange;
    
    // Generate logarithmic scale for better frequency representation
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const steps = 6; // Number of scale marks
    
    for (let i = 0; i <= steps; i++) {
      const logValue = logMin + (i / steps) * (logMax - logMin);
      const frequency = Math.pow(10, logValue);
      marks.push({
        frequency,
        position: (i / steps) * 100,
        label: formatFrequency(frequency),
      });
    }
    
    return marks;
  };

  const formatFrequency = (freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(freq >= 10000 ? 0 : 1)}k`;
    }
    return `${Math.round(freq)}`;
  };

  const marks = generateScaleMarks();

  const positionClasses = {
    top: "top-0 left-0 right-0",
    bottom: "bottom-0 left-0 right-0",
    left: "left-0 top-0 bottom-0",
    right: "right-0 top-0 bottom-0",
  };

  return (
    <div className={`absolute ${positionClasses[position]} ${className} pointer-events-none z-20`}>
      <div className="relative w-full h-full">
        {marks.map((mark, index) => (
          <div
            key={index}
            className="absolute text-xs text-white/60 font-mono"
            style={{
              [orientation === "horizontal" ? "left" : "top"]: `${mark.position}%`,
              transform: orientation === "horizontal" 
                ? "translateX(-50%)" 
                : "translateY(-50%)",
              [position]: "2px",
            }}
          >
            {mark.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// Amplitude Scale Component for waveform visualizations
interface AmplitudeScaleProps {
  height: number;
  position: "left" | "right";
  range: { min: number; max: number };
  unit?: string;
  className?: string;
}

export const AmplitudeScale: React.FC<AmplitudeScaleProps> = ({
  height,
  position,
  range,
  unit = "",
  className = "",
}) => {
  const generateAmplitudeMarks = () => {
    const marks = [];
    const { min, max } = range;
    const steps = 5; // Number of scale marks
    
    for (let i = 0; i <= steps; i++) {
      const value = min + (i / steps) * (max - min);
      marks.push({
        value,
        position: ((max - value) / (max - min)) * 100, // Invert for display
        label: value.toFixed(1) + unit,
      });
    }
    
    return marks;
  };

  const marks = generateAmplitudeMarks();

  const positionClasses = {
    left: "left-0 top-0 bottom-0",
    right: "right-0 top-0 bottom-0",
  };

  return (
    <div className={`absolute ${positionClasses[position]} ${className} pointer-events-none z-20 w-12`}>
      <div className="relative w-full h-full">
        {marks.map((mark, index) => (
          <div
            key={index}
            className="absolute text-xs text-white/60 font-mono whitespace-nowrap"
            style={{
              top: `${mark.position}%`,
              transform: "translateY(-50%)",
              [position]: "2px",
            }}
          >
            {mark.label}
          </div>
        ))}
      </div>
    </div>
  );
};