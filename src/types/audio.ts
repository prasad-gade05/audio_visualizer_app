export interface AudioData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  sampleRate: number;
  duration: number;
  currentTime: number;
}

export interface VisualizationConfig {
  type: "bars" | "circular" | "waveform" | "particles" | "mirrored-waveform";
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

export interface MultiVisualizationConfig {
  enabled: {
    bars: boolean;
    circular: boolean;
    waveform: boolean;
    particles: boolean;
    "mirrored-waveform": boolean;
  };
  configs: {
    bars: VisualizationConfig;
    circular: VisualizationConfig;
    waveform: VisualizationConfig;
    particles: VisualizationConfig;
    "mirrored-waveform": VisualizationConfig;
  };
}

export interface AudioState {
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}
