'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ARCanvas } from '@/components/ar/ARCanvas';

const SHADE_PRESETS = [
  { name: 'Crimson Silk', hex: '#be123c', desc: 'Classic bold cool-toned red' },
  { name: 'Fuchsia Spark', hex: '#db2777', desc: 'Vibrant hot pink' },
  { name: 'Mauve Rose', hex: '#9d174d', desc: 'Dusty rose with plum undertones' },
  { name: 'Peach Cream', hex: '#ea580c', desc: 'Warm summery orange-coral' },
  { name: 'Plum Velvet', hex: '#581c87', desc: 'Deep vampy purple-wine' },
  { name: 'Bare Nude', hex: '#b45309', desc: 'Soft terracotta daily brown' },
];

export default function ARPage() {
  const [color, setColor] = useState('#be123c');
  const [opacity, setOpacity] = useState(0.85);
  const [glossiness, setGlossiness] = useState(0.5);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Header Description */}
          <div className="text-center mb-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/10 rounded-full text-xs font-bold text-pink-500 tracking-wider uppercase border border-pink-500/20">
              ✨ Augmented Reality Try-On
            </span>
            <h1 className="text-3xl md:text-5xl font-playfair font-bold tracking-tight">
              Virtual Lipstick Studio
            </h1>
            <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              Find your perfect shade instantly. Choose from our curated color catalog or select a custom hue to try on live.
            </p>
          </div>

          {/* AR Studio Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Camera Feed Card */}
            <div className="lg:col-span-7 flex justify-center">
              <ARCanvas
                lipstickColor={color}
                opacity={opacity}
                glossiness={glossiness}
              />
            </div>

            {/* Right: Controls Panel */}
            <div className="lg:col-span-5 space-y-6 bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-6 rounded-3xl shadow-xl">
              <h2 className="text-lg font-bold font-playfair tracking-wide text-zinc-200">
                Studio Controls
              </h2>

              {/* Presets Grid */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  Select Shade Preset
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SHADE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setColor(preset.hex)}
                      className={`flex flex-col items-center p-3 rounded-2xl border text-center transition cursor-pointer select-none ${
                        color.toLowerCase() === preset.hex.toLowerCase()
                          ? 'bg-pink-500/10 border-pink-500 text-pink-400'
                          : 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <span
                        className="w-8 h-8 rounded-full shadow-inner border border-white/20 mb-2"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span className="text-[10px] font-bold tracking-wide truncate max-w-full">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Shade Picker */}
              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800/50">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Custom Shade
                  </label>
                  <span className="text-[10px] text-zinc-500">Pick any custom hex shade</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold tracking-wider text-zinc-300">
                    {color.toUpperCase()}
                  </span>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-full border border-zinc-700 cursor-pointer overflow-hidden bg-transparent"
                  />
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                {/* Opacity Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                    <span>Lipstick Opacity</span>
                    <span className="text-zinc-200">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                {/* Glossiness Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                    <span>Gloss & Shine</span>
                    <span className="text-zinc-200">{Math.round(glossiness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={glossiness}
                    onChange={(e) => setGlossiness(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>
              </div>

              {/* Tip section */}
              <div className="p-4 bg-pink-500/5 rounded-2xl border border-pink-500/10 text-xs leading-relaxed text-zinc-400">
                💡 <span className="font-semibold text-zinc-300">Pro Tip:</span> For the most realistic virtual try-on, ensure your face is well-lit and directly facing the camera with neutral expressions.
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
