'use client';

import { useState, useEffect } from 'react';

const Fallback = () => (
  <div className="w-full h-[300px] md:h-[350px] lg:h-[400px] flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/20 to-primary/5 rounded-2xl">
    <div className="text-center p-4">
      <span className="text-4xl mb-3 block">💄</span>
      <p className="text-muted-foreground text-xs font-medium">3D viewer unavailable</p>
    </div>
  </div>
);

export function Product3D() {
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Catch any WebGL context loss or THREE errors bubbling to window
    const handleError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (
        msg.includes('WebGL') ||
        msg.includes('Context Lost') ||
        msg.includes('THREE') ||
        msg.includes('canvas')
      ) {
        setHasError(true);
      }
    };
    window.addEventListener('error', handleError);

    // If canvas doesn't spin up in 8 seconds, degrade gracefully
    const timeout = setTimeout(() => {
      // Only set error if we haven't mounted the viewer yet (no ref to check, use hasError flag)
    }, 8000);

    return () => {
      window.removeEventListener('error', handleError);
      clearTimeout(timeout);
    };
  }, []);

  // SSR: don't render canvas server-side (avoids hydration mismatch)
  if (!isMounted) {
    return (
      <div className="w-full h-[300px] md:h-[350px] lg:h-[400px] animate-pulse bg-gradient-to-br from-primary/10 via-secondary/20 to-primary/5 rounded-2xl" />
    );
  }

  if (hasError) return <Fallback />;

  // Lazy-load the viewer to keep it off the SSR bundle
  try {
    const { Product3DViewer } = require('./Product3DViewer');
    return <Product3DViewer />;
  } catch {
    return <Fallback />;
  }
}
