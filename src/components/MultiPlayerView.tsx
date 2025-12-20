import { useState, useEffect, useCallback, useRef, memo } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
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

  useEffect(() => {
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden bg-black relative"
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
      {/* Visualizer Area - Dynamically expands when controls are hidden */}
      <div 
        className="relative overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          height: controlsVisible ? 'calc(100vh - 3.5rem)' : '100vh'
        }}
      >
        <MultiAudioVisualizer
          audioData={audioData}
          isPlaying={isPlaying}
          config={multiVisualizationConfig}
          onConfigChange={onMultiVisualizationConfigChange}
        />
      </div>

      {/* Control Bar - Slides in from bottom */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-14 glass z-30 flex items-center justify-between px-4 py-1.5 transition-transform duration-300 ${
          controlsVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ 
          borderTop: "1px solid rgba(255,255,255,0.05)",
          backgroundColor: "rgba(10, 10, 10, 0.9)",
          backdropFilter: "blur(8px)"
        }}
      >
        {/* Left: Info & Back */}
        <div className="flex items-center gap-2 min-w-[150px] w-1/4">
          <button
            onClick={(mode === "system" || mode === "microphone") && isCapturing ? onStop : onBack}
            className="p-1.5 hover:scale-105 smooth-transition flex-shrink-0 rounded-full opacity-70 hover:opacity-100"
            title="Back"
            style={{ backgroundColor: 'rgba(20, 20, 20, 0.6)' }}
          >
            <ArrowLeft
              className="w-4 h-4"
              style={{ color: "#93c5fd" }}
            />
          </button>

          <div className="flex-1 min-w-0 overflow-hidden">
            <p
              className="text-xs font-medium truncate"
              style={{ color: "#ffffff" }}
            >
              {mode === "file"
                ? fileName || "Unknown Track"
                : mode === "system"
                ? "System Audio"
                : "Microphone"}
            </p>
          </div>
        </div>

        {/* Center: Player / Mic Controls */}
        <div className="flex-1 flex justify-center items-center max-w-2xl px-2">
          {mode === "file" && audioState && (
            <div className="flex items-center gap-2 w-full">
              {/* Time */}
              <span className="text-xs font-mono opacity-50 w-9 text-right">
                {formatTime(audioState.currentTime)}
              </span>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onSeek && onSeek(Math.max(0, audioState.currentTime - 10))}
                  className="p-1 hover:text-white opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: "#a78bfa" }}
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={audioState.isPlaying ? onPause : onPlay}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-105 smooth-transition"
                  style={{
                    background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                    boxShadow: "0 0 8px rgba(99, 102, 241, 0.3)",
                  }}
                >
                  {audioState.isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => onSeek && onSeek(Math.min(audioState.duration, audioState.currentTime + 10))}
                  className="p-1 hover:text-white opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: "#a78bfa" }}
                >
                  <SkipForward className="w-3.5 h-3.5" />
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
              <span className="text-xs font-mono opacity-50 w-9">
                {formatTime(audioState.duration)}
              </span>
            </div>
          )}

          {mode === "microphone" && (
            <div className="flex items-center gap-3 w-full max-w-md">
               {/* Level Meter */}
               <div className="flex-1 flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 opacity-50" style={{ color: "#34d399" }} />
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
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
                   <button 
                     className="px-2 py-1 text-xs flex items-center gap-1.5 rounded-full opacity-70 hover:opacity-100"
                     style={{ 
                       backgroundColor: 'rgba(20, 20, 20, 0.6)', 
                       color: '#ffffff'
                     }}
                   >
                     <Settings className="w-3 h-3" style={{ color: '#f472b6' }} />
                   </button>
                 </PopoverTrigger>
                 <PopoverContent className="w-56 p-3" side="top" style={{ backgroundColor: 'rgba(15, 15, 15, 0.95)', borderColor: 'rgba(64, 64, 64, 0.3)', backdropFilter: 'blur(12px)' }}>
                   <div className="space-y-3">
                     <div className="space-y-1.5">
                       <div className="flex justify-between text-xs" style={{ color: '#ffffff' }}>
                         <span>Sensitivity</span>
                         <span>{Math.round((sensitivity || 1) * 100)}%</span>
                       </div>
                       <Slider
                         value={[sensitivity || 1]}
                         onValueChange={(v) => onSensitivityChange?.(v[0])}
                         min={0.1} max={3} step={0.1}
                       />
                     </div>
                     <div className="space-y-1.5">
                       <div className="flex justify-between text-xs" style={{ color: '#ffffff' }}>
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
