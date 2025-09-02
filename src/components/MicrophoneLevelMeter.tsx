import { useEffect, useRef } from "react";

interface MicrophoneLevelMeterProps {
  level: number; // 0 to 1
  isActive: boolean;
  className?: string;
}

export const MicrophoneLevelMeter = ({ 
  level, 
  isActive, 
  className = "" 
}: MicrophoneLevelMeterProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Draw inactive state - dim bars
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        for (let i = 0; i < 20; i++) {
          const barWidth = (width - 19 * 2) / 20;
          const x = i * (barWidth + 2);
          const barHeight = 4;
          const y = (height - barHeight) / 2;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
        return;
      }

      // Calculate number of active bars based on level
      const totalBars = 20;
      const activeBars = Math.floor(level * totalBars);
      
      // Draw level bars with gradient colors
      for (let i = 0; i < totalBars; i++) {
        const barWidth = (width - (totalBars - 1) * 2) / totalBars;
        const x = i * (barWidth + 2);
        const isActive = i < activeBars;
        
        // Color gradient from green to yellow to red
        let color;
        const ratio = i / (totalBars - 1);
        if (ratio < 0.5) {
          // Green to yellow
          const localRatio = ratio * 2;
          color = `rgb(${Math.floor(255 * localRatio)}, 255, 0)`;
        } else {
          // Yellow to red
          const localRatio = (ratio - 0.5) * 2;
          color = `rgb(255, ${Math.floor(255 * (1 - localRatio))}, 0)`;
        }

        // Apply opacity based on whether bar is active
        ctx.fillStyle = isActive ? color : "rgba(255, 255, 255, 0.1)";
        
        // Bar height varies slightly for visual interest
        const baseHeight = 12;
        const variableHeight = isActive ? baseHeight + Math.sin(Date.now() * 0.01 + i) * 2 : 4;
        const barHeight = Math.max(4, variableHeight);
        const y = (height - barHeight) / 2;
        
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      // Add glow effect for active state
      if (activeBars > 0) {
        ctx.shadowColor = level > 0.8 ? "#ff0000" : level > 0.5 ? "#ffff00" : "#00ff00";
        ctx.shadowBlur = 10;
        ctx.globalCompositeOperation = "screen";
        
        // Redraw active bars with glow
        for (let i = 0; i < activeBars; i++) {
          const barWidth = (width - (totalBars - 1) * 2) / totalBars;
          const x = i * (barWidth + 2);
          
          const ratio = i / (totalBars - 1);
          let color;
          if (ratio < 0.5) {
            const localRatio = ratio * 2;
            color = `rgb(${Math.floor(255 * localRatio)}, 255, 0)`;
          } else {
            const localRatio = (ratio - 0.5) * 2;
            color = `rgb(255, ${Math.floor(255 * (1 - localRatio))}, 0)`;
          }
          
          ctx.fillStyle = color;
          const baseHeight = 12;
          const variableHeight = baseHeight + Math.sin(Date.now() * 0.01 + i) * 2;
          const barHeight = Math.max(4, variableHeight);
          const y = (height - barHeight) / 2;
          
          ctx.fillRect(x, y, barWidth, barHeight);
        }
        
        // Reset composite operation and shadow
        ctx.globalCompositeOperation = "source-over";
        ctx.shadowBlur = 0;
      }
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [level, isActive]);

  // Set canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-8 rounded-md"
        style={{
          background: "rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      />
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
        <span
          className="text-xs font-medium"
          style={{
            color: level > 0.8 ? "#ff0000" : level > 0.5 ? "#ffff00" : "var(--color-text-secondary)",
            textShadow: level > 0.5 ? "0 0 4px currentColor" : "none",
          }}
        >
          {isActive ? `${Math.round(level * 100)}%` : "---"}
        </span>
      </div>
    </div>
  );
};