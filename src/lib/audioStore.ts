import { create } from 'zustand';
import { MultiVisualizationConfig } from '@/types/audio';

interface AudioStore {
  multiVisualizationConfig: MultiVisualizationConfig;
  setMultiVisualizationConfig: (config: MultiVisualizationConfig) => void;
  updateVisualizationConfig: (
    key: keyof MultiVisualizationConfig['configs'],
    updates: Partial<MultiVisualizationConfig['configs'][typeof key]>
  ) => void;
  toggleVisualization: (key: keyof MultiVisualizationConfig['enabled']) => void;
  updatePosition: (
    key: keyof MultiVisualizationConfig['positions'],
    position: Partial<MultiVisualizationConfig['positions'][typeof key]>
  ) => void;
}

const defaultConfig: MultiVisualizationConfig = {
  enabled: {
    bars: true,
    circular: true,
    waveform: true,
    particles: true,
    "mirrored-waveform": true,
    "3d-globe": true,
    "3d-disc": true,
    analytics: true,
  },
  positions: {
    bars: { gridSlot: 0, zIndex: 1 },
    circular: { gridSlot: 1, zIndex: 2 },
    "3d-globe": { gridSlot: 2, zIndex: 3 },
    particles: { gridSlot: 3, zIndex: 4 },
    "mirrored-waveform": { gridSlot: 4, zIndex: 5 },
    "3d-disc": { gridSlot: 5, zIndex: 6 },
    waveform: { gridSlot: 6, zIndex: 7 },
    analytics: { gridSlot: 7, zIndex: 8 },
  },
  configs: {
    bars: {
      type: "bars",
      color: "#10B981",
      sensitivity: 1,
      smoothing: 0.8,
      secondaryColor: "#F59E0B",
      backgroundColor: "#0a0a0a",
      barCount: 32,
    },
    circular: {
      type: "circular",
      color: "#06B6D4",
      sensitivity: 1,
      smoothing: 0.8,
      secondaryColor: "#EC4899",
      backgroundColor: "#0a0a0a",
      radius: 1,
      intensity: 1,
    },
    waveform: {
      type: "waveform",
      color: "#FB7185",
      sensitivity: 1,
      smoothing: 0.8,
      secondaryColor: "#8B5CF6",
      backgroundColor: "#0a0a0a",
    },
    particles: {
      type: "particles",
      color: "#10B981",
      sensitivity: 1,
      smoothing: 0.8,
      secondaryColor: "#F59E0B",
      backgroundColor: "#0a0a0a",
      particleCount: 100,
    },
    "mirrored-waveform": {
      type: "mirrored-waveform",
      color: "#06B6D4",
      sensitivity: 1,
      smoothing: 0.8,
      secondaryColor: "#FB7185",
      backgroundColor: "#0a0a0a",
    },
    "3d-globe": {
      type: "3d-globe",
      color: "#06B6D4",
      sensitivity: 1,
      smoothing: 0.8,
      secondaryColor: "#10B981",
      backgroundColor: "#000000",
    },
    "3d-disc": {
      type: "3d-disc",
      color: "#FB7185",
      sensitivity: 1,
      smoothing: 0.8,
      secondaryColor: "#06B6D4",
      backgroundColor: "#000000",
    },
    analytics: {
      type: "analytics",
      color: "#10B981",
      sensitivity: 1,
      smoothing: 0.8,
      secondaryColor: "#F59E0B",
      backgroundColor: "#0d0b14",
    },
  },
};

export const useAudioStore = create<AudioStore>((set) => ({
  multiVisualizationConfig: defaultConfig,
  
  setMultiVisualizationConfig: (config) =>
    set({ multiVisualizationConfig: config }),
  
  updateVisualizationConfig: (key, updates) =>
    set((state) => ({
      multiVisualizationConfig: {
        ...state.multiVisualizationConfig,
        configs: {
          ...state.multiVisualizationConfig.configs,
          [key]: {
            ...state.multiVisualizationConfig.configs[key],
            ...updates,
          },
        },
      },
    })),
  
  toggleVisualization: (key) =>
    set((state) => ({
      multiVisualizationConfig: {
        ...state.multiVisualizationConfig,
        enabled: {
          ...state.multiVisualizationConfig.enabled,
          [key]: !state.multiVisualizationConfig.enabled[key],
        },
      },
    })),
  
  updatePosition: (key, position) =>
    set((state) => ({
      multiVisualizationConfig: {
        ...state.multiVisualizationConfig,
        positions: {
          ...state.multiVisualizationConfig.positions,
          [key]: {
            ...state.multiVisualizationConfig.positions[key],
            ...position,
          },
        },
      },
    })),
}));
