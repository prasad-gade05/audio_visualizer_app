import { useState, lazy, Suspense } from "react";
import { LandingView } from "@/components/LandingView";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { useSystemAudio } from "@/hooks/useSystemAudio";
import { useMicrophoneAudio } from "@/hooks/useMicrophoneAudio";
import { useAudioStore } from "@/lib/audioStore";

const MultiPlayerView = lazy(() => 
  import("@/components/MultiPlayerView").then(module => ({ default: module.MultiPlayerView }))
);

type AppView = "landing" | "filePlayer" | "systemPlayer" | "microphonePlayer";

export default function Index() {
  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [fileName, setFileName] = useState<string>("");
  
  const multiVisualizationConfig = useAudioStore(state => state.multiVisualizationConfig);
  const setMultiVisualizationConfig = useAudioStore(state => state.setMultiVisualizationConfig);

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
    await startSystemAudioCapture();
    setCurrentView("systemPlayer");
  };

  const handleMicrophoneStart = async () => {
    await startMicrophoneCapture();
    setCurrentView("microphonePlayer");
  };

  const handleBack = () => {
    if (currentView === "filePlayer") {
      pause();
    } else if (currentView === "systemPlayer") {
      stopSystemAudioCapture();
    } else if (currentView === "microphonePlayer") {
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
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
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
          </Suspense>
        );

      case "systemPlayer":
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
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
          </Suspense>
        );

      case "microphonePlayer":
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
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
          </Suspense>
        );

      default:
        return null;
    }
  };

  return <>{renderView()}</>;
}
