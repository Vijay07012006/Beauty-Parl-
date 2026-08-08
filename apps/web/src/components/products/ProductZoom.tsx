'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductZoomProps {
  src: string;
  alt: string;
}

export function ProductZoom({ src, alt }: ProductZoomProps) {
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transform: 'scale(1)',
    transformOrigin: 'center center'
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomStyle({
      transform: 'scale(2.2)',
      transformOrigin: `${x}% ${y}%`
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transform: 'scale(1)',
      transformOrigin: 'center center'
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((touch.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((touch.clientY - top) / height) * 100));

    setZoomStyle({
      transform: 'scale(2)',
      transformOrigin: `${x}% ${y}%`
    });
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-secondary/10 rounded-3xl border border-border/50 cursor-zoom-in"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseLeave}
    >
      <div
        className="w-full h-full relative transition-transform duration-75 ease-out pointer-events-none"
        style={zoomStyle}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
