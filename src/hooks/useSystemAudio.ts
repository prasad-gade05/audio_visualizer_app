import { useRef, useCallback, useState, useEffect } from "react";
import { AudioData } from "@/types/audio";

interface MediaTrackConstraints {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

interface DisplayMediaStreamConstraints {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

export const useSystemAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  const [isCapturing, setIsCapturing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string>("");

  const [audioData, setAudioData] = useState<AudioData>({
    frequencyData: new Uint8Array(0),
    timeData: new Uint8Array(0),
    sampleRate: 44100,
    duration: 0,
    currentTime: 0,
  });

  // Check if system audio capture is supported
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Check if getDisplayMedia with audio is supported
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          // Try to check if audio capture is supported by checking capabilities
          const isChrome =
            /Chrome/.test(navigator.userAgent) &&
            /Google Inc/.test(navigator.vendor);
          const isEdge = /Edg/.test(navigator.userAgent);

          if (isChrome || isEdge) {
            setIsSupported(true);
          } else {
            setIsSupported(false);
            setError(
              "System audio capture is only supported in Chrome and Edge browsers"
            );
          }
        } else {
          setIsSupported(false);
          setError("getDisplayMedia API not supported in this browser");
        }
      } catch (err) {
        setIsSupported(false);
        setError("System audio capture not available");
      }
    };

    checkSupport();
  }, []);

  const startSystemAudioCapture = useCallback(async () => {
    try {
      setError("");

      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        throw new Error(
          "System audio capture requires a secure context (HTTPS)"
        );
      }

      // Request screen share with audio - try different approaches
      let stream: MediaStream;

      try {
        // First try: Request with explicit audio constraints
        const constraints: DisplayMediaStreamConstraints = {
          video: false,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        };

        stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      } catch (firstError) {
        // Second try: Simple audio request
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: false,
            audio: true,
          });
        } catch (secondError) {
          // Third try: Include video to increase compatibility
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });

          // Stop video track if we got one
          const videoTracks = stream.getVideoTracks();
          videoTracks.forEach((track) => track.stop());
        }
      }

      if (!stream.getAudioTracks().length) {
        throw new Error(
          'No audio track available. Make sure to check "Share system audio" when prompted.'
        );
      }

      console.log(
        "Successfully obtained media stream with audio tracks:",
        stream.getAudioTracks().length
      );
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
      console.log(
        "Created audio context with sample rate:",
        audioContext.sampleRate
      );
      audioContextRef.current = audioContext;

      // Create analyzer
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      analyzer.smoothingTimeConstant = 0.8;
      console.log(
        "Created analyzer with fftSize:",
        analyzer.fftSize,
        "frequencyBinCount:",
        analyzer.frequencyBinCount
      );
      analyzerRef.current = analyzer;

      // Connect stream to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      console.log("Created media stream source");
      sourceRef.current = source;
      source.connect(analyzer);
      console.log("Connected source to analyzer");

      // Wait for audio context to be running
      if (audioContext.state === "suspended") {
        await audioContext.resume();
        console.log("Resumed audio context");
      }

      // Set capturing state first
      setIsCapturing(true);

      // Start visualization after a small delay to ensure everything is connected
      setTimeout(() => {
        console.log("Starting visualization after setup delay");
        if (analyzerRef.current && audioContextRef.current) {
          startVisualization();
        }
      }, 100);

      // Handle stream end
      stream.getAudioTracks()[0].addEventListener("ended", () => {
        stopSystemAudioCapture();
      });
    } catch (error: unknown) {
      console.error("Error accessing system audio:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          setError(
            'Permission denied. Please allow screen sharing and make sure to check "Share system audio".'
          );
        } else if (error.name === "NotFoundError") {
          setError(
            'No audio source found. Make sure to select "Share system audio" in the dialog.'
          );
        } else if (error.name === "NotSupportedError") {
          setError(
            "System audio capture not supported. Please use Chrome or Edge browser and ensure you're on HTTPS."
          );
        } else if (error.name === "AbortError") {
          setError(
            'Screen sharing was cancelled. Please try again and select "Share system audio".'
          );
        } else {
          setError(errorMessage);
        }
      } else {
        setError("Failed to capture system audio");
      }
      setIsCapturing(false);
    }
  }, []);

  const stopSystemAudioCapture = useCallback(() => {
    console.log("Stopping system audio capture");

    // Stop animation first
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      streamRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
      console.log("Disconnected audio source");
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      console.log("Closed audio context");
    }

    analyzerRef.current = null;
    setIsCapturing(false);
    setError("");
  }, []);

  const startVisualization = useCallback(() => {
    console.log("startVisualization called");

    if (!analyzerRef.current) {
      console.error("No analyzer available for visualization");
      return;
    }

    if (!audioContextRef.current) {
      console.error("No audio context available for visualization");
      return;
    }

    const analyzer = analyzerRef.current;
    const audioContext = audioContextRef.current;
    const bufferLength = analyzer.frequencyBinCount;

    console.log("Starting system audio visualization with:", {
      bufferLength,
      sampleRate: audioContext.sampleRate,
      state: audioContext.state,
    });

    // Use a flag to control the animation loop instead of React state
    let shouldContinue = true;

    const updateData = () => {
      // Check if we should continue and if components are still available
      if (
        !shouldContinue ||
        !analyzer ||
        !audioContextRef.current ||
        !streamRef.current
      ) {
        console.log(
          "Stopping visualization - shouldContinue:",
          shouldContinue,
          "analyzer:",
          !!analyzer,
          "audioContext:",
          !!audioContextRef.current,
          "stream:",
          !!streamRef.current
        );
        return;
      }

      // Create new arrays for each frame to avoid reference issues
      const frequencyData = new Uint8Array(bufferLength);
      const timeData = new Uint8Array(bufferLength);

      analyzer.getByteFrequencyData(frequencyData);
      analyzer.getByteTimeDomainData(timeData);

      // Debug: Check if we're getting actual data (reduce logging frequency)
      const freqSum = frequencyData.reduce((sum, val) => sum + val, 0);
      const timeSum = timeData.reduce((sum, val) => sum + val, 0);
      const maxFreq = Math.max(...frequencyData);

      // Only log when we have significant data or every 60 frames (once per second at 60fps)
      if (freqSum > 100 || Math.random() < 0.016) {
        console.log("Audio data frame:", {
          freqSum,
          timeSum,
          maxFreq,
          bufferLength,
          contextState: audioContextRef.current?.state,
        });
      }

      setAudioData({
        frequencyData,
        timeData,
        sampleRate: audioContextRef.current?.sampleRate || 44100,
        duration: 0,
        currentTime: 0,
      });

      animationRef.current = requestAnimationFrame(updateData);
    };

    // Store the stop function to be called later
    animationRef.current = requestAnimationFrame(updateData);

    // Return a cleanup function
    return () => {
      shouldContinue = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      stopSystemAudioCapture();
    };
  }, [stopSystemAudioCapture]);

  return {
    audioData,
    isCapturing,
    isSupported,
    error,
    startSystemAudioCapture,
    stopSystemAudioCapture,
  };
};
