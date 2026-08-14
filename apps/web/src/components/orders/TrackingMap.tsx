'use client';

import { useEffect, useRef } from 'react';

interface TrackingMapProps {
  latitude: number;
  longitude: number;
}

export function TrackingMap({ latitude, longitude }: TrackingMapProps) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    // 1. Inject Leaflet CSS
    const linkId = 'leaflet-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Inject Leaflet JS
    const scriptId = 'leaflet-js';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    const initMap = () => {
      const L = (window as any).L;
      if (!L) return;

      const container = document.getElementById('tracking-map-container');
      if (!container) return;

      // 3. Initialize map if not already initialized
      if (!mapRef.current) {
        mapRef.current = L.map('tracking-map-container').setView([latitude, longitude], 14);

        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (mapboxToken) {
          L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`, {
            attribution: '© Mapbox, © OpenStreetMap',
            tileSize: 512,
            zoomOffset: -1,
          }).addTo(mapRef.current);
        } else {
          // OpenStreetMap free tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
          }).addTo(mapRef.current);
        }
      }

      // Create a nice pink marker for Beauty Parlé
      const pinkIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #E8A0BF; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">📦</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // 4. Add/update marker
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = L.marker([latitude, longitude], { icon: pinkIcon }).addTo(mapRef.current);
        markerRef.current.bindPopup('<b style="color: #4A1A2C;">Your Package is Here! 🚚</b>').openPopup();
      }

      mapRef.current.setView([latitude, longitude], 14);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      document.body.appendChild(script);
      script.onload = initMap;
    } else {
      // If script exists, just run map init (or wait for window.L if still loading)
      if ((window as any).L) {
        initMap();
      } else {
        script.addEventListener('load', initMap);
      }
    }

    return () => {
      // We don't destroy scripts globally since other maps might use them,
      // but we clean up map instances to prevent duplicate bindings.
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-md border border-border bg-secondary/10 relative z-0">
      <div id="tracking-map-container" className="w-full h-full" />
    </div>
  );
}
