import { useEffect, useRef } from 'react';

export const StaticBackgroundVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Lightweight particles configuration
    const particleCount = 60;
    const bars = 40;
    const waves = 2;

    // Create particles with diverse colors
    const particles = Array.from({ length: particleCount }, (_, i) => {
      const colorVariant = i % 6;
      let hue;
      switch(colorVariant) {
        case 0: hue = 187; break; // Cyan
        case 1: hue = 158; break; // Emerald
        case 2: hue = 38; break;  // Amber
        case 3: hue = 351; break; // Coral
        case 4: hue = 330; break; // Pink
        default: hue = 258; break; // Violet
      }
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        hue,
      };
    });

    // Create frequency bars
    const barData = Array.from({ length: bars }, (_, i) => ({
      index: i,
      height: Math.random(),
      speed: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2,
    }));

    // Wave data
    const waveData = Array.from({ length: waves }, (_, i) => ({
      offset: 0,
      speed: 0.015 + i * 0.005,
      amplitude: 30 + i * 20,
      frequency: 0.01 + i * 0.005,
    }));

    let time = 0;

    const animate = () => {
      time += 0.016;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Pulse effect
        const pulse = Math.sin(time * 2 + particle.hue) * 0.5 + 0.5;
        const alpha = 0.3 + pulse * 0.3;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${alpha})`;
        ctx.fill();
      });

      // Draw frequency bars
      const barWidth = canvas.width / bars;
      barData.forEach((bar) => {
        // Animate height with sine wave
        bar.height = Math.sin(time + bar.phase) * 0.4 + 0.5;

        const x = bar.index * barWidth;
        const height = bar.height * canvas.height * 0.4;
        const y = canvas.height - height;

        // Gradient for bars with diverse colors
        const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
        const colorVariant = bar.index % 6;
        let hue;
        switch(colorVariant) {
          case 0: hue = 187; break; // Cyan
          case 1: hue = 158; break; // Emerald
          case 2: hue = 38; break;  // Amber
          case 3: hue = 351; break; // Coral
          case 4: hue = 330; break; // Pink
          default: hue = 258; break; // Violet
        }
        gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.2)`);
        gradient.addColorStop(1, `hsla(${hue}, 70%, 60%, 0.05)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, height);
      });

      // Draw waves
      waveData.forEach((wave) => {
        wave.offset += wave.speed;

        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);

        for (let x = 0; x < canvas.width; x += 5) {
          const y =
            canvas.height / 2 +
            Math.sin(x * wave.frequency + wave.offset) * wave.amplitude;
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `hsla(180, 70%, 60%, 0.15)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw circular visualizer
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.15;

      ctx.beginPath();
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2;
        const barHeight = barData[i].height * radius * 0.5;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.strokeStyle = `hsla(200, 70%, 60%, 0.2)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        filter: 'blur(8px)',
        opacity: 0.4,
        zIndex: 0,
      }}
    />
  );
};
