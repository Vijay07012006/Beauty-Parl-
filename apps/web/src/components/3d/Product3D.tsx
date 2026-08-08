'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingProductProps {
  isHovered: boolean;
}

function FloatingProduct({ isHovered }: FloatingProductProps) {
  const meshRef = useRef<any>(null);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    if (meshRef.current) {
      // Smooth auto-rotation with hover pause
      if (!isHovered) {
        meshRef.current.rotation.y += delta * 0.45;
      }
      meshRef.current.rotation.x = Math.sin(elapsed * 0.3) * 0.06;
      meshRef.current.position.y = Math.cos(elapsed * 0.6) * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} position={[0, -0.2, 0]} castShadow receiveShadow>
        {/* Luxury Lipstick Tube Body */}
        <cylinderGeometry args={[0.55, 0.6, 1.8, 64]} />
        <meshPhysicalMaterial 
          color="#2D1B2E" 
          roughness={0.15} 
          metalness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          reflectivity={0.8}
        />
        
        {/* Gold Cap / Neck */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.5, 64]} />
          <meshPhysicalMaterial 
            color="#D4AF37" 
            roughness={0.05} 
            metalness={0.95}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>

        {/* actual Lipstick Product Bullet */}
        <mesh position={[0, 1.6, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.5, 64]} />
          <meshPhysicalMaterial 
            color="#E8A0BF" 
            roughness={0.25} 
            metalness={0.0}
            clearcoat={0.3}
            clearcoatRoughness={0.2}
          />
        </mesh>

        {/* Gold Accent Band */}
        <mesh position={[0, 0.0, 0]} castShadow>
          <torusGeometry args={[0.575, 0.04, 16, 64]} />
          <meshPhysicalMaterial 
            color="#D4AF37" 
            roughness={0.05} 
            metalness={0.95}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>
      </mesh>
    </Float>
  );
}

export function Product3D() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="w-full h-[320px] md:h-[450px] lg:h-[500px] bg-gradient-to-tr from-secondary/40 via-background to-primary/10 rounded-3xl overflow-hidden shadow-inner relative border border-border/30 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas camera={{ position: [0, 0.5, 4.2], fov: 45 }} shadows>
        {/* Better Lighting System */}
        <ambientLight intensity={0.6} />
        
        {/* Directional Key Light */}
        <directionalLight 
          position={[5, 8, 5]} 
          intensity={1.8} 
          castShadow 
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Rim / Hair Light for outline definition */}
        <directionalLight 
          position={[-5, 5, -5]} 
          intensity={1.5} 
          color="#FFF5EA" 
        />
        
        {/* Soft Fill Light from below */}
        <directionalLight 
          position={[0, -3, 2]} 
          intensity={0.6} 
          color="#E8A0BF" 
        />
        
        {/* Fill light from the left */}
        <pointLight position={[-4, 2, 2]} intensity={0.5} />

        <Environment preset="studio" />
        
        <FloatingProduct isHovered={isHovered} />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
}
