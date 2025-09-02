import { useRef, useCallback, useState, useEffect } from "react";
import { AudioData } from "@/types/audio";

export const useMicrophoneAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const [isCapturing, setIsCapturing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string>("");
  const [microphoneLevel, setMicrophoneLevel] = useState<number>(0);
  const [sensitivity, setSensitivity] = useState<number>(1);
  const [noiseGate, setNoiseGate] = useState<number>(0.1);

  const [audioData, setAudioData] = useState<AudioData>({
    frequencyData: new Uint8Array(0),
    timeData: new Uint8Array(0),
    sampleRate: 44100,
    duration: 0,
    currentTime: 0,
  });

  // Check if microphone access is supported
  useEffect(() => {
    const checkSupport = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // Check if we're in a secure context (HTTPS or localhost)
          if (window.isSecureContext) {
            setIsSupported(true);
          } else {
            setIsSupported(false);
            setError("Microphone access requires a secure context (HTTPS)");
          }
        } else {
          setIsSupported(false);
          setError("getUserMedia API not supported in this browser");
        }
      } catch (err) {
        setIsSupported(false);
        setError("Microphone access not available");
      }
    };

    checkSupport();
  }, []);

  const startMicrophoneCapture = useCallback(async () => {
    try {
      setError("");

      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        throw new Error("Microphone access requires a secure context (HTTPS)");
      }

      // Request microphone access
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Create audio context
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("Web Audio API not supported");
      }

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      // Create analyzer
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      analyzer.smoothingTimeConstant = 0.8;
      analyzerRef.current = analyzer;

      // Connect microphone stream to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyzer);

      // Wait for audio context to be running
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // Set capturing state
      setIsCapturing(true);

      // Start visualization and level monitoring
      setTimeout(() => {
        if (analyzerRef.current && audioContextRef.current) {
          startVisualization();
        }
      }, 100);

      // Handle stream end (when user revokes permission or device is disconnected)
      stream.getAudioTracks()[0].addEventListener("ended", () => {
        stopMicrophoneCapture();
      });

    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          setError(
            "Microphone permission denied. Please allow microphone access and try again."
          );
        } else if (error.name === "NotFoundError") {
          setError(
            "No microphone found. Please ensure a microphone is connected and try again."
          );
        } else if (error.name === "NotSupportedError") {
          setError(
            "Microphone access not supported. Please use a modern browser with microphone support."
          );
        } else if (error.name === "AbortError") {
          setError(
            "Microphone access was cancelled. Please try again."
          );
        } else if (error.name === "ConstraintError" || error.name === "OverconstrainedError") {
          setError(
            "Unable to access microphone with the requested settings. Please try again."
          );
        } else {
          setError(errorMessage);
        }
      } else {
        setError("Failed to access microphone");
      }
      setIsCapturing(false);
    }
  }, []);

  const stopMicrophoneCapture = useCallback(() => {
    // Stop animation first
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }

    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Disconnect audio nodes
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Reset analyzer
    analyzerRef.current = null;

    // Reset state
    setIsCapturing(false);
    setMicrophoneLevel(0);
    setAudioData({
      frequencyData: new Uint8Array(0),
      timeData: new Uint8Array(0),
      sampleRate: 44100,
      duration: 0,
      currentTime: 0,
    });
  }, []);

  const startVisualization = useCallback(() => {
    if (!analyzerRef.current) return;

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const updateData = () => {
      if (!analyzer || !isCapturing) return;

      analyzer.getByteFrequencyData(frequencyData);
      analyzer.getByteTimeDomainData(timeData);

      // Calculate current volume level for UI feedback
      let sum = 0;
      for (let i = 0; i < timeData.length; i++) {
        const normalized = (timeData[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / timeData.length);
      const currentLevel = rms * sensitivity;

      // Apply noise gate
      const gatedLevel = currentLevel > noiseGate ? currentLevel : 0;
      setMicrophoneLevel(Math.min(gatedLevel, 1));

      // Apply sensitivity and noise gate to frequency data for visualization
      const processedFrequencyData = new Uint8Array(frequencyData.length);
      for (let i = 0; i < frequencyData.length; i++) {
        const normalizedValue = frequencyData[i] / 255;
        const sensitiveValue = Math.min(normalizedValue * sensitivity, 1);
        const gatedValue = sensitiveValue > noiseGate ? sensitiveValue : 0;
        processedFrequencyData[i] = Math.floor(gatedValue * 255);
      }

      setAudioData(prev => ({
        ...prev,
        frequencyData: processedFrequencyData,
        timeData: new Uint8Array(timeData),
        currentTime: Date.now() / 1000, // Use timestamp for real-time sources
      }));

      animationRef.current = requestAnimationFrame(updateData);
    };

    updateData();
  }, [isCapturing, sensitivity, noiseGate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicrophoneCapture();
    };
  }, [stopMicrophoneCapture]);

  // Restart visualization when sensitivity or noise gate changes
  useEffect(() => {
    if (isCapturing && analyzerRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      startVisualization();
    }
  }, [sensitivity, noiseGate, isCapturing, startVisualization]);

  return {
    audioData,
    isCapturing,
    isSupported,
    error,
    microphoneLevel,
    sensitivity,
    noiseGate,
    startMicrophoneCapture,
    stopMicrophoneCapture,
    setSensitivity,
    setNoiseGate,
  };
};