import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AudioData } from "@/types/audio";

interface AudioGlobe3DProps {
  audioData: AudioData;
  isPlaying: boolean;
}

export const AudioGlobe3D = ({ audioData, isPlaying }: AudioGlobe3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const atmosphereRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);

  // Interaction state
  const [isInteracting, setIsInteracting] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const autoRotationRef = useRef(0);
  const scaleRef = useRef(1);

  // Audio processing - mimic the 2D visualizations approach
  const processAudioData = () => {
    if (!audioData.frequencyData.length || !isPlaying) {
      return {
        bass: 0,
        mid: 0,
        treble: 0,
        overall: 0,
        rawData: new Uint8Array(0),
        avgFrequency: 0,
        hasAudio: false,
      };
    }

    const data = audioData.frequencyData;

    // Check if there's actual audio activity
    const totalActivity = data.reduce((sum, val) => sum + val, 0);
    const hasAudio = totalActivity > 0;

    // Use the same frequency ranges as other visualizations
    const bassRange = data.slice(0, 32);
    const midRange = data.slice(32, 96);
    const trebleRange = data.slice(96, 160);

    const bass =
      bassRange.reduce((sum, val) => sum + val, 0) / bassRange.length;
    const mid = midRange.reduce((sum, val) => sum + val, 0) / midRange.length;
    const treble =
      trebleRange.reduce((sum, val) => sum + val, 0) / trebleRange.length;
    const overall = data.reduce((sum, val) => sum + val, 0) / data.length;
    const avgFrequency = overall;

    return {
      bass: bass / 255,
      mid: mid / 255,
      treble: treble / 255,
      overall: overall / 255,
      rawData: data,
      avgFrequency,
      hasAudio,
    };
  };

  // Store original positions for animation
  const originalPositionsRef = useRef<Float32Array | null>(null);
  const frameCountRef = useRef(0);

  // Create globe geometry
  const createGlobe = () => {
    const group = new THREE.Group();

    // Create particle cloud globe
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Distribute points on sphere surface with consistent positioning
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const radius = 1.0; // Fixed radius for consistent sphere

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Store original positions
      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      // Base color (dark purple) - static
      colors[i * 3] = 0.54; // R
      colors[i * 3 + 1] = 0.17; // G
      colors[i * 3 + 2] = 0.89; // B
    }

    // Store original positions for reference
    originalPositionsRef.current = originalPositions;

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.025, // Slightly larger for better visibility
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true, // Makes particles smaller when further away
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);
    particlesRef.current = particles;

    // Create wireframe sphere
    const wireframeGeometry = new THREE.SphereGeometry(1, 32, 16);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x8a2be2,
      transparent: true,
      opacity: 0.3,
    });

    const wireframeGeo = new THREE.WireframeGeometry(wireframeGeometry);
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMaterial);
    group.add(wireframe);
    wireframeRef.current = wireframe;

    // Create atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        intensity: { value: 0.3 },
        color: { value: new THREE.Color(0x8a2be2) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float intensity;
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
          float fresnel = dot(vNormal, vec3(0.0, 0.0, 1.0));
          fresnel = pow(1.0 - fresnel, 2.0);
          gl_FragColor = vec4(color, fresnel * intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    group.add(atmosphere);
    atmosphereRef.current = atmosphere;

    return group;
  };

  // Initialize Three.js scene
  const initScene = () => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      1, // Will be updated in resize
      0.1,
      1000
    );
    camera.position.z = 3;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create globe
    const globe = createGlobe();
    scene.add(globe);
    globeRef.current = globe;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x8a2be2, 1, 100);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    handleResize();
  };

  // Handle resize
  const handleResize = () => {
    if (!containerRef.current || !rendererRef.current || !cameraRef.current)
      return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();

    rendererRef.current.setSize(width, height);
  };

  // Animation loop
  const animate = () => {
    if (
      !sceneRef.current ||
      !rendererRef.current ||
      !cameraRef.current ||
      !globeRef.current
    )
      return;

    const { bass, mid, treble, overall, rawData, avgFrequency, hasAudio } =
      processAudioData();

    frameCountRef.current++;

    // Handle rotation - ONLY based on user interaction or audio data
    if (!isInteracting) {
      if (hasAudio && rawData.length > 0) {
        // Audio-driven rotation - speed based on audio intensity
        const rotationSpeed = 0.002 + overall * 0.008; // Base speed + audio intensity
        autoRotationRef.current += rotationSpeed;
        globeRef.current.rotation.y = autoRotationRef.current;
      } else {
        // NO rotation when no audio - completely static
        globeRef.current.rotation.y = autoRotationRef.current;
      }
    } else {
      // Apply manual rotation
      globeRef.current.rotation.x = rotationRef.current.x;
      globeRef.current.rotation.y = rotationRef.current.y;
    }

    // ONLY animate when there's actual audio data
    if (hasAudio && rawData.length > 0) {
      // Bass-driven scale pulsing (much more responsive)
      const pulseScale = 1 + bass * 0.15; // Increased sensitivity
      scaleRef.current = THREE.MathUtils.lerp(
        scaleRef.current,
        pulseScale,
        0.2
      );
      globeRef.current.scale.setScalar(scaleRef.current);

      // Particles reactivity - each particle directly mapped to frequency data
      if (particlesRef.current && originalPositionsRef.current) {
        const positions = particlesRef.current.geometry.attributes.position;
        const colors = particlesRef.current.geometry.attributes.color;
        const originalPositions = originalPositionsRef.current;
        const particleCount = positions.count;

        // Debug log to verify data flow
        if (frameCountRef.current % 60 === 0) {
          console.log("Audio Data:", {
            dataLength: rawData.length,
            particleCount,
            sampleValues: Array.from(rawData.slice(0, 10)).map((v) =>
              v.toString()
            ),
          });
        }

        for (let i = 0; i < particleCount; i++) {
          // Get original position
          const origX = originalPositions[i * 3];
          const origY = originalPositions[i * 3 + 1];
          const origZ = originalPositions[i * 3 + 2];

          // Map each particle to a specific frequency bin
          const frequencyIndex = Math.floor(
            (i / particleCount) * rawData.length
          );
          const clampedIndex = Math.min(frequencyIndex, rawData.length - 1);
          const rawFrequencyValue = rawData[clampedIndex];
          const normalizedFrequency = rawFrequencyValue / 255;

          // Only move if there's significant frequency data (above noise threshold)
          if (normalizedFrequency > 0.02) {
            // Calculate movement intensity
            const movementIntensity = normalizedFrequency;

            // Radial displacement (outward from sphere center)
            const radialDirection = new THREE.Vector3(
              origX,
              origY,
              origZ
            ).normalize();
            const radialDisplacement = movementIntensity * 0.4; // Increased for visibility

            // Vertical displacement (jumping effect)
            const verticalDisplacement = movementIntensity * 0.6; // Strong vertical movement

            // Additional jitter for high frequencies
            let jitterX = 0,
              jitterY = 0,
              jitterZ = 0;
            if (normalizedFrequency > 0.6) {
              const jitterAmount = (normalizedFrequency - 0.6) * 0.15;
              jitterX = (Math.random() - 0.5) * jitterAmount;
              jitterY = (Math.random() - 0.5) * jitterAmount;
              jitterZ = (Math.random() - 0.5) * jitterAmount;
            }

            // Calculate final position
            const newX =
              origX + radialDirection.x * radialDisplacement + jitterX;
            const newY =
              origY +
              radialDirection.y * radialDisplacement +
              verticalDisplacement +
              jitterY;
            const newZ =
              origZ + radialDirection.z * radialDisplacement + jitterZ;

            positions.setXYZ(i, newX, newY, newZ);

            // Color based on frequency intensity and range
            let r, g, b;
            if (clampedIndex < 32) {
              // Bass range - purple to blue
              r = THREE.MathUtils.lerp(0.54, 0.1, normalizedFrequency);
              g = THREE.MathUtils.lerp(0.17, 0.4, normalizedFrequency);
              b = THREE.MathUtils.lerp(0.89, 1.0, normalizedFrequency);
            } else if (clampedIndex < 96) {
              // Mid range - purple to magenta
              r = THREE.MathUtils.lerp(0.54, 1.0, normalizedFrequency);
              g = THREE.MathUtils.lerp(0.17, 0.1, normalizedFrequency);
              b = THREE.MathUtils.lerp(0.89, 1.0, normalizedFrequency);
            } else {
              // Treble range - purple to cyan
              r = THREE.MathUtils.lerp(0.54, 0.0, normalizedFrequency);
              g = THREE.MathUtils.lerp(0.17, 1.0, normalizedFrequency);
              b = THREE.MathUtils.lerp(0.89, 1.0, normalizedFrequency);
            }

            // Brightness boost based on movement and frequency
            const brightness = 1 + normalizedFrequency * 2.5;
            colors.setXYZ(i, r * brightness, g * brightness, b * brightness);
          } else {
            // No significant frequency - return to original position
            positions.setXYZ(i, origX, origY, origZ);
            colors.setXYZ(i, 0.54, 0.17, 0.89); // Base purple
          }
        }

        positions.needsUpdate = true;
        colors.needsUpdate = true;
      }

      // Wireframe reactivity
      if (wireframeRef.current) {
        const material = wireframeRef.current
          .material as THREE.LineBasicMaterial;
        material.opacity = 0.2 + overall * 0.6;

        // Color shift based on dominant frequency
        if (treble > mid && treble > bass) {
          material.color.setHex(0x00ffff); // Cyan for treble
        } else if (mid > bass) {
          material.color.setHex(0xff00ff); // Magenta for mid
        } else {
          material.color.setHex(0x8a2be2); // Purple for bass
        }
      }

      // Atmosphere reactivity
      if (atmosphereRef.current) {
        const material = atmosphereRef.current.material as THREE.ShaderMaterial;
        material.uniforms.intensity.value = 0.3 + overall * 1.0;

        // Color shift based on frequency content
        let color;
        if (treble > mid && treble > bass) {
          color = new THREE.Color(0x00ffff); // Cyan for treble
        } else if (mid > bass) {
          color = new THREE.Color(0xff00ff); // Magenta for mid
        } else {
          color = new THREE.Color(0x8a2be2); // Purple for bass
        }
        material.uniforms.color.value = color;
      }
    } else {
      // Complete stillness when no audio - no animations at all

      // Keep scale at exactly 1.0 - no pulsing
      globeRef.current.scale.setScalar(1.0);
      scaleRef.current = 1.0;

      // Reset particles to original positions and hold them there
      if (particlesRef.current && originalPositionsRef.current) {
        const positions = particlesRef.current.geometry.attributes.position;
        const colors = particlesRef.current.geometry.attributes.color;
        const originalPositions = originalPositionsRef.current;

        for (let i = 0; i < positions.count; i++) {
          // Set to exact original positions - no interpolation
          const targetX = originalPositions[i * 3];
          const targetY = originalPositions[i * 3 + 1];
          const targetZ = originalPositions[i * 3 + 2];

          positions.setXYZ(i, targetX, targetY, targetZ);

          // Set to exact base purple color - no fading
          colors.setXYZ(i, 0.54, 0.17, 0.89);
        }

        positions.needsUpdate = true;
        colors.needsUpdate = true;
      }

      // Set wireframe to exact static values
      if (wireframeRef.current) {
        const material = wireframeRef.current
          .material as THREE.LineBasicMaterial;
        material.opacity = 0.3;
        material.color.setHex(0x8a2be2);
      }

      // Set atmosphere to exact static values
      if (atmosphereRef.current) {
        const material = atmosphereRef.current.material as THREE.ShaderMaterial;
        material.uniforms.intensity.value = 0.3;
        material.uniforms.color.value = new THREE.Color(0x8a2be2);
      }
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationRef.current = requestAnimationFrame(animate);
  };

  // Mouse interaction handlers
  const handleMouseDown = (event: React.MouseEvent) => {
    setIsInteracting(true);
    mouseRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isInteracting) return;

    const deltaX = event.clientX - mouseRef.current.x;
    const deltaY = event.clientY - mouseRef.current.y;

    rotationRef.current.x += deltaY * 0.01;
    rotationRef.current.y += deltaX * 0.01;

    // Clamp X rotation
    rotationRef.current.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, rotationRef.current.x)
    );

    mouseRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleMouseUp = () => {
    setIsInteracting(false);
    // Update auto rotation to continue from current position
    autoRotationRef.current = rotationRef.current.y;
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (!cameraRef.current) return;

    const delta = event.deltaY * 0.001;
    cameraRef.current.position.z = Math.max(
      1.5,
      Math.min(6, cameraRef.current.position.z + delta)
    );
  };

  // Cleanup
  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (containerRef.current && rendererRef.current.domElement) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
  };

  // Effects
  useEffect(() => {
    initScene();
    animate();

    const handleWindowResize = () => handleResize();
    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      cleanup();
    };
  }, []);

  useEffect(() => {
    handleResize();
  }, []);

  // Re-animate when audio data changes
  useEffect(() => {
    if (isPlaying) {
      // Force update to ensure reactivity
      frameCountRef.current = 0;
    }
  }, [isPlaying, audioData]);

  return (
    <div
      ref={containerRef}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
      style={{
        width: "40vh",
        height: "40vh",
        pointerEvents: "auto",
        cursor: isInteracting ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Add comprehensive graph scales and legend overlay */}
      <div className="absolute top-2 left-2 z-20 bg-black/30 backdrop-blur-sm rounded px-2 py-1 text-xs text-white/80 font-mono">
        3D Audio Globe
      </div>
      
      {/* Audio reactivity indicators with labels */}
      {isPlaying && (
        <div className="absolute top-2 right-2 z-20">
          <div className="bg-black/30 backdrop-blur-sm rounded px-2 py-1">
            <div className="flex gap-2 items-center">
              <div className="flex flex-col items-center">
                <div 
                  className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"
                  style={{ 
                    opacity: processAudioData().bass > 0.3 ? 1 : 0.3,
                    transform: `scale(${1 + processAudioData().bass * 2})`
                  }}
                />
                <span className="text-xs text-white/70 mt-1">Bass</span>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-3 h-3 rounded-full bg-pink-500 animate-pulse"
                  style={{ 
                    opacity: processAudioData().mid > 0.3 ? 1 : 0.3,
                    transform: `scale(${1 + processAudioData().mid * 2})`
                  }}
                />
                <span className="text-xs text-white/70 mt-1">Mid</span>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse"
                  style={{ 
                    opacity: processAudioData().treble > 0.3 ? 1 : 0.3,
                    transform: `scale(${1 + processAudioData().treble * 2})`
                  }}
                />
                <span className="text-xs text-white/70 mt-1">Treble</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Legend for 3D visualization */}
      <div className="absolute bottom-2 left-2 z-20">
        <div className="bg-black/30 backdrop-blur-sm rounded px-2 py-1 text-xs">
          <div className="font-bold text-white/90 mb-1">3D Globe Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-white/70">Particles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white/50"></div>
              <span className="text-white/70">Wireframe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500/50"></div>
              <span className="text-white/70">Atmosphere</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scale indicators for 3D visualization */}
      <div className="absolute bottom-2 right-2 z-20">
        <div className="bg-black/30 backdrop-blur-sm rounded px-2 py-1 text-xs">
          <div className="font-bold text-white/90 mb-1">Scale</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-white/70">Size:</span>
              <span className="text-white/90">
                {isPlaying ? (1 + processAudioData().overall * 0.15).toFixed(2) + "x" : "1.00x"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/70">Freq:</span>
              <span className="text-white/90">
                {isPlaying ? Math.round(processAudioData().avgFrequency) : "0"}Hz
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
