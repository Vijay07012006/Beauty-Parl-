'use client';

import { useRef, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, ContactShadows, Stage, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

// Premium Cosmetic Product Model
function CosmeticProduct() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const capRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const clock = useRef(new THREE.Clock());

  useFrame(() => {
    const delta = clock.current.getDelta();
    const elapsed = clock.current.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(elapsed * 0.3) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main Body - Elegant gradient effect */}
      <mesh ref={meshRef} position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.75, 1.8, 48]} />
        <meshPhysicalMaterial
          color="#E8A0BF"
          roughness={0.15}
          metalness={0.3}
          clearcoat={0.4}
          clearcoatRoughness={0.2}
          envMapIntensity={1.2}
          emissive="#E8A0BF"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Gold Trim Ring */}
      <mesh ref={ringRef} position={[0, 0.85, 0]} castShadow>
        <torusGeometry args={[0.6, 0.035, 24, 48]} />
        <meshPhysicalMaterial
          color="#D4AF37"
          roughness={0.1}
          metalness={0.9}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Gold Cap with Premium Finish */}
      <mesh ref={capRef} position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.65, 0.58, 0.5, 48]} />
        <meshPhysicalMaterial
          color="#D4AF37"
          roughness={0.1}
          metalness={0.85}
          clearcoat={0.3}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Sparkle Effect - Diamond */}
      <mesh position={[0, 1.0, 0.4]}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0}
          metalness={0}
          transparent
          opacity={0.8}
          emissive="#ffffff"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Bottom Gold Ring */}
      <mesh position={[0, -0.85, 0]}>
        <torusGeometry args={[0.58, 0.02, 16, 48]} />
        <meshPhysicalMaterial
          color="#D4AF37"
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>

      {/* Shadow/Reflection Floor */}
      <mesh position={[0, -1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshPhysicalMaterial
          color="#000000"
          transparent
          opacity={0.1}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

export function Product3DViewer() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-[400px] md:h-[500px] lg:h-[550px] relative">
      <Canvas
        camera={{ position: [0, 0, isMobile ? 5.5 : 4.5], fov: 40 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Environment - Studio Quality */}
          <Environment preset="studio" background={false} />
          
          {/* Stage Lights */}
          <Stage
            environment="studio"
            intensity={0.8}
            shadows={false}
            adjustCamera={false}
          />

          {/* Main 3D Object with Controls */}
          <PresentationControls
            global={false}
            rotation={[0, 0, 0]}
            polar={[0, Math.PI / 2]}
            azimuth={[-Math.PI / 4, Math.PI / 4]}
            snap={true}
            speed={1.5}
          >
            <Float
              speed={1.5}
              rotationIntensity={0.3}
              floatIntensity={0.5}
            >
              <CosmeticProduct />
            </Float>
          </PresentationControls>

          {/* Contact Shadows */}
          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.3}
            scale={2}
            blur={2}
            far={2}
            color="#000000"
          />
        </Suspense>

        {/* Orbit Controls - User can rotate/zoom */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={false}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.2}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Instructions Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/60 text-center pointer-events-none">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}
