import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  SkipBack,
  SkipForward,
  Settings,
  Mic,
} from "lucide-react";
import { MultiAudioVisualizer } from "./MultiAudioVisualizer";
import { MultiVisualizationController } from "./MultiVisualizationController";
import { AudioState, AudioData, MultiVisualizationConfig } from "@/types/audio";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
      className="flex flex-col h-screen w-full overflow-hidden bg-black"
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
      {/* Visualizer Area - Takes remaining space */}
      <div className="flex-1 relative overflow-hidden">
        <MultiAudioVisualizer
          audioData={audioData}
          isPlaying={isPlaying}
          config={multiVisualizationConfig}
          onConfigChange={onMultiVisualizationConfigChange}
        />
      </div>

      {/* Control Bar - Fixed height, no overlap */}
      <div 
        className={`h-20 glass z-30 flex items-center justify-between px-6 py-2 transition-transform duration-300 ${
          controlsVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ 
          borderTop: "1px solid rgba(255,255,255,0.1)",
          backgroundColor: "rgba(13, 11, 20, 0.8)",
          backdropFilter: "blur(12px)"
        }}
      >
        {/* Left: Info & Back */}
        <div className="flex items-center gap-4 min-w-[200px] w-1/4">
          <button
            onClick={(mode === "system" || mode === "microphone") && isCapturing ? onStop : onBack}
            className="glass-interactive p-2 hover:scale-105 smooth-transition flex-shrink-0 rounded-full"
            title="Back"
          >
            <ArrowLeft
              className="w-5 h-5"
              style={{ color: "var(--color-text-primary)" }}
            />
          </button>

          <div className="flex-1 min-w-0 overflow-hidden">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {mode === "file"
                ? fileName || "Unknown Track"
                : mode === "system"
                ? "System Audio"
                : "Microphone Input"}
            </p>
            <p
              className="text-xs truncate opacity-70"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {mode === "microphone" 
                ? "Recording..." 
                : mode === "system" 
                ? "Capturing..." 
                : "Playing"}
            </p>
          </div>
        </div>

        {/* Center: Player / Mic Controls */}
        <div className="flex-1 flex justify-center items-center max-w-2xl px-4">
          {mode === "file" && audioState && (
            <div className="flex items-center gap-4 w-full">
              {/* Time */}
              <span className="text-xs font-mono opacity-70 w-10 text-right">
                {formatTime(audioState.currentTime)}
              </span>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSeek && onSeek(Math.max(0, audioState.currentTime - 10))}
                  className="p-2 hover:text-white opacity-70 hover:opacity-100 transition-opacity"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={audioState.isPlaying ? onPause : onPlay}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 smooth-transition"
                  style={{
                    background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                    boxShadow: "var(--box-shadow-glow-sm)",
                  }}
                >
                  {audioState.isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-1" />
                  )}
                </button>
                <button
                  onClick={() => onSeek && onSeek(Math.min(audioState.duration, audioState.currentTime + 10))}
                  className="p-2 hover:text-white opacity-70 hover:opacity-100 transition-opacity"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Progress */}
              <div className="flex-1 mx-2">
                <Slider
                  value={[audioState.currentTime]}
                  max={audioState.duration}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
              </div>

              {/* Duration */}
              <span className="text-xs font-mono opacity-70 w-10">
                {formatTime(audioState.duration)}
              </span>

              {/* Volume */}
              <div className="relative group">
                <button
                  onClick={() => setVolumeVisible(!volumeVisible)}
                  className="p-2 hover:text-white opacity-70 hover:opacity-100 transition-opacity"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                
                {/* Hover Volume Slider */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block hover:block">
                   <div className="glass p-3 h-32 flex flex-col items-center rounded-lg">
                      <Slider
                        orientation="vertical"
                        value={[audioState.volume * 100]}
                        max={100}
                        step={1}
                        onValueChange={handleVolumeChange}
                        className="h-24"
                      />
                   </div>
                </div>
              </div>
            </div>
          )}

          {mode === "microphone" && (
            <div className="flex items-center gap-6 w-full max-w-md">
               {/* Level Meter */}
               <div className="flex-1 flex items-center gap-3">
                  <Mic className="w-4 h-4 opacity-70" />
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-100"
                      style={{
                        width: `${(microphoneLevel || 0) * 100}%`,
                        background: `linear-gradient(90deg, #10b981, ${(microphoneLevel || 0) > 0.6 ? '#f59e0b' : '#10b981'}, ${(microphoneLevel || 0) > 0.9 ? '#ef4444' : '#f59e0b'})`,
                      }}
                    />
                  </div>
               </div>

               {/* Settings Popover */}
               <Popover>
                 <PopoverTrigger asChild>
                   <button className="glass-interactive px-3 py-1.5 text-xs flex items-center gap-2 rounded-full">
                     <Settings className="w-3 h-3" />
                     Settings
                   </button>
                 </PopoverTrigger>
                 <PopoverContent className="w-64 glass p-4" side="top">
                   <div className="space-y-4">
                     <div className="space-y-2">
                       <div className="flex justify-between text-xs">
                         <span>Sensitivity</span>
                         <span>{Math.round((sensitivity || 1) * 100)}%</span>
                       </div>
                       <Slider
                         value={[sensitivity || 1]}
                         onValueChange={(v) => onSensitivityChange?.(v[0])}
                         min={0.1} max={3} step={0.1}
                       />
                     </div>
                     <div className="space-y-2">
                       <div className="flex justify-between text-xs">
                         <span>Noise Gate</span>
                         <span>{Math.round((noiseGate || 0) * 100)}%</span>
                       </div>
                       <Slider
                         value={[noiseGate || 0]}
                         onValueChange={(v) => onNoiseGateChange?.(v[0])}
                         min={0} max={0.5} step={0.01}
                       />
                     </div>
                   </div>
                 </PopoverContent>
               </Popover>
            </div>
          )}
        </div>

        {/* Right: Visual Toggles */}
        <div className="w-1/4 flex justify-end">
          <MultiVisualizationController
            config={multiVisualizationConfig}
            onConfigChange={onMultiVisualizationConfigChange}
            isVisible={true} // Always visible in the bar
          />
        </div>
      </div>
    </div>
  );
};
