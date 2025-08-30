export interface AudioData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  sampleRate: number;
  duration: number;
  currentTime: number;
}

export interface VisualizationConfig {
  type: "bars" | "circular" | "waveform" | "particles";
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

export interface AudioState {
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}
