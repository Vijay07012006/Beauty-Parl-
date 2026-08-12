'use client';

import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Camera, Sparkles, RefreshCw, Upload, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    tf: any;
    faceLandmarksDetection: any;
  }
}

const MAKEUP_COLORS = [
  { name: 'Ruby Red', hex: '#E0115F', desc: 'Classic bold crimson' },
  { name: 'Rose Petal', hex: '#FF69B4', desc: 'Soft romantic pink' },
  { name: 'Deep Plum', hex: '#4E0E2E', desc: 'Elegant evening berry' },
  { name: 'Coral Glow', hex: '#FF7F50', desc: 'Vibrant sun-kissed peach' },
  { name: 'Nude Satin', hex: '#D2B48C', desc: 'Natural chic beige' },
];

export default function VirtualTryOnPage() {
  const [selectedColor, setSelectedColor] = useState(MAKEUP_COLORS[0]);
  const [intensity, setIntensity] = useState(0.6); // opacity 0-1
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [loading, setLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [detector, setDetector] = useState<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Load external TFJS + FaceLandmarks scripts dynamically
  useEffect(() => {
    const loadScript = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    };

    const loadAllScripts = async () => {
      try {
        setModelLoading(true);
        // Load tfjs-core, backend-webgl, converter, face-landmarks-detection
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.10.0/dist/tf-core.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.10.0/dist/tf-backend-webgl.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.10.0/dist/tf-converter.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@1.0.2/dist/face-landmarks-detection.min.js');
        setScriptsLoaded(true);
      } catch (err) {
        console.error('Failed to load TFJS CDN scripts', err);
        setErrorMsg('Could not load AI models. Please verify internet connection.');
        setModelLoading(false);
      }
    };

    loadAllScripts();
  }, []);

  // Initialize face detector
  useEffect(() => {
    if (!scriptsLoaded) return;

    const initDetector = async () => {
      try {
        const model = window.faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1,
        };
        const faceDetector = await window.faceLandmarksDetection.createDetector(model, detectorConfig);
        setDetector(faceDetector);
        setModelLoading(false);
        setLoading(false);
      } catch (err) {
        console.error('Failed to create face mesh detector', err);
        setErrorMsg('Error initializing face mesh detector.');
        setModelLoading(false);
      }
    };

    initDetector();
  }, [scriptsLoaded]);

  // Handle camera stream setup
  useEffect(() => {
    if (mode !== 'camera' || modelLoading) return;

    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const constraints = {
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        };
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
      } catch (err) {
        console.error('Camera access error', err);
        toast.error('Unable to access webcam. Please upload an image instead.');
        setMode('upload');
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode, modelLoading]);

  // Detection loop
  useEffect(() => {
    if (!detector) return;

    let animationId: number;
    let isMounted = true;

    const renderLoop = async () => {
      if (!isMounted) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (mode === 'camera' && video && canvas && video.readyState === 4) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Set canvas sizes
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          // Clear & draw background video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const faces = await detector.estimateFaces(video);
            if (faces && faces.length > 0) {
              drawMakeup(ctx, faces[0].keypoints);
            }
          } catch (e) {
            // silent frame error catch to keep loop smooth
          }
        }
      } else if (mode === 'upload' && canvas && uploadedImage) {
        // Draw static uploaded image + overlay
        const img = new Image();
        img.src = uploadedImage;
        img.onload = async () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            try {
              const faces = await detector.estimateFaces(img);
              if (faces && faces.length > 0) {
                drawMakeup(ctx, faces[0].keypoints);
              }
            } catch (e) {}
          }
        };
      }

      animationId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
    };
  }, [detector, mode, uploadedImage, selectedColor, intensity]);

  // Draw lipstick overlay
  const drawMakeup = (ctx: CanvasRenderingContext2D, keypoints: any[]) => {
    // Upper lip outer border landmarks: 61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291
    // Lower lip outer border landmarks: 291, 321, 375, 291, 314, 17, 84, 181, 91, 146, 61
    // Let's use simple list of lip coordinates
    const lipIndices = [
      61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291,
      321, 375, 314, 17, 84, 181, 91, 146, 61
    ];

    const points = lipIndices
      .map(idx => keypoints[idx])
      .filter(p => p !== undefined);

    if (points.length < 3) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    // Fill lip path with selected color & alpha intensity
    ctx.fillStyle = selectedColor.hex;
    ctx.globalAlpha = intensity;
    ctx.fill();

    // Add overlay stroke for realistic gloss blend
    ctx.strokeStyle = selectedColor.hex;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = intensity * 0.4;
    ctx.stroke();

    ctx.restore();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          setMode('upload');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-background flex flex-col items-center">
        <div className="container mx-auto px-4 max-w-6xl space-y-8">
          
          {/* Header Area */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Virtual Beauty Mirror
            </div>
            <h1 className="text-4xl font-playfair font-bold">AR Makeup Try-On</h1>
            <p className="text-muted-foreground text-sm">
              Discover your perfect shade instantly. Use your camera or upload a portrait to overlay premium beauty products in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Try-On Screen */}
            <div className="lg:col-span-8 space-y-4">
              <div 
                ref={containerRef}
                className="relative aspect-video w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-border flex items-center justify-center min-h-[360px]"
              >
                {modelLoading && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-white space-y-4 p-6 z-20">
                    <RefreshCw className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm font-semibold tracking-wider font-playfair">Initializing AR Engine...</p>
                    <p className="text-xs text-muted-foreground">Downloading AI landmarks detector models</p>
                  </div>
                )}

                {errorMsg && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-red-400 space-y-3 p-6 z-20">
                    <AlertCircle className="w-12 h-12" />
                    <p className="text-sm font-bold">{errorMsg}</p>
                  </div>
                )}

                {/* Webcam Hidden Stream */}
                {mode === 'camera' && !modelLoading && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="hidden"
                  />
                )}

                {/* Active Render Screen */}
                {!modelLoading && (mode === 'camera' || (mode === 'upload' && uploadedImage)) ? (
                  <canvas ref={canvasRef} className="max-w-full max-h-full object-contain rounded-2xl" />
                ) : (
                  !modelLoading && (
                    <div className="text-center p-8 space-y-4 text-muted-foreground max-w-sm">
                      <Upload className="w-12 h-12 mx-auto stroke-[1.5]" />
                      <p className="text-sm font-medium">Please upload a portrait image to start virtual try-on.</p>
                      <label className="inline-block px-6 py-3 bg-primary text-white text-xs font-bold rounded-full cursor-pointer hover:bg-primary/95 transition">
                        Select Photo
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  )
                )}

                {/* Action Mode Badges */}
                {!modelLoading && (
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex gap-2 border border-white/10 text-xs">
                    <button
                      onClick={() => setMode('camera')}
                      className={`px-3 py-1 rounded-full font-semibold transition ${
                        mode === 'camera' ? 'bg-primary text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Live Video
                    </button>
                    <button
                      onClick={() => setMode('upload')}
                      className={`px-3 py-1 rounded-full font-semibold transition ${
                        mode === 'upload' ? 'bg-primary text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Photo Upload
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Input underneath if in Upload Mode */}
              {mode === 'upload' && !modelLoading && uploadedImage && (
                <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border/50">
                  <span className="text-xs text-muted-foreground">Using custom photo overlay.</span>
                  <label className="text-xs font-bold text-primary hover:underline cursor-pointer">
                    Change Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* Right: Controls & Cosmetic Picker */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Product Color Palette Card */}
              <div className="bg-card p-6 rounded-3xl border border-border/50 shadow-lg space-y-6">
                <div>
                  <h3 className="font-playfair font-bold text-lg text-foreground">Lipstick Shades</h3>
                  <p className="text-xs text-muted-foreground">Select a shade to dynamically paint on screen</p>
                </div>

                <div className="space-y-3">
                  {MAKEUP_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer hover:border-primary/45 ${
                        selectedColor.name === color.name ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-8 h-8 rounded-full border border-black/15 shadow-sm block shrink-0" 
                          style={{ backgroundColor: color.hex }}
                        />
                        <div>
                          <h4 className="font-bold text-xs text-foreground">{color.name}</h4>
                          <p className="text-[10px] text-muted-foreground">{color.desc}</p>
                        </div>
                      </div>
                      {selectedColor.name === color.name && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Intensity Slider */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-foreground">Color Intensity</span>
                    <span className="text-primary font-bold">{Math.round(intensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={intensity}
                    onChange={(e) => setIntensity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Shopping Card recommendation */}
              <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 space-y-4">
                <h4 className="font-playfair font-bold text-base text-foreground">Matched Product</h4>
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-white border border-border/40 rounded-xl flex items-center justify-center text-2xl relative shrink-0 shadow-sm">
                    💄
                    <span 
                      className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-foreground">Luxe Shine Liquid Lipstick</h5>
                    <p className="text-[10px] text-muted-foreground">Shade: {selectedColor.name}</p>
                    <p className="text-xs font-bold text-primary">$24.00</p>
                  </div>
                </div>
                <button 
                  onClick={() => toast.success(`Added Luxe Shine Lipstick (${selectedColor.name}) to cart!`)}
                  className="w-full py-3 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/95 transition shadow-md shadow-primary/20 cursor-pointer"
                >
                  Add To Cart
                </button>
              </div>

            </div>

          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
