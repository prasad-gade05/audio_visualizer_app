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

      // Create analyzer
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      analyzer.smoothingTimeConstant = 0.8;
      analyzerRef.current = analyzer;

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
      console.error('Error initializing audio:', error);
    }
  }, []);

  const startVisualization = useCallback(() => {
    if (!analyzerRef.current) return;

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const updateData = () => {
      analyzer.getByteFrequencyData(frequencyData);
      analyzer.getByteTimeDomainData(timeData);

      setAudioData(prev => ({
        ...prev,
        frequencyData: new Uint8Array(frequencyData),
        timeData: new Uint8Array(timeData),
        currentTime: audioRef.current?.currentTime || 0,
      }));

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
      console.error('Error playing audio:', error);
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