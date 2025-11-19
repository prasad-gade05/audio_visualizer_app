import { useEffect, useRef } from "react";
import * as THREE from "three";
import { AudioData } from "@/types/audio";

interface AudioGlobe3DProps {
  audioData: AudioData;
  isPlaying: boolean;
}

export const AudioGlobe3D = ({ audioData, isPlaying }: AudioGlobe3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const frameIdRef = useRef<number | null>(null);
  
  // Use a ref for audio data to avoid re-running the effect loop on every update
  const audioDataRef = useRef(audioData);

  // Interaction state
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });

  // Update audio data ref
  useEffect(() => {
    audioDataRef.current = audioData;
  }, [audioData]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2.2; // Slightly closer
    cameraRef.current = camera;

    // Renderer setup - Optimized
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true, // Keep antialias for quality, but we'll lower pixel ratio
      powerPreference: "high-performance"
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    // Limit pixel ratio to 1 for performance on high-DPI screens
    renderer.setPixelRatio(1); 
    // Set background color
    renderer.setClearColor(new THREE.Color("#0d0b14"), 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Particles Setup - Reduced count
    const particleCount = 1500; // Reduced from 3000
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color("#8A42FF"); // Primary
    
    for (let i = 0; i < particleCount; i++) {
      // Spherical distribution
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;

      const r = 1.0;
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;

      // Initial colors
      colors[i * 3] = color1.r;
      colors[i * 3 + 1] = color1.g;
      colors[i * 3 + 2] = color1.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    
    // Optimized Material - Standard PointsMaterial
    const material = new THREE.PointsMaterial({
      size: 0.015,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    globeGroup.add(particles);
    particlesRef.current = particles;

    // Simplified Atmosphere
    const atmosphereGeo = new THREE.SphereGeometry(0.85, 24, 24); // Lower polygon count
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: "#2a0a4a",
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphere);

    // Handle Resize with ResizeObserver
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(containerRef.current);

    // Store base positions
    particles.userData = { basePositions };

    return () => {
      resizeObserver.disconnect();
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      geometry.dispose();
      material.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
    };
  }, []);

  // Animation Loop
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current || !particlesRef.current || !globeGroupRef.current) return;

    const particles = particlesRef.current;
    const positions = particles.geometry.attributes.position.array as Float32Array;
    const colors = particles.geometry.attributes.color.array as Float32Array;
    const basePositions = particles.userData.basePositions as Float32Array;
    const count = particles.geometry.attributes.position.count;

    // Reset function
    const resetParticles = () => {
      for (let i = 0; i < count; i++) {
        const ix3 = i * 3;
        positions[ix3] = basePositions[ix3];
        positions[ix3 + 1] = basePositions[ix3 + 1];
        positions[ix3 + 2] = basePositions[ix3 + 2];
        
        colors[ix3] = 0.54; // Base purple R
        colors[ix3 + 1] = 0.26; // Base purple G
        colors[ix3 + 2] = 1.0; // Base purple B
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.geometry.attributes.color.needsUpdate = true;
      rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
    };

    if (!isPlaying) {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      resetParticles();
      return;
    }

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      const currentAudioData = audioDataRef.current;
      
      // Audio Reactivity
      let bass = 0;

      if (currentAudioData.frequencyData.length > 0) {
        const data = currentAudioData.frequencyData;
        const bufferLength = data.length;
        
        // Calculate bass for global pulse
        const bassRange = data.slice(0, Math.floor(bufferLength * 0.1));
        bass = bassRange.reduce((a, b) => a + b, 0) / bassRange.length / 255;

        // Update particles
        for (let i = 0; i < count; i++) {
          const ix3 = i * 3;
          const bx = basePositions[ix3];
          const by = basePositions[ix3 + 1];
          const bz = basePositions[ix3 + 2];

          // Map particle index to frequency bin
          const freqIndex = Math.floor((i / count) * bufferLength);
          const freqValue = data[freqIndex] / 255;

          // Subtle Displacement Logic
          // Reduced multipliers for subtlety
          const displacement = 1.0 + (bass * 0.05) + (freqValue * 0.15);
          
          positions[ix3] = bx * displacement;
          positions[ix3 + 1] = by * displacement;
          positions[ix3 + 2] = bz * displacement;

          // Color logic
          const intensity = freqValue;
          // Smoother gradient
          colors[ix3] = 0.54 + (intensity * 0.3);     
          colors[ix3 + 1] = 0.26 + (intensity * 0.6); 
          colors[ix3 + 2] = 1.0 - (intensity * 0.2);   
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
      particles.geometry.attributes.color.needsUpdate = true;

      // Rotation Logic
      if (!isDragging.current) {
        // Slower auto rotation - reduced base speed and audio reactivity
        const autoSpeed = 0.0003 + (bass * 0.002); 
        globeGroupRef.current!.rotation.y += autoSpeed;
        
        // Decay manual rotation momentum
        rotationVelocity.current.x *= 0.95;
        rotationVelocity.current.y *= 0.95;
        
        if (Math.abs(rotationVelocity.current.x) > 0.0001 || Math.abs(rotationVelocity.current.y) > 0.0001) {
            globeGroupRef.current!.rotation.y += rotationVelocity.current.x;
            globeGroupRef.current!.rotation.x += rotationVelocity.current.y;
        }
      }

      rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
    };

    animate();

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [isPlaying]); // Only re-run when play state changes, not audio data

  // Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current && globeGroupRef.current) {
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      const rotateSpeed = 0.005;
      
      globeGroupRef.current.rotation.y += deltaX * rotateSpeed;
      globeGroupRef.current.rotation.x += deltaY * rotateSpeed;

      rotationVelocity.current = {
        x: deltaX * rotateSpeed,
        y: deltaY * rotateSpeed
      };

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative cursor-move"
      style={{ backgroundColor: "#0d0b14" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute bottom-2 left-2 text-xs text-white/50 pointer-events-none select-none">
        Drag to rotate • Reacts to audio
      </div>
    </div>
  );
};
