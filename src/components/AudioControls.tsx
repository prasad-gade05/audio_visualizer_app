import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Play, Pause, Volume2, SkipBack, SkipForward } from 'lucide-react';
import { AudioState } from '@/types/audio';

interface AudioControlsProps {
  audioState: AudioState;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
}

export const AudioControls = ({
  audioState,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
}: AudioControlsProps) => {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    onSeek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    onVolumeChange(value[0] / 100);
  };

  if (!audioState.isLoaded) {
    return null;
  }

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[audioState.currentTime]}
            max={audioState.duration}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(audioState.currentTime)}</span>
            <span>{formatTime(audioState.duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onSeek(Math.max(0, audioState.currentTime - 10))}
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            onClick={audioState.isPlaying ? onPause : onPlay}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700"
          >
            {audioState.isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-1" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onSeek(Math.min(audioState.duration, audioState.currentTime + 10))}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-gray-600" />
          <Slider
            value={[audioState.volume * 100]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-8">
            {Math.round(audioState.volume * 100)}%
          </span>
        </div>
      </div>
    </Card>
  );
};