import { useEffect, useRef, useState } from "react";
import { AudioData } from "@/types/audio";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  size: number;
  baseSize: number;
  opacity: number;
  baseOpacity: number;
  color: { r: number; g: number; b: number };
  sparkleTime: number;
}

interface CosmicParticleFieldProps {
  audioData: AudioData;
  isPlaying: boolean;
  className?: string;
}

export const CosmicParticleField = ({
  audioData,
  isPlaying,
  className = "",
}: CosmicParticleFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isOver: false });
  const timeRef = useRef(0);
  const [particleCount] = useState(400);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Audio analysis variables
  const bassRef = useRef(0);
  const midRef = useRef(0);
  const trebleRef = useRef(0);
  const overallVolumeRef = useRef(0);
  const lastBassHitRef = useRef(0);

  // Perlin noise implementation for fluid motion
  const noise = (x: number, y: number, time: number): number => {
    // Simple pseudo-random noise function
    const seed = Math.sin(x * 12.9898 + y * 78.233 + time * 0.001) * 43758.5453;
    return (seed - Math.floor(seed)) * 2 - 1;
  };

  const createParticle = (x: number, y: number): Particle => {
    const baseSize = Math.random() * 3 + 1;
    const baseOpacity = Math.random() * 0.6 + 0.4;

    // Color based on position for flowing rivers of color
    const colorPhase =
      (x / dimensions.width + y / dimensions.height) * Math.PI * 2;
    const r = Math.sin(colorPhase) * 127 + 128; // Purple to magenta
    const g = Math.sin(colorPhase + Math.PI * 0.5) * 100 + 50; // Varying intensity
    const b = Math.sin(colorPhase + Math.PI) * 127 + 128; // Cyan to blue

    return {
      x,
      y,
      vx: 0, // Start with no velocity - only audio will move particles
      vy: 0, // Start with no velocity - only audio will move particles
      baseX: x,
      baseY: y,
      size: baseSize,
      baseSize,
      opacity: baseOpacity * 0.3, // Start dimmed, audio will brighten them
      baseOpacity,
      color: {
        r: Math.floor(r * 0.5),
        g: Math.floor(g * 0.5),
        b: Math.floor(b * 0.5),
      }, // Start dimmed
      sparkleTime: 0,
    };
  };

  const initializeParticles = () => {
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * dimensions.width;
      const y = Math.random() * dimensions.height;
      particles.push(createParticle(x, y));
    }
    particlesRef.current = particles;
  };

  const analyzeAudioData = (
    frequencyData: Uint8Array,
    timeData: Uint8Array
  ) => {
    if (!frequencyData || frequencyData.length === 0) return;

    // Analyze frequency bands
    const bassRange = frequencyData.slice(0, 32);
    const midRange = frequencyData.slice(32, 96);
    const trebleRange = frequencyData.slice(96, 160);

    bassRef.current =
      bassRange.reduce((sum, val) => sum + val, 0) / bassRange.length / 255;
    midRef.current =
      midRange.reduce((sum, val) => sum + val, 0) / midRange.length / 255;
    trebleRef.current =
      trebleRange.reduce((sum, val) => sum + val, 0) / trebleRange.length / 255;

    // Overall volume from time domain
    const avgAmplitude =
      timeData.reduce((sum, val) => sum + Math.abs(val - 128), 0) /
      timeData.length;
    overallVolumeRef.current = avgAmplitude / 128;

    // Detect bass hits
    if (bassRef.current > 0.6 && Date.now() - lastBassHitRef.current > 100) {
      lastBassHitRef.current = Date.now();
    }
  };

  const updateParticles = (deltaTime: number) => {
    const particles = particlesRef.current;
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const mouse = mouseRef.current;

    // Only proceed if we have audio data
    if (!audioData.frequencyData || audioData.frequencyData.length === 0) {
      return;
    }

    particles.forEach((particle, index) => {
      // Reset velocities - no native movement
      particle.vx = 0;
      particle.vy = 0;

      // Bass shockwave effect - ONLY when bass is detected
      const timeSinceLastBass = Date.now() - lastBassHitRef.current;
      if (timeSinceLastBass < 500 && bassRef.current > 0.3) {
        const shockwaveStrength =
          bassRef.current * (1 - timeSinceLastBass / 500);
        const dx = particle.x - centerX;
        const dy = particle.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          const force = (shockwaveStrength * 15) / (distance + 1);
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }
      }

      // Mid-frequency flow field - ONLY when mid frequencies are present
      if (midRef.current > 0.1) {
        const noiseScale = 0.005;
        const noiseStrength = midRef.current * 2;
        const noiseX = noise(
          particle.x * noiseScale,
          particle.y * noiseScale,
          timeRef.current
        );
        const noiseY = noise(
          particle.x * noiseScale + 1000,
          particle.y * noiseScale + 1000,
          timeRef.current
        );

        particle.vx += noiseX * noiseStrength * deltaTime * 0.001;
        particle.vy += noiseY * noiseStrength * deltaTime * 0.001;
      }

      // Mouse interaction - ONLY when audio is playing
      if (
        mouse.isOver &&
        (bassRef.current > 0.1 ||
          midRef.current > 0.1 ||
          trebleRef.current > 0.1)
      ) {
        const mouseDistance = Math.sqrt(
          Math.pow(particle.x - mouse.x, 2) + Math.pow(particle.y - mouse.y, 2)
        );
        if (mouseDistance < 150) {
          const pullStrength =
            ((150 - mouseDistance) / 150) * 0.5 * overallVolumeRef.current;
          const dx = mouse.x - particle.x;
          const dy = mouse.y - particle.y;
          particle.vx += dx * pullStrength * deltaTime * 0.001;
          particle.vy += dy * pullStrength * deltaTime * 0.001;
        }
      }

      // Apply velocity ONLY if there's actual movement from audio
      if (Math.abs(particle.vx) > 0.001 || Math.abs(particle.vy) > 0.001) {
        particle.x += particle.vx * deltaTime * 0.1;
        particle.y += particle.vy * deltaTime * 0.1;
      }

      // NO gentle drift back to center - removed native animation
      // NO friction - removed native animation

      // Wrap around edges
      if (particle.x < -50) particle.x = dimensions.width + 50;
      if (particle.x > dimensions.width + 50) particle.x = -50;
      if (particle.y < -50) particle.y = dimensions.height + 50;
      if (particle.y > dimensions.height + 50) particle.y = -50;

      // Treble sparkle effect - ONLY when treble is detected
      if (trebleRef.current > 0.7 && Math.random() < trebleRef.current * 0.05) {
        particle.sparkleTime = 300; // Sparkle for 300ms
      }

      if (particle.sparkleTime > 0) {
        particle.sparkleTime -= deltaTime;
      }

      // Overall volume affects size and brightness - ONLY based on actual audio
      const volumeMultiplier =
        overallVolumeRef.current > 0.05
          ? 0.3 + overallVolumeRef.current * 0.7
          : 0.3;
      particle.size = particle.baseSize * volumeMultiplier;
      particle.opacity = particle.baseOpacity * volumeMultiplier;

      // Color based STRICTLY on audio data - no velocity-based variation
      const bassInfluence = bassRef.current;
      const midInfluence = midRef.current;
      const trebleInfluence = trebleRef.current;

      // Base colors from original position, modulated by audio
      const baseColorPhase =
        (particle.baseX / dimensions.width +
          particle.baseY / dimensions.height) *
        Math.PI *
        2;

      particle.color.r = Math.floor(
        (Math.sin(baseColorPhase) * 127 + 128) * (0.5 + bassInfluence * 0.5)
      ); // Purple base with bass boost
      particle.color.g = Math.floor(
        (Math.sin(baseColorPhase + Math.PI * 0.5) * 100 + 50) *
          (0.5 + midInfluence * 0.5)
      ); // Magenta influence from mids
      particle.color.b = Math.floor(
        (Math.sin(baseColorPhase + Math.PI) * 127 + 128) *
          (0.5 + trebleInfluence * 0.5)
      ); // Cyan influence from treble
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas with black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    const particles = particlesRef.current;

    particles.forEach((particle) => {
      // Calculate final color with sparkle effect
      let r = particle.color.r;
      let g = particle.color.g;
      let b = particle.color.b;

      if (particle.sparkleTime > 0) {
        const sparkleIntensity = particle.sparkleTime / 300;
        r = Math.min(255, r + sparkleIntensity * 100);
        g = Math.min(255, g + sparkleIntensity * 100);
        b = Math.min(255, b + sparkleIntensity * 100);
      }

      // Create radial gradient for glow effect
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.size * 3
      );

      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${particle.opacity})`);
      gradient.addColorStop(
        0.3,
        `rgba(${r}, ${g}, ${b}, ${particle.opacity * 0.6})`
      );
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw core particle
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.opacity})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const animate = (currentTime: number) => {
    if (!isPlaying) {
      // Clear canvas when not playing and keep particles static
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
          // Draw particles in their static positions
          drawParticles(ctx);
        }
      }
      return;
    }

    // Only proceed with animation if we have valid audio data
    if (
      !audioData.frequencyData ||
      audioData.frequencyData.length === 0 ||
      !audioData.timeData ||
      audioData.timeData.length === 0
    ) {
      // Keep particles static but continue loop to wait for audio data
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const deltaTime = currentTime - timeRef.current;
    timeRef.current = currentTime;

    // Analyze audio data
    analyzeAudioData(audioData.frequencyData, audioData.timeData);

    // Only update particles if there's significant audio activity
    const hasAudioActivity =
      bassRef.current > 0.05 ||
      midRef.current > 0.05 ||
      trebleRef.current > 0.05 ||
      overallVolumeRef.current > 0.05;

    if (hasAudioActivity) {
      updateParticles(deltaTime);
    }

    // Always draw particles (but they may be static)
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawParticles(ctx);
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // Mouse interaction handlers
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x =
        (event.clientX - rect.left) * (dimensions.width / rect.width);
      mouseRef.current.y =
        (event.clientY - rect.top) * (dimensions.height / rect.height);
      mouseRef.current.isOver = true;
    }
  };

  const handleMouseLeave = () => {
    mouseRef.current.isOver = false;
  };

  // Initialize and cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Update dimensions based on container size
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const newWidth = Math.max(rect.width, 400);
      const newHeight = Math.max(rect.height, 300);

      setDimensions({ width: newWidth, height: newHeight });

      // Set canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;
    };

    updateDimensions();

    // Add resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    // Initialize particles
    initializeParticles();

    // Start animation when playing
    if (isPlaying) {
      timeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Clear canvas when stopped
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      }
    }

    // Cleanup animation frame on unmount or when isPlaying changes
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      resizeObserver.disconnect();
    };
  }, [isPlaying, dimensions.width, dimensions.height]);

  // Update animation loop when audioData changes
  useEffect(() => {
    if (isPlaying && !animationRef.current) {
      timeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [audioData, isPlaying]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{
          background: "#000000",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};
