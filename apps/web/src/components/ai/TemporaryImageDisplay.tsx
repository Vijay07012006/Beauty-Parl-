'use client';

import { useState, useEffect } from 'react';

export function TemporaryImageDisplay({ images, onClear }: { images: string[], onClear: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-clear after 30 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      onClear();
    }, 30000);

    return () => clearTimeout(timer);
  }, [images, onClear]);

  if (!visible || !images || images.length === 0) return null;

  return (
    <div className="space-y-2.5 p-4 bg-secondary/10 dark:bg-secondary/5 rounded-2xl border border-border/40">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <span>📸</span> Temporary Search Assets <span className="text-[10px] text-muted-foreground font-normal">(auto-clear in 30s)</span>
        </p>
        <button 
          onClick={() => { setVisible(false); onClear(); }} 
          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {images.map((url, idx) => (
          <img 
            key={idx} 
            src={url} 
            alt="Temporary search result" 
            className="w-24 h-24 object-cover rounded-xl border border-border/20 shadow-sm shrink-0" 
          />
        ))}
      </div>
    </div>
  );
}
