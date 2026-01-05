import { useRef, useCallback, useState, useEffect } from 'react';
import { AudioData, AudioState } from '@/types/audio';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export const useAudioAnalyzer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number>();
  const dataBuffersRef = useRef<{ frequency: Uint8Array; time: Uint8Array } | null>(null);

  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isLoaded: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
  });

  const [audioData, setAudioData] = useState<AudioData>({
    frequencyData: new Uint8Array(0),
    timeData: new Uint8Array(0),
    sampleRate: 44100,
    duration: 0,
    currentTime: 0,
  });

  const initializeAudio = useCallback(async (file: File) => {
    try {
      // Create audio element
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;
      audioRef.current = audio;

      // Create audio context
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      // Create analyzer with optimized settings
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 1024; // Reduced from 2048 for better performance
      analyzer.smoothingTimeConstant = 0.7; // Reduced for more responsive data
      analyzerRef.current = analyzer;
      
      // Pre-allocate buffers for reuse
      const bufferLength = analyzer.frequencyBinCount;
      dataBuffersRef.current = {
        frequency: new Uint8Array(bufferLength),
        time: new Uint8Array(bufferLength)
      };

      // Connect audio to analyzer
      const source = audioContext.createMediaElementSource(audio);
      sourceRef.current = source;
      source.connect(analyzer);
      analyzer.connect(audioContext.destination);

      // Set up audio event listeners
      audio.addEventListener('loadedmetadata', () => {
        setAudioState(prev => ({
          ...prev,
          isLoaded: true,
          duration: audio.duration,
        }));
      });

      audio.addEventListener('timeupdate', () => {
        setAudioState(prev => ({
          ...prev,
          currentTime: audio.currentTime,
        }));
      });

      audio.addEventListener('ended', () => {
        setAudioState(prev => ({
          ...prev,
          isPlaying: false,
        }));
      });

      await audio.load();
    } catch (error) {
      throw new Error('Failed to initialize audio: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, []);

  const startVisualization = useCallback(() => {
    if (!analyzerRef.current || !dataBuffersRef.current) return;

    const analyzer = analyzerRef.current;
    const buffers = dataBuffersRef.current;

    const updateData = () => {
      // Reuse existing buffers instead of creating new ones
      analyzer.getByteFrequencyData(buffers.frequency);
      analyzer.getByteTimeDomainData(buffers.time);

      // Update state with references to reused buffers
      setAudioData({
        frequencyData: buffers.frequency,
        timeData: buffers.time,
        sampleRate: audioContextRef.current?.sampleRate || 44100,
        duration: audioRef.current?.duration || 0,
        currentTime: audioRef.current?.currentTime || 0,
      });

      animationRef.current = requestAnimationFrame(updateData);
    };

    updateData();
  }, []);

  const stopVisualization = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const play = useCallback(async () => {
    if (!audioRef.current || !audioContextRef.current) return;

    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      await audioRef.current.play();
      setAudioState(prev => ({ ...prev, isPlaying: true }));
      startVisualization();
    } catch (error) {
      throw new Error('Failed to play audio: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [startVisualization]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setAudioState(prev => ({ ...prev, isPlaying: false }));
    stopVisualization();
  }, [stopVisualization]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = time;
    setAudioState(prev => ({ ...prev, currentTime: time }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;

    audioRef.current.volume = volume;
    setAudioState(prev => ({ ...prev, volume }));
  }, []);

  useEffect(() => {
    return () => {
      stopVisualization();
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, [stopVisualization]);

  return {
    audioState,
    audioData,
    initializeAudio,
    play,
    pause,
    seek,
    setVolume,
  };
};