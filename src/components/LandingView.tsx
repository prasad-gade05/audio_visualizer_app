import { Upload, Monitor, Mic, Headphones } from 'lucide-react';

interface LandingViewProps {
  onFileUploadClick: () => void;
  onSystemAudioClick: () => void;
  onMicrophoneClick: () => void;
}

export const LandingView = ({ onFileUploadClick, onSystemAudioClick, onMicrophoneClick }: LandingViewProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Central Glassmorphic Container */}
        <div className="glass p-8 mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                boxShadow: 'var(--box-shadow-glow-sm)'
              }}
            >
              <Headphones className="w-8 h-8" style={{ color: "#e9d5ff" }} />
            </div>
            <div>
              <h1 
                className="text-4xl font-bold mb-2"
                style={{ 
                  background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Audio Visualizer
              </h1>
              <p 
                className="text-lg"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Experience your music
              </p>
            </div>
          </div>
        </div>

        {/* Choice Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* File Upload Card */}
          <div 
            className="glass-interactive p-6 cursor-pointer group"
            onClick={onFileUploadClick}
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
            onClick={onSystemAudioClick}
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
            onClick={onMicrophoneClick}
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
      </div>
    </div>
  );
};