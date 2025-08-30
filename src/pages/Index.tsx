import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { SystemAudioCapture } from '@/components/SystemAudioCapture';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { AudioControls } from '@/components/AudioControls';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { useSystemAudio } from '@/hooks/useSystemAudio';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Headphones, Upload, Monitor } from 'lucide-react';

export default function Index() {
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

  const [fileName, setFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('file');

  const handleFileSelect = async (file: File) => {
    setFileName(file.name);
    await initializeAudio(file);
    setActiveTab('file');
  };

  // Determine which audio data to use for visualization
  const currentAudioData = activeTab === 'system' && isCapturing ? systemAudioData : fileAudioData;
  const isPlaying = activeTab === 'system' ? isCapturing : audioState.isPlaying;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Audio Visualizer
              </h1>
              <p className="text-blue-200 mt-1">
                Upload audio files or capture system audio for real-time visualizations
              </p>
            </div>
          </div>
        </Card>

        {/* Audio Source Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-md border-white/20">
            <TabsTrigger value="file" className="flex items-center gap-2 data-[state=active]:bg-white/20">
              <Upload className="w-4 h-4" />
              File Upload
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-white/20">
              <Monitor className="w-4 h-4" />
              System Audio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4 mt-6">
            {/* File Upload */}
            <FileUpload onFileSelect={handleFileSelect} isLoaded={audioState.isLoaded} />

            {/* Current File Info */}
            {fileName && (
              <Card className="p-4 bg-white/10 backdrop-blur-md border-white/20 text-white">
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">{fileName}</span>
                  {audioState.duration > 0 && (
                    <span className="text-blue-200 text-sm">
                      ({Math.floor(audioState.duration / 60)}:{(audioState.duration % 60).toFixed(0).padStart(2, '0')})
                    </span>
                  )}
                </div>
              </Card>
            )}

            {/* Audio Controls */}
            {audioState.isLoaded && (
              <AudioControls
                audioState={audioState}
                onPlay={play}
                onPause={pause}
                onSeek={seek}
                onVolumeChange={setVolume}
              />
            )}
          </TabsContent>

          <TabsContent value="system" className="space-y-4 mt-6">
            {/* System Audio Capture */}
            <SystemAudioCapture
              isCapturing={isCapturing}
              isSupported={isSupported}
              error={error}
              onStart={startSystemAudioCapture}
              onStop={stopSystemAudioCapture}
            />
          </TabsContent>
        </Tabs>

        {/* Audio Visualizer */}
        {(audioState.isLoaded || isCapturing) && (
          <AudioVisualizer 
            audioData={currentAudioData} 
            isPlaying={isPlaying} 
          />
        )}

        {/* Instructions */}
        {!audioState.isLoaded && !isCapturing && (
          <Card className="p-6 bg-white/5 backdrop-blur-md border-white/10 text-white">
            <h3 className="text-lg font-semibold mb-3 text-blue-300">How to use:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-200 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  File Upload Mode
                </h4>
                <ul className="space-y-2 text-blue-100 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Upload an audio file (MP3, WAV, OGG, M4A)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Control playback with built-in controls
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-200 mb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  System Audio Mode
                </h4>
                <ul className="space-y-2 text-blue-100 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Capture any audio playing on your system
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Visualize music, videos, games in real-time
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-500/20 rounded-lg">
              <p className="text-blue-100 text-sm">
                Choose from 4 visualization modes and enjoy real-time audio visualization!
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}