'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ObservabilityPage() {
  const router = useRouter();
  const [iframeSrc, setIframeSrc] = useState('');
  const [isProd, setIsProd] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        setIsProd(true);
      } else {
        setIframeSrc('http://localhost:3002');
      }
    }
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-primary mb-2">📊 Live System Observability</h1>
      <p className="text-xs text-muted-foreground mb-6">
        Real-time API latency, request count, and server health metrics (Free Self-Hosted Grafana).
      </p>

      {isProd ? (
        <div className="border border-border/40 bg-card rounded-2xl p-8 text-center shadow-md space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl">
            📈
          </div>
          <h2 className="text-xl font-bold tracking-tight">Production Monitoring Active</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            API request latencies and core web vitals are being captured and processed in the background. 
            The self-hosted local Grafana stack is disabled in production. Cloud-hosted dashboard integration will be configured in Phase 2.
          </p>
          <div className="inline-block px-4 py-2 bg-muted text-[11px] font-medium rounded-full text-muted-foreground border border-border/10">
            Current Environment: Production (Vercel)
          </div>
        </div>
      ) : (
        <div className="border border-border/30 rounded-xl overflow-hidden shadow-lg h-[80vh]">
          {iframeSrc ? (
            <iframe
              src={iframeSrc}
              width="100%"
              height="100%"
              className="border-0"
              title="Grafana Dashboard"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse text-xs">
              Loading Grafana panel...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
