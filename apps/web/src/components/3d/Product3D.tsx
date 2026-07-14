'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

function FloatingProduct() {
  const meshRef = useRef<any>(null);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x = Math.sin(elapsed * 0.2) * 0.05;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.8, 1.8, 32]} />
        <meshStandardMaterial color="#E8A0BF" roughness={0.3} metalness={0.4} />
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.7, 0.65, 0.4, 32]} />
          <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <torusGeometry args={[0.65, 0.04, 16, 32]} />
          <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.8} />
        </mesh>
      </mesh>
    </Float>
  );
}

export function Product3D() {
  return (
    <div className="w-full h-[500px]">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Environment preset="sunset" />
        <FloatingProduct />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
