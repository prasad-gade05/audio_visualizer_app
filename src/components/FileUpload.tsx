import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Music } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoaded: boolean;
  onContinuePlaying?: () => void;
}

export const FileUpload = ({ onFileSelect, isLoaded, onContinuePlaying }: FileUploadProps) => {
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith("audio/")) {
        onFileSelect(file);
      }
      // Reset the input value to allow selecting the same file again
      event.target.value = "";
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file && file.type.startsWith("audio/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const triggerFileInput = useCallback(() => {
    const input = document.getElementById("audio-upload") as HTMLInputElement;
    if (input) {
      input.click();
    }
  }, []);

  if (isLoaded) {
    return (
      <div className="glass-interactive p-6 space-y-4" style={{ borderColor: 'rgba(167, 139, 250, 0.3)' }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, #a78bfa, #c4b5fd)`,
              boxShadow: '0 0 16px rgba(167, 139, 250, 0.4)'
            }}
          >
            <Music
              className="w-5 h-5"
              style={{ color: "#1a1a2e" }}
            />
          </div>
          <span
            className="font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Audio file loaded successfully
          </span>
        </div>
        
        <div className="flex gap-3">
          {onContinuePlaying && (
            <button
              onClick={onContinuePlaying}
              className="flex-1 glass-interactive px-4 py-2.5 hover:scale-105 smooth-transition font-medium"
              style={{ 
                color: "var(--color-text-primary)",
                background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
              }}
            >
              Continue Playing
            </button>
          )}
          <button
            onClick={triggerFileInput}
            className="flex-1 glass-interactive px-4 py-2.5 hover:scale-105 smooth-transition"
            style={{ color: "var(--color-text-primary)" }}
          >
            Change File
          </button>
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

  return (
    <div
      className="glass-interactive p-12 cursor-pointer group hover:scale-105 smooth-transition"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={triggerFileInput}
      style={{
        borderColor: 'rgba(167, 139, 250, 0.3)',
      }}
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center group-hover:scale-110 smooth-transition"
          style={{
            background: `linear-gradient(135deg, #a78bfa, #c4b5fd)`,
            boxShadow: "0 0 24px rgba(167, 139, 250, 0.5), 0 0 48px rgba(167, 139, 250, 0.2)",
          }}
        >
          <Upload className="w-10 h-10" style={{ color: "#1a1a2e" }} />
        </div>
        <div>
          <h3
            className="text-xl font-semibold mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            Upload Audio File
          </h3>
          <p className="mb-2" style={{ color: "var(--color-text-secondary)" }}>
            Drag and drop an audio file here, or click to browse
          </p>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-disabled)" }}
          >
            Supports MP3, WAV, OGG, M4A formats
          </p>
        </div>
        <button
          className="glass-interactive px-6 py-3 hover:scale-105 smooth-transition"
          style={{ color: "var(--color-text-primary)" }}
        >
          Choose File
        </button>
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
};
