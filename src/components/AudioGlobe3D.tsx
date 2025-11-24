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
    const aspectRatio = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(
      60,
      aspectRatio,
      0.1,
      1000
    );
    
    // Adjust camera distance based on aspect ratio
    // For narrow containers (width < height), move camera further back
    const baseDistance = 2.2;
    const aspectAdjustment = aspectRatio < 1 ? (1 / aspectRatio) * 0.3 : 0;
    camera.position.z = baseDistance + aspectAdjustment;
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
    renderer.setClearColor(new THREE.Color("#0a0a0a"), 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Resize observer to handle container size changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          // Update camera aspect ratio
          const newAspectRatio = width / height;
          camera.aspect = newAspectRatio;
          
          // Adjust camera distance based on aspect ratio
          // For narrow containers (width < height), move camera further back
          const baseDistance = 2.2;
          const aspectAdjustment = newAspectRatio < 1 ? (1 / newAspectRatio) * 0.3 : 0;
          camera.position.z = baseDistance + aspectAdjustment;
          
          camera.updateProjectionMatrix();
          
          // Update renderer size
          renderer.setSize(width, height);
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);

    // Particles Setup - Reduced count
    const particleCount = 1500; // Reduced from 3000
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color("#06B6D4"); // Primary cyan
    
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

      // Initial colors - distribute across color spectrum
      const colorVariant = i % 6;
      let color;
      switch(colorVariant) {
        case 0: color = new THREE.Color("#06B6D4"); break; // Cyan
        case 1: color = new THREE.Color("#10B981"); break; // Emerald
        case 2: color = new THREE.Color("#F59E0B"); break; // Amber
        case 3: color = new THREE.Color("#FB7185"); break; // Coral
        case 4: color = new THREE.Color("#EC4899"); break; // Pink
        default: color = new THREE.Color("#8B5CF6"); break; // Violet
      }
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
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
      color: "#1e293b",
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphere);

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
        
        // Reset to diverse base colors
        const colorVariant = i % 6;
        switch(colorVariant) {
          case 0: // Cyan
            colors[ix3] = 0.024; colors[ix3 + 1] = 0.714; colors[ix3 + 2] = 0.831;
            break;
          case 1: // Emerald
            colors[ix3] = 0.063; colors[ix3 + 1] = 0.725; colors[ix3 + 2] = 0.506;
            break;
          case 2: // Amber
            colors[ix3] = 0.961; colors[ix3 + 1] = 0.620; colors[ix3 + 2] = 0.043;
            break;
          case 3: // Coral
            colors[ix3] = 0.984; colors[ix3 + 1] = 0.443; colors[ix3 + 2] = 0.522;
            break;
          case 4: // Pink
            colors[ix3] = 0.925; colors[ix3 + 1] = 0.282; colors[ix3 + 2] = 0.600;
            break;
          default: // Violet
            colors[ix3] = 0.545; colors[ix3 + 1] = 0.361; colors[ix3 + 2] = 0.965;
            break;
        }
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

          // Color logic with diverse spectrum
          const intensity = freqValue;
          const colorVariant = i % 6;
          
          switch(colorVariant) {
            case 0: // Cyan - brighten with intensity
              colors[ix3] = 0.024 + (intensity * 0.5);
              colors[ix3 + 1] = 0.714 + (intensity * 0.286);
              colors[ix3 + 2] = 0.831 + (intensity * 0.169);
              break;
            case 1: // Emerald - brighten with intensity
              colors[ix3] = 0.063 + (intensity * 0.4);
              colors[ix3 + 1] = 0.725 + (intensity * 0.275);
              colors[ix3 + 2] = 0.506 + (intensity * 0.3);
              break;
            case 2: // Amber - brighten with intensity
              colors[ix3] = 0.961 + (intensity * 0.039);
              colors[ix3 + 1] = 0.620 + (intensity * 0.38);
              colors[ix3 + 2] = 0.043 + (intensity * 0.3);
              break;
            case 3: // Coral - brighten with intensity
              colors[ix3] = 0.984 + (intensity * 0.016);
              colors[ix3 + 1] = 0.443 + (intensity * 0.557);
              colors[ix3 + 2] = 0.522 + (intensity * 0.478);
              break;
            case 4: // Pink - brighten with intensity
              colors[ix3] = 0.925 + (intensity * 0.075);
              colors[ix3 + 1] = 0.282 + (intensity * 0.5);
              colors[ix3 + 2] = 0.600 + (intensity * 0.4);
              break;
            default: // Violet - brighten with intensity
              colors[ix3] = 0.545 + (intensity * 0.455);
              colors[ix3 + 1] = 0.361 + (intensity * 0.4);
              colors[ix3 + 2] = 0.965 + (intensity * 0.035);
              break;
          }
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
      style={{ backgroundColor: "#0a0a0a" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
    </div>
  );
};
