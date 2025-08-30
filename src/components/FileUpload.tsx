import { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Music } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoaded: boolean;
}

export const FileUpload = ({ onFileSelect, isLoaded }: FileUploadProps) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      onFileSelect(file);
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  }, [onFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const triggerFileInput = useCallback(() => {
    const input = document.getElementById('audio-upload') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }, []);

  if (isLoaded) {
    return (
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="flex items-center gap-3">
          <Music className="w-6 h-6 text-blue-600" />
          <span className="text-blue-800 font-medium">Audio file loaded successfully</span>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            className="ml-auto"
          >
            Change File
          </Button>
        </div>
        <input
          id="audio-upload"
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </Card>
    );
  }

  return (
    <Card 
      className="p-8 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={triggerFileInput}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Upload Audio File</h3>
          <p className="text-gray-600 mt-1">
            Drag and drop an audio file here, or click to browse
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supports MP3, WAV, OGG, M4A formats
          </p>
        </div>
        <Button variant="outline" className="mt-2">
          Choose File
        </Button>
      </div>
      <input
        id="audio-upload"
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </Card>
  );
};