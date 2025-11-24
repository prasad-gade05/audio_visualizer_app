import { useEffect, useRef } from "react";
import * as THREE from "three";
import { AudioData } from "@/types/audio";

interface AudioDisc3DProps {
  audioData: AudioData;
  isPlaying: boolean;
}

export const AudioDisc3D = ({ audioData, isPlaying }: AudioDisc3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const discLinesRef = useRef<THREE.Line[]>([]);
  const frameIdRef = useRef<number | null>(null);
  
  const audioDataRef = useRef(audioData);
  
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });

  useEffect(() => {
    audioDataRef.current = audioData;
  }, [audioData]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const aspectRatio = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);
    
    // Adjust initial camera position based on aspect ratio
    const baseZDistance = 3.5;
    const baseCameraY = 2.5;
    
    if (aspectRatio < 0.8) {
      // Tall/narrow container - move back and adjust view
      camera.position.set(0, baseCameraY * (1 / aspectRatio) * 0.5, baseZDistance * (1 / aspectRatio) * 0.5);
    } else if (aspectRatio > 1.5) {
      // Wide container - can stay closer
      camera.position.set(0, baseCameraY, baseZDistance * 0.9);
    } else {
      // Standard aspect ratio
      camera.position.set(0, baseCameraY, baseZDistance);
    }
    
    camera.lookAt(0, 1.2, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color("#0a0a0a"), 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Configuration
    const numRadialLines = 128;
    const pointsPerLine = 40;
    const innerRadius = 0.3;
    const outerRadius = 2.0;
    const yOffset = 1.2; // Offset to move disc up along Y-axis (raised significantly)

    // Create radial lines
    const lines: THREE.Line[] = [];
    
    // App color palette: coral red, yellow, cyan, teal
    const colorPalette = [
      new THREE.Color('#FB7185'), // coral red
      new THREE.Color('#F59E0B'), // yellow/orange
      new THREE.Color('#FBBF24'), // yellow
      new THREE.Color('#06B6D4'), // cyan
      new THREE.Color('#14B8A6'), // teal
      new THREE.Color('#10B981'), // emerald/teal
      new THREE.Color('#EC4899'), // pink
      new THREE.Color('#F472B6'), // light pink
    ];
    
    for (let i = 0; i < numRadialLines; i++) {
      const angle = (i / numRadialLines) * Math.PI * 2;
      
      // Map to color palette with smooth transitions
      const colorIndex = (i / numRadialLines) * colorPalette.length;
      const colorIndexFloor = Math.floor(colorIndex) % colorPalette.length;
      const colorIndexCeil = Math.ceil(colorIndex) % colorPalette.length;
      const t = colorIndex - Math.floor(colorIndex);
      
      // Interpolate between colors
      const color = new THREE.Color();
      color.lerpColors(colorPalette[colorIndexFloor], colorPalette[colorIndexCeil], t);
      
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(pointsPerLine * 3);
      
      // Initialize positions along the radial line
      for (let j = 0; j < pointsPerLine; j++) {
        const t = j / (pointsPerLine - 1);
        const radius = innerRadius + (outerRadius - innerRadius) * t;
        
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = yOffset; // Apply Y offset to raise the disc
        
        positions[j * 3] = x;
        positions[j * 3 + 1] = y;
        positions[j * 3 + 2] = z;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.LineBasicMaterial({ 
        color: color,
        linewidth: 1
      });
      
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      lines.push(line);
    }
    
    discLinesRef.current = lines;

    // Mouse interaction handlers
    const handleMouseDown = (event: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = event.clientX - previousMousePosition.current.x;
      const deltaY = event.clientY - previousMousePosition.current.y;

      rotationVelocity.current = {
        x: deltaY * 0.005,
        y: deltaX * 0.005
      };

      previousMousePosition.current = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseLeave);

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const newAspectRatio = width / height;
          camera.aspect = newAspectRatio;
          
          // Adjust camera distance based on aspect ratio
          // For narrow/tall containers, move camera further back
          // For wide containers, can stay closer
          const baseZDistance = 3.5;
          const baseCameraY = 2.5;
          
          if (newAspectRatio < 0.8) {
            // Tall/narrow container - move back and adjust view
            camera.position.z = baseZDistance * (1 / newAspectRatio) * 0.5;
            camera.position.y = baseCameraY * (1 / newAspectRatio) * 0.5;
          } else if (newAspectRatio > 1.5) {
            // Wide container - can stay closer
            camera.position.z = baseZDistance * 0.9;
            camera.position.y = baseCameraY;
          } else {
            // Standard aspect ratio
            camera.position.z = baseZDistance;
            camera.position.y = baseCameraY;
          }
          
          camera.lookAt(0, 1.2, 0);
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      // Update disc geometry based on audio data
      const frequencyData = audioDataRef.current.frequencyData;
      
      lines.forEach((line, lineIndex) => {
        const geometry = line.geometry;
        const positions = geometry.attributes.position.array as Float32Array;
        const angle = (lineIndex / numRadialLines) * Math.PI * 2;
        
        for (let j = 0; j < pointsPerLine; j++) {
          const t = j / (pointsPerLine - 1);
          const radius = innerRadius + (outerRadius - innerRadius) * t;
          
          // Map point position to frequency data
          const freqIndex = Math.floor((j / pointsPerLine) * frequencyData.length);
          const amplitude = frequencyData[freqIndex] / 255.0;
          
          // Create wave shape: higher amplitude in the middle
          const distanceFromCenter = Math.abs(t - 0.5) * 2; // 0 at center, 1 at edges
          const heightMultiplier = 1.0 - Math.pow(distanceFromCenter, 1.5);
          const height = amplitude * heightMultiplier * 1.5;
          
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          positions[j * 3] = x;
          positions[j * 3 + 1] = yOffset + height; // Apply Y offset to maintain raised position
          positions[j * 3 + 2] = z;
        }
        
        geometry.attributes.position.needsUpdate = true;
      });

      // Apply rotation
      if (!isDragging.current) {
        rotationVelocity.current.x *= 0.95;
        rotationVelocity.current.y *= 0.95;
      }

      scene.rotation.x += rotationVelocity.current.x;
      scene.rotation.y += rotationVelocity.current.y;

      // Auto-rotate slowly when not interacting
      if (Math.abs(rotationVelocity.current.x) < 0.001 && 
          Math.abs(rotationVelocity.current.y) < 0.001) {
        scene.rotation.y += 0.002;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mouseleave', handleMouseLeave);
      
      resizeObserver.disconnect();
      
      lines.forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{
        minHeight: '300px',
        background: '#0a0a0a',
        touchAction: 'none'
      }}
    >
      {/* Top left corner legends */}
      <div className="absolute top-2 left-2 text-[9px] text-cyan-400/70 font-mono space-y-0.5 pointer-events-none select-none">
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></div>
          <span>FREQ RINGS</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-pink-400"></div>
          <span>AMPLITUDE</span>
        </div>
      </div>
      
      {/* Top right corner legends */}
      <div className="absolute top-2 right-2 text-[9px] text-emerald-400/70 font-mono text-right space-y-0.5 pointer-events-none select-none">
        <div className="flex items-center justify-end gap-1">
          <span>3D SPECTRUM</span>
          <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
