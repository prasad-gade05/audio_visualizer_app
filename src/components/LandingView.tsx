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
              <Headphones className="w-8 h-8 text-white" />
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
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 smooth-transition"
                style={{
                  background: `linear-gradient(135deg, var(--color-primary), var(--color-tertiary))`,
                  boxShadow: '0 0 20px rgba(138, 66, 255, 0.3)'
                }}
              >
                <Upload className="w-8 h-8 text-white" />
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
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 smooth-transition"
                style={{
                  background: `linear-gradient(135deg, var(--color-secondary), var(--color-tertiary))`,
                  boxShadow: '0 0 20px rgba(0, 209, 255, 0.3)'
                }}
              >
                <Monitor className="w-8 h-8 text-white" />
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
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 smooth-transition"
                style={{
                  background: `linear-gradient(135deg, var(--color-tertiary), var(--color-primary))`,
                  boxShadow: '0 0 20px rgba(255, 85, 225, 0.3)'
                }}
              >
                <Mic className="w-8 h-8 text-white" />
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