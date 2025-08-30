# Audio Visualization Web App - MVP Todo

## Core Features to Implement:
1. Audio file input/upload functionality
2. Real-time audio visualization with Web Audio API
3. Synchronized playback controls (play/pause/seek)
4. Multiple visualization modes (waveform, frequency bars, circular)

## Files to Create/Modify:
1. **src/pages/Index.tsx** - Main audio visualizer page with upload and controls
2. **src/components/AudioVisualizer.tsx** - Core visualization component using Canvas API
3. **src/components/AudioControls.tsx** - Play/pause/seek controls
4. **src/components/FileUpload.tsx** - Audio file upload component
5. **src/hooks/useAudioAnalyzer.ts** - Custom hook for Web Audio API integration
6. **src/types/audio.ts** - TypeScript types for audio data
7. **index.html** - Update title to "Audio Visualizer"

## Technical Implementation:
- Use Web Audio API for real-time frequency analysis
- Canvas API for smooth visualization rendering
- File API for audio file handling
- RequestAnimationFrame for smooth animations
- Multiple visualization modes: bars, waveform, circular spectrum

## Visualization Types:
1. Frequency bars (classic equalizer style)
2. Circular spectrum analyzer
3. Waveform display
4. Particle effects responding to audio

This is an MVP focused on core functionality with clean, modern UI.