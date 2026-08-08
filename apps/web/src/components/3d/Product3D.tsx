'use client';

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

// Simple 3D product model (fallback if glTF not available)
function CosmeticProduct() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const clock = useRef(new THREE.Clock());

  useFrame(() => {
    const delta = clock.current.getDelta();
    const elapsed = clock.current.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(elapsed * 0.2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main Body */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.8, 1.8, 32]} />
        <meshStandardMaterial
          color="#E8A0BF"
          roughness={0.3}
          metalness={0.4}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Gold Ring */}
      <mesh position={[0, 0.9, 0]}>
        <torusGeometry args={[0.65, 0.04, 16, 32]} />
        <meshStandardMaterial
          color="#D4AF37"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Cap */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.7, 0.65, 0.4, 32]} />
        <meshStandardMaterial
          color="#D4AF37"
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>

      {/* Decorative Dot */}
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#E8A0BF" />
      </mesh>
    </group>
  );
}

export function Product3D() {
  return (
    <div className="w-full h-[450px] md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/20 to-primary/5">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <spotLight position={[5, 10, 5]} angle={0.15} penumbra={1} intensity={1.2} />
          <pointLight position={[-5, -5, -5]} intensity={0.5} />
          <directionalLight position={[0, 5, 5]} intensity={0.8} />
          <Environment preset="sunset" background={false} />
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <CosmeticProduct />
          </Float>
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            autoRotate={true}
            autoRotateSpeed={1.5}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
