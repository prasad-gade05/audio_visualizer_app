import { useState } from "react";
import { LandingView } from "@/components/LandingView";
import { MultiPlayerView } from "@/components/MultiPlayerView";
import { FileUpload } from "@/components/FileUpload";
import { SystemAudioCapture } from "@/components/SystemAudioCapture";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { useSystemAudio } from "@/hooks/useSystemAudio";
import { MultiVisualizationConfig } from "@/types/audio";

type AppView =
  | "landing"
  | "fileUpload"
  | "systemAudio"
  | "filePlayer"
  | "systemPlayer";

export default function Index() {
  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [fileName, setFileName] = useState<string>("");
  const [multiVisualizationConfig, setMultiVisualizationConfig] =
    useState<MultiVisualizationConfig>({
      enabled: {
        bars: true,
        circular: true,
        waveform: true,
        particles: true,
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

  const handleFileSelect = async (file: File) => {
    setFileName(file.name);
    await initializeAudio(file);
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

  const handleBack = () => {
    if (currentView === "filePlayer" || currentView === "systemPlayer") {
      setCurrentView("landing");
    } else {
      setCurrentView("landing");
    }
  };

  const handleStop = () => {
    stopSystemAudioCapture();
    setCurrentView("landing");
  };

  const renderView = () => {
    switch (currentView) {
      case "landing":
        return (
          <LandingView
            onFileUploadClick={handleFileUploadClick}
            onSystemAudioClick={handleSystemAudioClick}
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
            onSettingsClick={() => console.log("Settings clicked")}
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
            onSettingsClick={() => console.log("Settings clicked")}
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
