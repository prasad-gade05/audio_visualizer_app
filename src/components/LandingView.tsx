import { Upload, Monitor, Mic, Headphones, ArrowLeft, AlertCircle, Info } from 'lucide-react';
import { StaticBackgroundVisualizer } from './StaticBackgroundVisualizer';
import { MusicNotesEffect } from './MusicNotesEffect';
import { useState } from 'react';

interface LandingViewProps {
  onFileSelect: (file: File) => void;
  onSystemAudioStart: () => void;
  onMicrophoneStart: () => void;
  isSystemSupported: boolean;
  isMicrophoneSupported: boolean;
  systemError: string;
  microphoneError: string;
  isSystemCapturing: boolean;
  isMicrophoneCapturing: boolean;
}

type ExpandedMode = 'none' | 'file' | 'system' | 'microphone';

export const LandingView = ({ 
  onFileSelect,
  onSystemAudioStart,
  onMicrophoneStart,
  isSystemSupported,
  isMicrophoneSupported,
  systemError,
  microphoneError,
  isSystemCapturing,
  isMicrophoneCapturing,
}: LandingViewProps) => {
  const [expandedMode, setExpandedMode] = useState<ExpandedMode>('none');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      onFileSelect(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const triggerFileInput = () => {
    const input = document.getElementById("audio-upload") as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const renderExpandedContent = () => {
    if (expandedMode === 'file') {
      return (
        <div className="glass p-8 mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            onClick={() => setExpandedMode('none')}
            className="mb-4 text-sm flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to options
          </button>
          
          <div
            className="glass-interactive p-8 cursor-pointer group hover:scale-102 smooth-transition"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={triggerFileInput}
            style={{ borderColor: 'rgba(167, 139, 250, 0.3)' }}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 smooth-transition"
                style={{
                  background: `linear-gradient(135deg, #a78bfa, #c4b5fd)`,
                  boxShadow: "0 0 24px rgba(167, 139, 250, 0.5)",
                }}
              >
                <Upload className="w-8 h-8" style={{ color: "#1a1a2e" }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                  Upload Audio File
                </h3>
                <p className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Drag and drop an audio file here, or click to browse
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-disabled)" }}>
                  Supports MP3, WAV, OGG, M4A formats
                </p>
              </div>
            </div>
          </div>
          <input
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      );
    }

    if (expandedMode === 'system') {
      return (
        <div className="glass p-8 mt-6 animate-in fade-in slide-in-from-top-4 duration-300" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          <button
            onClick={() => setExpandedMode('none')}
            className="mb-4 text-sm flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to options
          </button>

          {!isSystemSupported ? (
            <div className="flex items-start gap-3 p-4 glass-interactive">
              <AlertCircle className="w-5 h-5 mt-1" style={{ color: "#fca5a5" }} />
              <div>
                <h4 className="font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                  Browser Not Supported
                </h4>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  System audio capture requires Chrome or Edge browser with HTTPS.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, #38bdf8, #7dd3fc)`,
                    boxShadow: '0 0 24px rgba(56, 189, 248, 0.5)',
                  }}
                >
                  <Monitor className="w-8 h-8" style={{ color: "#1a1a2e" }} />
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                  System Audio Capture
                </h3>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Visualize any sound playing on your computer
                </p>
              </div>

              <button
                onClick={onSystemAudioStart}
                disabled={isSystemCapturing}
                className="w-full glass-interactive px-6 py-4 hover:scale-102 smooth-transition font-medium text-base"
                style={{ 
                  color: "#1a1a2e",
                  background: `linear-gradient(135deg, #38bdf8, #7dd3fc)`,
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
                }}
              >
                Start Capture
              </button>

              <div className="mt-4 p-4 glass flex items-start gap-3">
                <Info className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#67e8f9" }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Click "Start Capture", select your screen/window, and <strong>enable "Share system audio"</strong> checkbox
                </p>
              </div>

              {systemError && (
                <div className="mt-4 p-4 glass-interactive flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-1" style={{ color: "#fca5a5" }} />
                  <div>
                    <h4 className="font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>Error</h4>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{systemError}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    if (expandedMode === 'microphone') {
      return (
        <div className="glass p-8 mt-6 animate-in fade-in slide-in-from-top-4 duration-300" style={{ borderColor: 'rgba(244, 114, 182, 0.3)' }}>
          <button
            onClick={() => setExpandedMode('none')}
            className="mb-4 text-sm flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to options
          </button>

          {!isMicrophoneSupported ? (
            <div className="flex items-start gap-3 p-4 glass-interactive">
              <AlertCircle className="w-5 h-5 mt-1" style={{ color: "#fca5a5" }} />
              <div>
                <h4 className="font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                  Microphone Not Supported
                </h4>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Microphone access requires a modern browser with HTTPS.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, #f472b6, #f9a8d4)`,
                    boxShadow: '0 0 24px rgba(244, 114, 182, 0.5)',
                  }}
                >
                  <Mic className="w-8 h-8" style={{ color: "#1a1a2e" }} />
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                  Microphone Input
                </h3>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Record and visualize live audio from your microphone
                </p>
              </div>

              <button
                onClick={onMicrophoneStart}
                disabled={isMicrophoneCapturing}
                className="w-full glass-interactive px-6 py-4 hover:scale-102 smooth-transition font-medium text-base"
                style={{ 
                  color: "#1a1a2e",
                  background: `linear-gradient(135deg, #f472b6, #f9a8d4)`,
                  boxShadow: '0 0 20px rgba(244, 114, 182, 0.4)',
                }}
              >
                Start Recording
              </button>

              <div className="mt-4 p-4 glass flex items-start gap-3">
                <Info className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#67e8f9" }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Click "Start Recording" and allow microphone access when prompted by your browser
                </p>
              </div>

              {microphoneError && (
                <div className="mt-4 p-4 glass-interactive flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-1" style={{ color: "#fca5a5" }} />
                  <div>
                    <h4 className="font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>Error</h4>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{microphoneError}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    return null;
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Static Background Visualizer */}
      <StaticBackgroundVisualizer />
      
      {/* Music Notes Effect */}
      <MusicNotesEffect />
      
      {/* Main Content - positioned above background */}
      <div className="w-full max-w-4xl relative z-10">
        {/* Central Glassmorphic Container */}
        <div className="glass p-8 mb-8 text-center">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse"
              style={{
                background: `linear-gradient(135deg, #a78bfa, #7dd3fc)`,
                boxShadow: '0 0 40px rgba(167, 139, 250, 0.6), 0 0 60px rgba(125, 211, 252, 0.4)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            >
              <Headphones className="w-10 h-10" style={{ color: "#ffffff", filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
            </div>
            <div className="flex flex-col items-center">
              <h1 
                className="text-5xl font-bold mb-2"
                style={{ 
                  color: '#ffffff',
                  textShadow: '0 0 30px rgba(96, 165, 250, 0.6), 0 0 50px rgba(34, 211, 238, 0.4), 0 0 70px rgba(249, 158, 11, 0.3)'
                }}
              >
                Audio Visualizer
              </h1>
              <p 
                className="text-xl font-medium"
                style={{ 
                  color: '#93c5fd',
                  textShadow: '0 0 20px rgba(147, 197, 253, 0.4)'
                }}
              >
                Experience your music
              </p>
            </div>
          </div>
        </div>

        {/* Show cards only when nothing is expanded */}
        {expandedMode === 'none' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* File Upload Card */}
            <div 
              className="glass-interactive p-6 cursor-pointer group"
              onClick={() => setExpandedMode('file')}
              style={{
                borderColor: 'rgba(167, 139, 250, 0.3)',
              }}
            >
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 smooth-transition"
                  style={{
                    background: `linear-gradient(135deg, #a78bfa, #c4b5fd)`,
                    boxShadow: '0 0 24px rgba(167, 139, 250, 0.5), 0 0 48px rgba(167, 139, 250, 0.2)'
                  }}
                >
                  <Upload className="w-8 h-8" style={{ color: "#1a1a2e" }} />
                </div>
                <h3 
                  className="text-xl font-semibold mb-3"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Visualize a File
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Upload an audio file and see it come to life with beautiful visualizations
                </p>
              </div>
            </div>

            {/* System Audio Card */}
            <div 
              className="glass-interactive p-6 cursor-pointer group"
              onClick={() => setExpandedMode('system')}
              style={{
                borderColor: 'rgba(56, 189, 248, 0.3)',
              }}
            >
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 smooth-transition"
                  style={{
                    background: `linear-gradient(135deg, #38bdf8, #7dd3fc)`,
                    boxShadow: '0 0 24px rgba(56, 189, 248, 0.5), 0 0 48px rgba(56, 189, 248, 0.2)'
                  }}
                >
                  <Monitor className="w-8 h-8" style={{ color: "#1a1a2e" }} />
                </div>
                <h3 
                  className="text-xl font-semibold mb-3"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Capture System Audio
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Visualize any sound playing on your computer in real-time
                </p>
              </div>
            </div>

            {/* Microphone Card */}
            <div 
              className="glass-interactive p-6 cursor-pointer group"
              onClick={() => setExpandedMode('microphone')}
              style={{
                borderColor: 'rgba(244, 114, 182, 0.3)',
              }}
            >
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 smooth-transition"
                  style={{
                    background: `linear-gradient(135deg, #f472b6, #f9a8d4)`,
                    boxShadow: '0 0 24px rgba(244, 114, 182, 0.5), 0 0 48px rgba(244, 114, 182, 0.2)'
                  }}
                >
                  <Mic className="w-8 h-8" style={{ color: "#1a1a2e" }} />
                </div>
                <h3 
                  className="text-xl font-semibold mb-3"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Microphone Input
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Record and visualize live audio from your microphone
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expanded content area */}
        {renderExpandedContent()}
      </div>
    </div>
  );
};