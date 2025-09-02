import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  SkipBack,
  SkipForward,
  Mic,
} from "lucide-react";
import { MultiAudioVisualizer } from "./MultiAudioVisualizer";
import { MultiVisualizationController } from "./MultiVisualizationController";
import { AudioState, AudioData, MultiVisualizationConfig } from "@/types/audio";
import { Slider } from "@/components/ui/slider";

interface MultiPlayerViewProps {
  mode: "file" | "system" | "microphone";
  fileName?: string;
  audioState?: AudioState;
  audioData: AudioData;
  isPlaying: boolean;
  isCapturing?: boolean;
  microphoneLevel?: number;
  sensitivity?: number;
  noiseGate?: number;
  onBack: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onStop?: () => void;
  onSensitivityChange?: (value: number) => void;
  onNoiseGateChange?: (value: number) => void;
  multiVisualizationConfig: MultiVisualizationConfig;
  onMultiVisualizationConfigChange: (config: MultiVisualizationConfig) => void;
}

export const MultiPlayerView = ({
  mode,
  fileName,
  audioState,
  audioData,
  isPlaying,
  isCapturing,
  microphoneLevel,
  sensitivity,
  noiseGate,
  onBack,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onStop,
  onSensitivityChange,
  onNoiseGateChange,
  multiVisualizationConfig,
  onMultiVisualizationConfigChange,
}: MultiPlayerViewProps) => {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [volumeVisible, setVolumeVisible] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = useCallback(() => {
    setControlsVisible(true);
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    const timeout = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
    setHideTimeout(timeout);
  }, [hideTimeout]);

  const handleSeek = (value: number[]) => {
    if (onSeek) onSeek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (onVolumeChange) onVolumeChange(value[0] / 100);
  };

  useEffect(() => {
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
        }
        const timeout = setTimeout(() => {
          setControlsVisible(false);
        }, 1000);
        setHideTimeout(timeout);
      }}
    >
      {/* Full-screen Multi-Visualization Background */}
      <div className="absolute inset-0 z-0" style={{ bottom: "80px" }}>
        <MultiAudioVisualizer
          audioData={audioData}
          isPlaying={isPlaying}
          config={multiVisualizationConfig}
          onConfigChange={onMultiVisualizationConfigChange}
        />
      </div>

      {/* Now Playing Card - Bottom Left */}
      <div
        className={`absolute bottom-6 left-6 z-20 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="glass flex items-center gap-4 p-4 min-w-72">
          {/* Back Button */}
          <button
            onClick={(mode === "system" || mode === "microphone") && isCapturing ? onStop : onBack}
            className="glass-interactive p-3 hover:scale-105 smooth-transition flex-shrink-0"
          >
            <ArrowLeft
              className="w-5 h-5"
              style={{ color: "var(--color-text-primary)" }}
            />
          </button>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <p
              className="text-lg font-medium truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {mode === "file"
                ? `Now Playing: ${fileName || "Unknown Track"}`
                : mode === "system"
                ? "Capturing System Audio"
                : "Recording Microphone"}
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {mode === "microphone" && microphoneLevel !== undefined
                ? `Level: ${Math.round(microphoneLevel * 100)}% | Multi-Visualization Mode`
                : "Multi-Visualization Mode"}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Controls Overlay (Only for file mode) */}
      {mode === "file" && audioState && (
        <div
          className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-300 ${
            controlsVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="glass p-6 min-w-96">
            {/* Progress Bar */}
            <div className="space-y-3 mb-6">
              <Slider
                value={[audioState.currentTime]}
                max={audioState.duration}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div
                className="flex justify-between text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <span>{formatTime(audioState.currentTime)}</span>
                <span>{formatTime(audioState.duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() =>
                  onSeek && onSeek(Math.max(0, audioState.currentTime - 10))
                }
                className="glass-interactive p-3 hover:scale-105 smooth-transition"
              >
                <SkipBack
                  className="w-5 h-5"
                  style={{ color: "var(--color-text-primary)" }}
                />
              </button>

              <button
                onClick={audioState.isPlaying ? onPause : onPlay}
                className="w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 smooth-transition"
                style={{
                  background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                  boxShadow: "var(--box-shadow-glow-sm)",
                }}
              >
                {audioState.isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </button>

              <button
                onClick={() =>
                  onSeek &&
                  onSeek(
                    Math.min(audioState.duration, audioState.currentTime + 10)
                  )
                }
                className="glass-interactive p-3 hover:scale-105 smooth-transition"
              >
                <SkipForward
                  className="w-5 h-5"
                  style={{ color: "var(--color-text-primary)" }}
                />
              </button>

              {/* Volume Control */}
              <div className="relative ml-4">
                <button
                  onClick={() => setVolumeVisible(!volumeVisible)}
                  className="glass-interactive p-3 hover:scale-105 smooth-transition"
                >
                  <Volume2
                    className="w-5 h-5"
                    style={{ color: "var(--color-text-primary)" }}
                  />
                </button>

                {volumeVisible && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2">
                    <div className="glass p-4 w-8 h-32 flex flex-col items-center">
                      <Slider
                        orientation="vertical"
                        value={[audioState.volume * 100]}
                        max={100}
                        step={1}
                        onValueChange={handleVolumeChange}
                        className="h-20"
                      />
                      <span
                        className="text-xs mt-2"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {Math.round(audioState.volume * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Microphone Controls (Only for microphone mode) */}
      {mode === "microphone" && sensitivity !== undefined && noiseGate !== undefined && (
        <div
          className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-300 ${
            controlsVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="glass p-6 min-w-96">
            {/* Microphone Level Display */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Microphone Level
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {Math.round((microphoneLevel || 0) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-100"
                  style={{
                    width: `${(microphoneLevel || 0) * 100}%`,
                    background: `linear-gradient(90deg, 
                      ${(microphoneLevel || 0) > 0.8 ? '#ef4444' : 
                        (microphoneLevel || 0) > 0.5 ? '#f59e0b' : '#10b981'}`,
                  }}
                />
              </div>
            </div>

            {/* Microphone Controls */}
            <div className="space-y-4">
              {/* Sensitivity Control */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Sensitivity
                  </label>
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {Math.round(sensitivity * 100)}%
                  </span>
                </div>
                <Slider
                  value={[sensitivity]}
                  onValueChange={(value) => onSensitivityChange && onSensitivityChange(value[0])}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Noise Gate Control */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Noise Gate
                  </label>
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {Math.round(noiseGate * 100)}%
                  </span>
                </div>
                <Slider
                  value={[noiseGate]}
                  onValueChange={(value) => onNoiseGateChange && onNoiseGateChange(value[0])}
                  min={0}
                  max={0.5}
                  step={0.01}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Visualization Controller - Bottom Right */}
      <div
        className={`absolute bottom-6 right-6 z-20 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <MultiVisualizationController
          config={multiVisualizationConfig}
          onConfigChange={onMultiVisualizationConfigChange}
          isVisible={controlsVisible}
        />
      </div>
    </div>
  );
};
