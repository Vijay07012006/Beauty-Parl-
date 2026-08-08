'use client';

import { useState, useEffect } from 'react';
import { Product3DViewer } from './Product3DViewer';

export function Product3D() {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Catch WebGL or canvas errors specifically
      if (event.message?.includes('WebGL') || event.message?.includes('Context Lost')) {
        setHasError(true);
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="w-full h-[400px] md:h-[500px] lg:h-[550px] flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/20 to-primary/5 rounded-2xl">
        <div className="text-center p-4">
          <span className="text-4xl mb-2 block">💄</span>
          <p className="text-muted-foreground text-sm font-medium">3D viewer unavailable</p>
        </div>
      </div>
    );
  }

  try {
    return <Product3DViewer />;
  } catch (error) {
    return (
      <div className="w-full h-[400px] md:h-[500px] lg:h-[550px] flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/20 to-primary/5 rounded-2xl">
        <div className="text-center p-4">
          <span className="text-4xl mb-2 block">💄</span>
          <p className="text-muted-foreground text-sm font-medium">3D viewer unavailable</p>
        </div>
      </div>
    );
  }
}
