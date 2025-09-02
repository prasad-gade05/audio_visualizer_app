import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { MicrophoneLevelMeter } from "@/components/MicrophoneLevelMeter";
import {
  Mic,
  MicOff,
  Square,
  AlertCircle,
  Info,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";

interface MicrophoneCaptureProps {
  isCapturing: boolean;
  isSupported: boolean;
  error: string;
  microphoneLevel: number;
  sensitivity: number;
  noiseGate: number;
  onStart: () => void;
  onStop: () => void;
  onSensitivityChange: (value: number) => void;
  onNoiseGateChange: (value: number) => void;
}

export const MicrophoneCapture = ({
  isCapturing,
  isSupported,
  error,
  microphoneLevel,
  sensitivity,
  noiseGate,
  onStart,
  onStop,
  onSensitivityChange,
  onNoiseGateChange,
}: MicrophoneCaptureProps) => {
  if (!isSupported) {
    return (
      <div className="glass-interactive p-6">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="w-5 h-5 mt-1"
            style={{ color: "var(--color-tertiary)" }}
          />
          <div>
            <h4
              className="font-medium mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              Microphone Not Supported
            </h4>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Microphone access requires a modern browser with getUserMedia API support and HTTPS.
              Please make sure you're using a supported browser and accessing the site securely.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-interactive p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: isCapturing
                ? `linear-gradient(135deg, var(--color-secondary), var(--color-tertiary))`
                : `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              boxShadow: isCapturing ? "var(--box-shadow-glow-md)" : "var(--box-shadow-glow-sm)",
            }}
          >
            {isCapturing ? (
              <Mic className="w-6 h-6 text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3
              className="font-semibold text-lg"
              style={{ color: "var(--color-text-primary)" }}
            >
              {isCapturing ? "Recording Microphone" : "Microphone Input"}
            </h3>
            <p style={{ color: "var(--color-text-secondary)" }}>
              {isCapturing
                ? "Visualizing audio from your microphone in real-time"
                : "Capture and visualize audio from your microphone"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isCapturing && (
            <div className="flex items-center gap-2 px-3 py-1 glass rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                Live
              </span>
            </div>
          )}

          <button
            onClick={isCapturing ? onStop : onStart}
            className={`glass-interactive px-6 py-3 hover:scale-105 smooth-transition ${
              isCapturing ? "hover:bg-red-500/20" : ""
            }`}
            style={{ color: "var(--color-text-primary)" }}
          >
            {isCapturing ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </>
            )}
          </button>
        </div>
      </div>

      {/* Level Meter Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Volume2 
            className="w-4 h-4" 
            style={{ color: "var(--color-text-secondary)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Microphone Level
          </span>
        </div>
        <MicrophoneLevelMeter 
          level={microphoneLevel} 
          isActive={isCapturing}
          className="w-full"
        />
      </div>

      {/* Controls Section */}
      {(isCapturing || microphoneLevel > 0) && (
        <div className="glass p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings 
              className="w-4 h-4" 
              style={{ color: "var(--color-secondary)" }}
            />
            <h4
              className="font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Audio Settings
            </h4>
          </div>

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
              onValueChange={(value) => onSensitivityChange(value[0])}
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
              onValueChange={(value) => onNoiseGateChange(value[0])}
              min={0}
              max={0.5}
              step={0.01}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="glass-interactive p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="w-5 h-5 mt-1"
              style={{ color: "var(--color-tertiary)" }}
            />
            <div>
              <h4
                className="font-medium mb-1"
                style={{ color: "var(--color-text-primary)" }}
              >
                Error
              </h4>
              <p style={{ color: "var(--color-text-secondary)" }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isCapturing && !error && (
        <div className="space-y-4">
          <div className="glass p-4">
            <div className="flex items-start gap-3">
              <Info
                className="w-5 h-5 mt-1"
                style={{ color: "var(--color-secondary)" }}
              />
              <div>
                <h4
                  className="font-medium mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  How to use microphone input:
                </h4>
                <ol
                  className="list-decimal list-inside space-y-1 text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <li>Click "Start Recording" above</li>
                  <li>Allow microphone access when prompted by your browser</li>
                  <li>Speak, sing, or play music near your microphone</li>
                  <li>Adjust sensitivity and noise gate settings for optimal visualization</li>
                  <li>Watch the real-time visualization respond to your audio</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="glass p-4">
            <div className="flex items-start gap-3">
              <Mic
                className="w-5 h-5 mt-1"
                style={{ color: "var(--color-primary)" }}
              />
              <div>
                <h4
                  className="font-medium mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Tips for best results:
                </h4>
                <ul
                  className="list-disc list-inside space-y-1 text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <li>Use a quality microphone for better audio capture</li>
                  <li>Minimize background noise for cleaner visualizations</li>
                  <li>Adjust sensitivity if the visualization is too weak or strong</li>
                  <li>Use noise gate to filter out quiet background sounds</li>
                  <li>Try different audio sources: voice, instruments, or music</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};