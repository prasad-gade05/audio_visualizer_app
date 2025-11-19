import { useState } from "react";
import { LandingView } from "@/components/LandingView";
import { MultiPlayerView } from "@/components/MultiPlayerView";
import { FileUpload } from "@/components/FileUpload";
import { SystemAudioCapture } from "@/components/SystemAudioCapture";
import { MicrophoneCapture } from "@/components/MicrophoneCapture";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { useSystemAudio } from "@/hooks/useSystemAudio";
import { useMicrophoneAudio } from "@/hooks/useMicrophoneAudio";
import { MultiVisualizationConfig } from "@/types/audio";

type AppView =
  | "landing"
  | "fileUpload"
  | "systemAudio"
  | "microphoneAudio"
  | "filePlayer"
  | "systemPlayer"
  | "microphonePlayer";

export default function Index() {
  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [fileName, setFileName] = useState<string>("");
  const [multiVisualizationConfig, setMultiVisualizationConfig] =
    useState<MultiVisualizationConfig>({
      enabled: {
        bars: true,
        circular: true,
        waveform: true,
        particles: false,
        "mirrored-waveform": true,
        "3d-globe": true,
        analytics: true,
      },
      positions: {
        bars: { gridSlot: 0, zIndex: 1 },
        circular: { gridSlot: 1, zIndex: 2 },
        waveform: { gridSlot: 2, zIndex: 3 },
        particles: { gridSlot: 3, zIndex: 4 },
        "mirrored-waveform": { gridSlot: 4, zIndex: 5 },
        "3d-globe": { gridSlot: 5, zIndex: 6 },
        analytics: { gridSlot: 6, zIndex: 7 },
      },
      configs: {
        bars: {
          type: "bars",
          color: "#8A42FF",
          sensitivity: 1,
          smoothing: 0.8,
          secondaryColor: "#00D1FF",
          backgroundColor: "#0D0B14",
          barCount: 32,
        },
        circular: {
          type: "circular",
          color: "#00D1FF",
          sensitivity: 1,
          smoothing: 0.8,
          secondaryColor: "#FF55E1",
          backgroundColor: "#0D0B14",
          radius: 1,
          intensity: 1,
        },
        waveform: {
          type: "waveform",
          color: "#FF55E1",
          sensitivity: 1,
          smoothing: 0.8,
          secondaryColor: "#8A42FF",
          backgroundColor: "#0D0B14",
        },
        particles: {
          type: "particles",
          color: "#8A42FF",
          sensitivity: 1,
          smoothing: 0.8,
          secondaryColor: "#00D1FF",
          backgroundColor: "#0D0B14",
          particleCount: 100,
        },
        "mirrored-waveform": {
          type: "mirrored-waveform",
          color: "#FFA500",
          sensitivity: 1,
          smoothing: 0.8,
          secondaryColor: "#FF0000",
          backgroundColor: "#0d0b14",
        },
        "3d-globe": {
          type: "3d-globe",
          color: "#8A42FF",
          sensitivity: 1,
          smoothing: 0.8,
          secondaryColor: "#00D1FF",
          backgroundColor: "#000000",
        },
        analytics: {
          type: "analytics",
          color: "#8A42FF",
          sensitivity: 1,
          smoothing: 0.8,
          secondaryColor: "#00D1FF",
          backgroundColor: "#0d0b14",
        },
      },
    });

  // File-based audio
  const {
    audioState,
    audioData: fileAudioData,
    initializeAudio,
    play,
    pause,
    seek,
    setVolume,
  } = useAudioAnalyzer();

  // System audio capture
  const {
    audioData: systemAudioData,
    isCapturing,
    isSupported,
    error,
    startSystemAudioCapture,
    stopSystemAudioCapture,
  } = useSystemAudio();

  // Microphone audio capture
  const {
    audioData: microphoneAudioData,
    isCapturing: isMicrophoneCapturing,
    isSupported: isMicrophoneSupported,
    error: microphoneError,
    microphoneLevel,
    sensitivity,
    noiseGate,
    startMicrophoneCapture,
    stopMicrophoneCapture,
    setSensitivity,
    setNoiseGate,
  } = useMicrophoneAudio();

  const handleFileUploadClick = () => {
    setCurrentView("fileUpload");
  };

  const handleSystemAudioClick = () => {
    if (isSupported) {
      setCurrentView("systemAudio");
    } else {
      // Show error dialog or handle unsupported case
      alert(
        "System audio capture is not supported in your browser. Please use Chrome or Edge with HTTPS."
      );
    }
  };

  const handleMicrophoneClick = () => {
    if (isMicrophoneSupported) {
      setCurrentView("microphoneAudio");
    } else {
      alert(
        "Microphone access is not supported in your browser. Please use a modern browser with HTTPS."
      );
    }
  };

  const handleFileSelect = async (file: File) => {
    setFileName(file.name);
    await initializeAudio(file);
    setCurrentView("filePlayer");
  };

  const handleContinuePlaying = () => {
    setCurrentView("filePlayer");
  };

  const handleSystemAudioStart = async () => {
    try {
      await startSystemAudioCapture();
      setCurrentView("systemPlayer");
    } catch (err) {
      // Error handling is done in the hook
    }
  };

  const handleMicrophoneStart = async () => {
    try {
      await startMicrophoneCapture();
      setCurrentView("microphonePlayer");
    } catch (err) {
      // Error handling is done in the hook
    }
  };

  const handleBack = () => {
    // Stop audio playback if coming from file player
    if (currentView === "filePlayer") {
      pause();
    }
    // Stop system audio if coming from system player
    if (currentView === "systemPlayer") {
      stopSystemAudioCapture();
    }
    // Stop microphone if coming from microphone player
    if (currentView === "microphonePlayer") {
      stopMicrophoneCapture();
    }
    
    setCurrentView("landing");
  };

  const handleStop = () => {
    stopSystemAudioCapture();
    setCurrentView("landing");
  };

  const handleMicrophoneStop = () => {
    stopMicrophoneCapture();
    setCurrentView("landing");
  };

  const renderView = () => {
    switch (currentView) {
      case "landing":
        return (
          <LandingView
            onFileUploadClick={handleFileUploadClick}
            onSystemAudioClick={handleSystemAudioClick}
            onMicrophoneClick={handleMicrophoneClick}
          />
        );

      case "fileUpload":
        return (
          <div
            className="min-h-screen flex items-center justify-center p-6 overflow-y-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`
              .scrollable-container::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="w-full max-w-2xl">
              <div className="glass p-8 mb-6">
                <h2
                  className="text-2xl font-bold mb-6 text-center"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Upload Audio File
                </h2>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  isLoaded={audioState.isLoaded}
                  onContinuePlaying={handleContinuePlaying}
                />
                {fileName && (
                  <div className="mt-4 p-4 glass-interactive text-center">
                    <p style={{ color: "var(--color-text-primary)" }}>
                      Selected: <strong>{fileName}</strong>
                    </p>
                  </div>
                )}
              </div>
              <div className="text-center">
                <button
                  onClick={handleBack}
                  className="glass-interactive px-6 py-3"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        );

      case "systemAudio":
        return (
          <div
            className="min-h-screen flex items-center justify-center p-6 overflow-y-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="w-full max-w-2xl">
              <div className="glass p-8 mb-6">
                <h2
                  className="text-2xl font-bold mb-6 text-center"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  System Audio Capture
                </h2>
                <SystemAudioCapture
                  isCapturing={isCapturing}
                  isSupported={isSupported}
                  error={error}
                  onStart={handleSystemAudioStart}
                  onStop={stopSystemAudioCapture}
                />
              </div>
              <div className="text-center">
                <button
                  onClick={handleBack}
                  className="glass-interactive px-6 py-3"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        );

      case "microphoneAudio":
        return (
          <div
            className="min-h-screen flex items-center justify-center p-6 overflow-y-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="w-full max-w-2xl">
              <div className="glass p-8 mb-6">
                <h2
                  className="text-2xl font-bold mb-6 text-center"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Microphone Input
                </h2>
                <MicrophoneCapture
                  isCapturing={isMicrophoneCapturing}
                  isSupported={isMicrophoneSupported}
                  error={microphoneError}
                  microphoneLevel={microphoneLevel}
                  sensitivity={sensitivity}
                  noiseGate={noiseGate}
                  onStart={handleMicrophoneStart}
                  onStop={stopMicrophoneCapture}
                  onSensitivityChange={setSensitivity}
                  onNoiseGateChange={setNoiseGate}
                />
              </div>
              <div className="text-center">
                <button
                  onClick={handleBack}
                  className="glass-interactive px-6 py-3"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        );

      case "filePlayer":
        return (
          <MultiPlayerView
            mode="file"
            fileName={fileName}
            audioState={audioState}
            audioData={fileAudioData}
            isPlaying={audioState.isPlaying}
            onBack={handleBack}
            onPlay={play}
            onPause={pause}
            onSeek={seek}
            onVolumeChange={setVolume}
            multiVisualizationConfig={multiVisualizationConfig}
            onMultiVisualizationConfigChange={setMultiVisualizationConfig}
          />
        );

      case "systemPlayer":
        return (
          <MultiPlayerView
            mode="system"
            audioData={systemAudioData}
            isPlaying={isCapturing}
            isCapturing={isCapturing}
            onBack={handleBack}
            onStop={handleStop}
            multiVisualizationConfig={multiVisualizationConfig}
            onMultiVisualizationConfigChange={setMultiVisualizationConfig}
          />
        );

      case "microphonePlayer":
        return (
          <MultiPlayerView
            mode="microphone"
            audioData={microphoneAudioData}
            isPlaying={isMicrophoneCapturing}
            isCapturing={isMicrophoneCapturing}
            microphoneLevel={microphoneLevel}
            sensitivity={sensitivity}
            noiseGate={noiseGate}
            onBack={handleBack}
            onStop={handleMicrophoneStop}
            onSensitivityChange={setSensitivity}
            onNoiseGateChange={setNoiseGate}
            multiVisualizationConfig={multiVisualizationConfig}
            onMultiVisualizationConfigChange={setMultiVisualizationConfig}
          />
        );

      default:
        return null;
    }
  };

  return <>{renderView()}</>;
}
