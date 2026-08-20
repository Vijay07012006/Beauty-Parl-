/* eslint-disable */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface ARCanvasProps {
  lipstickColor: string; // Hex color, e.g. "#e11d48"
  opacity: number; // 0 to 1
  glossiness: number; // 0 to 1
}

const UPPER_LIP = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 311, 312, 13, 82, 81, 42, 183, 78];
const LOWER_LIP = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];

export function ARCanvas({ lipstickColor, opacity, glossiness }: ARCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('Initializing camera...');
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;
    let faceLandmarker: FaceLandmarker | null = null;
    let animationId: number;

    const initAR = async () => {
      try {
        // 1. Get webcam access
        setStatusText('Requesting webcam access...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!active) return;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        // 2. Load MediaPipe files
        setStatusText('Downloading face landmarker models...');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
        );

        if (!active) return;

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        });

        if (!active) return;
        setLoading(false);

        // 3. Start render loop
        const render = () => {
          if (!active) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video && canvas && video.readyState >= 3) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Ensure canvas dimensions match video
              if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
              }

              // Draw video frame mirrored for natural view
              ctx.save();
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              ctx.restore();

              // Detect landmarks
              if (faceLandmarker) {
                const results = faceLandmarker.detectForVideo(video, performance.now());
                
                if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                  const landmarks = results.faceLandmarks[0];

                  // Helper to draw a lip path (coordinates need to be mirrored since video is mirrored)
                  const drawLipPath = (indices: number[]) => {
                    ctx.beginPath();
                    indices.forEach((idx, i) => {
                      const pt = landmarks[idx];
                      // Mirror X coordinate to align with mirrored webcam frame
                      const x = (1 - pt.x) * canvas.width;
                      const y = pt.y * canvas.height;
                      if (i === 0) {
                        ctx.moveTo(x, y);
                      } else {
                        ctx.lineTo(x, y);
                      }
                    });
                    ctx.closePath();
                  };

                  // Set composite operation for blending
                  ctx.save();
                  ctx.lineJoin = 'round';
                  ctx.lineCap = 'round';

                  // Generate RGBA color string
                  // Parse hex to RGB
                  const hex = lipstickColor.replace('#', '');
                  const r = parseInt(hex.substring(0, 2), 16);
                  const g = parseInt(hex.substring(2, 4), 16);
                  const b = parseInt(hex.substring(4, 6), 16);

                  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.6})`;

                  // 1. Draw and fill upper lip
                  drawLipPath(UPPER_LIP);
                  ctx.fill();

                  // 2. Draw and fill lower lip
                  drawLipPath(LOWER_LIP);
                  ctx.fill();

                  // 3. Draw gloss highlight if glossiness is high
                  if (glossiness > 0.1) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${glossiness * 0.35})`;
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = '#ffffff';

                    // Highlight on center of lower lip (landmarks 14, 17, 87)
                    ctx.beginPath();
                    const highlightIndices = [17, 14, 87];
                    highlightIndices.forEach((idx, i) => {
                      const pt = landmarks[idx];
                      const x = (1 - pt.x) * canvas.width;
                      const y = pt.y * canvas.height;
                      if (i === 0) ctx.moveTo(x, y);
                      else ctx.lineTo(x + 2, y - 2);
                    });
                    ctx.closePath();
                    ctx.fill();
                  }

                  ctx.restore();
                }
              }
            }
          }

          animationId = requestAnimationFrame(render);
        };

        render();
      } catch (err: any) {
        console.error('❌ AR Try-on initialization failed:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera access denied. Please grant camera permission in your browser.'
            : `Error: ${err.message || err}`
        );
        setLoading(false);
      }
    };

    initAR();

    return () => {
      active = false;
      cancelAnimationFrame(animationId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (faceLandmarker) {
        faceLandmarker.close();
      }
    };
  }, [lipstickColor, opacity, glossiness]);

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      {/* Hidden Video element for streaming */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* Render Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover scale-x-1"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md z-10 p-6 text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold tracking-wide text-zinc-100">{statusText}</p>
          <p className="text-xs text-zinc-400 mt-2">This may take a moment to fetch resources.</p>
        </div>
      )}

      {/* Camera Error Overlay */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm z-10 p-6 text-center">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-2xl font-bold mb-4">
            ⚠️
          </div>
          <h3 className="font-bold text-zinc-100">Camera Error</h3>
          <p className="text-xs text-red-400 max-w-sm mt-2">{cameraError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-5 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-full text-xs font-bold transition shadow-lg cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}
    </div>
  );
}
