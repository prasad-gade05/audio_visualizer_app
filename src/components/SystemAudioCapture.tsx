import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Monitor, MonitorSpeaker, Square, AlertCircle, Info } from 'lucide-react';

interface SystemAudioCaptureProps {
  isCapturing: boolean;
  isSupported: boolean;
  error: string;
  onStart: () => void;
  onStop: () => void;
}

export const SystemAudioCapture = ({
  isCapturing,
  isSupported,
  error,
  onStart,
  onStop,
}: SystemAudioCaptureProps) => {
  if (!isSupported) {
    return (
      <div className="glass-interactive p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-1" style={{ color: 'var(--color-tertiary)' }} />
          <div>
            <h4 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Browser Not Supported
            </h4>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              System audio capture requires Chrome or Edge browser with HTTPS. Please make sure you're using a supported browser and accessing the site securely.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-interactive p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: isCapturing 
                ? `linear-gradient(135deg, var(--color-secondary), var(--color-tertiary))`
                : `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              boxShadow: 'var(--box-shadow-glow-sm)'
            }}
          >
            {isCapturing ? (
              <MonitorSpeaker className="w-6 h-6 text-white" />
            ) : (
              <Monitor className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 
              className="font-semibold text-lg"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {isCapturing ? 'Capturing System Audio' : 'System Audio Capture'}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {isCapturing 
                ? 'Visualizing audio from your system in real-time'
                : 'Capture and visualize any audio playing on your system'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isCapturing && (
            <div className="flex items-center gap-2 px-3 py-1 glass rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Live
              </span>
            </div>
          )}
          
          <button
            onClick={isCapturing ? onStop : onStart}
            className={`glass-interactive px-6 py-3 hover:scale-105 smooth-transition ${
              isCapturing ? 'hover:bg-red-500/20' : ''
            }`}
            style={{ color: 'var(--color-text-primary)' }}
          >
            {isCapturing ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Capture
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4 mr-2" />
                Start Capture
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-interactive p-4 mt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-1" style={{ color: 'var(--color-tertiary)' }} />
            <div>
              <h4 className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Error
              </h4>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isCapturing && !error && (
        <div className="space-y-4 mt-4">
          <div className="glass p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 mt-1" style={{ color: 'var(--color-secondary)' }} />
              <div>
                <h4 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  How to capture system audio:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>Click "Start Capture" above</li>
                  <li>In the browser dialog, select your entire screen or a specific window</li>
                  <li><strong>Important:</strong> Check the "Share system audio" or "Share audio" checkbox</li>
                  <li>Click "Share" to start capturing</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="glass p-4">
            <div className="flex items-start gap-3">
              <Monitor className="w-5 h-5 mt-1" style={{ color: 'var(--color-primary)' }} />
              <div>
                <h4 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Requirements:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>Chrome or Edge browser (recommended)</li>
                  <li>HTTPS connection (secure site)</li>
                  <li>Permission to share screen with audio</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};