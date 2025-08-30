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
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          System audio capture requires Chrome or Edge browser with HTTPS. Please make sure you're using a supported browser and accessing the site securely.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            {isCapturing ? (
              <MonitorSpeaker className="w-5 h-5 text-purple-600" />
            ) : (
              <Monitor className="w-5 h-5 text-purple-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-purple-900">
              {isCapturing ? 'Capturing System Audio' : 'System Audio Capture'}
            </h3>
            <p className="text-sm text-purple-700">
              {isCapturing 
                ? 'Visualizing audio from your system in real-time'
                : 'Capture and visualize any audio playing on your system'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCapturing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-200 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-purple-800">Live</span>
            </div>
          )}
          
          <Button
            variant={isCapturing ? "destructive" : "default"}
            onClick={isCapturing ? onStop : onStart}
            className={isCapturing ? "" : "bg-purple-600 hover:bg-purple-700"}
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
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mt-3 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!isCapturing && !error && (
        <div className="space-y-3 mt-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-800">
                <p className="font-medium mb-1">How to capture system audio:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Click "Start Capture" below</li>
                  <li>In the browser dialog, select your entire screen or a specific window</li>
                  <li><strong>Important:</strong> Check the "Share system audio" or "Share audio" checkbox</li>
                  <li>Click "Share" to start capturing</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Monitor className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Chrome or Edge browser (recommended)</li>
                  <li>HTTPS connection (secure site)</li>
                  <li>Permission to share screen with audio</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};