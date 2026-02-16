import { useRef, useCallback, useState, useEffect } from "react";
import { AudioData } from "@/types/audio";

export const useMicrophoneAudio = () => {
  const AUDIO_STATE_UPDATE_INTERVAL_MS = 25;
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const dataBuffersRef = useRef<{
    frequency: Uint8Array;
    time: Uint8Array;
    processedFrequency: Uint8Array;
  } | null>(null);
  const lastStateUpdateRef = useRef(0);
  const isCapturingRef = useRef(false);
  const sensitivityRef = useRef(1);
  const noiseGateRef = useRef(0.1);

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

  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    noiseGateRef.current = noiseGate;
  }, [noiseGate]);

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
      dataBuffersRef.current = {
        frequency: new Uint8Array(analyzer.frequencyBinCount),
        time: new Uint8Array(analyzer.frequencyBinCount),
        processedFrequency: new Uint8Array(analyzer.frequencyBinCount),
      };

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
    dataBuffersRef.current = null;

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
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (!dataBuffersRef.current) {
      dataBuffersRef.current = {
        frequency: new Uint8Array(analyzer.frequencyBinCount),
        time: new Uint8Array(analyzer.frequencyBinCount),
        processedFrequency: new Uint8Array(analyzer.frequencyBinCount),
      };
    }

    const buffers = dataBuffersRef.current;

    const updateData = () => {
      if (!analyzer || !isCapturingRef.current || !streamRef.current) return;

      analyzer.getByteFrequencyData(buffers.frequency);
      analyzer.getByteTimeDomainData(buffers.time);

      // Calculate current volume level for UI feedback
      let sum = 0;
      for (let i = 0; i < buffers.time.length; i++) {
        const normalized = (buffers.time[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / buffers.time.length);
      const currentLevel = rms * sensitivityRef.current;

      // Apply noise gate
      const gatedLevel = currentLevel > noiseGateRef.current ? currentLevel : 0;

      // Apply sensitivity and noise gate to frequency data for visualization
      for (let i = 0; i < buffers.frequency.length; i++) {
        const normalizedValue = buffers.frequency[i] / 255;
        const sensitiveValue = Math.min(normalizedValue * sensitivityRef.current, 1);
        const gatedValue = sensitiveValue > noiseGateRef.current ? sensitiveValue : 0;
        buffers.processedFrequency[i] = Math.floor(gatedValue * 255);
      }

      const now = performance.now();
      if (now - lastStateUpdateRef.current >= AUDIO_STATE_UPDATE_INTERVAL_MS) {
        setMicrophoneLevel(Math.min(gatedLevel, 1));
        setAudioData({
          frequencyData: buffers.processedFrequency,
          timeData: buffers.time,
          sampleRate: audioContextRef.current?.sampleRate || 44100,
          duration: 0,
          currentTime: Date.now() / 1000,
        });
        lastStateUpdateRef.current = now;
      }

      animationRef.current = requestAnimationFrame(updateData);
    };

    updateData();
  }, []);

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
