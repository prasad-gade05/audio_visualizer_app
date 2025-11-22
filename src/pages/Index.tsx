import { useState } from "react";
import { LandingView } from "@/components/LandingView";
import { MultiPlayerView } from "@/components/MultiPlayerView";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { useSystemAudio } from "@/hooks/useSystemAudio";
import { useMicrophoneAudio } from "@/hooks/useMicrophoneAudio";
import { MultiVisualizationConfig } from "@/types/audio";

type AppView = "landing" | "filePlayer" | "systemPlayer" | "microphonePlayer";

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
          backgroundColor: "#0a0a0a",
          barCount: 32,
        },
        circular: {
          type: "circular",
          color: "#00D1FF",
          sensitivity: 1,
          smoothing: 0.8,
          secondaryColor: "#FF55E1",
          backgroundColor: "#0a0a0a",
          radius: 1,
          intensity: 1,
        },
        waveform: {
          type: "waveform",
          color: "#FF55E1",
          sensitivity: 1,
          smoothing: 0.8,
          secondaryColor: "#8A42FF",
          backgroundColor: "#0a0a0a",
        },
        particles: {
          type: "particles",
          color: "#8A42FF",
          sensitivity: 1,
          smoothing: 0.8,
          secondaryColor: "#00D1FF",
          backgroundColor: "#0a0a0a",
          particleCount: 100,
        },
        "mirrored-waveform": {
          type: "mirrored-waveform",
          color: "#FFA500",
          sensitivity: 1,
          smoothing: 0.8,
          secondaryColor: "#FF0000",
          backgroundColor: "#0a0a0a",
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
            onFileSelect={handleFileSelect}
            onSystemAudioStart={handleSystemAudioStart}
            onMicrophoneStart={handleMicrophoneStart}
            isSystemSupported={isSupported}
            isMicrophoneSupported={isMicrophoneSupported}
            systemError={error}
            microphoneError={microphoneError}
            isSystemCapturing={isCapturing}
            isMicrophoneCapturing={isMicrophoneCapturing}
          />
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
