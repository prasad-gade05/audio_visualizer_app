export interface AudioData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  sampleRate: number;
  duration: number;
  currentTime: number;
}

export interface VisualizationConfig {
  type: "bars" | "circular" | "waveform" | "particles" | "mirrored-waveform" | "3d-globe" | "analytics";
  color: string;
  sensitivity: number;
  smoothing: number;
  secondaryColor?: string;
  backgroundColor?: string;
  barCount?: number;
  particleCount?: number;
  particleSpeed?: number;
  radius?: number;
  intensity?: number;
}

export interface VisualizationPosition {
  gridSlot: number; // 0-based index for grid position
  zIndex: number;
}

export interface MultiVisualizationConfig {
  enabled: {
    bars: boolean;
    circular: boolean;
    waveform: boolean;
    particles: boolean;
    "mirrored-waveform": boolean;
    "3d-globe": boolean;
    analytics: boolean;
  };
  positions: {
    bars: VisualizationPosition;
    circular: VisualizationPosition;
    waveform: VisualizationPosition;
    particles: VisualizationPosition;
    "mirrored-waveform": VisualizationPosition;
    "3d-globe": VisualizationPosition;
    analytics: VisualizationPosition;
  };
  configs: {
    bars: VisualizationConfig;
    circular: VisualizationConfig;
    waveform: VisualizationConfig;
    particles: VisualizationConfig;
    "mirrored-waveform": VisualizationConfig;
    "3d-globe": VisualizationConfig;
    analytics: VisualizationConfig;
  };
}

export interface AudioState {
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}
