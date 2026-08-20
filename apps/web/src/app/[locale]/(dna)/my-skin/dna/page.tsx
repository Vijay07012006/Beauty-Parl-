/* eslint-disable */
'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/products/ProductCard';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface DnaReport {
  scores: {
    Hydration: number;
    Elasticity: number;
    Pigmentation: number;
    Sensitivity: number;
    'Acne Risk': number;
  };
  summary: string;
  recommendations: {
    productId: number;
    name: string;
    reason: string;
  }[];
}

export default function SkinDnaPage() {
  const { locale } = useParams<{ locale: string }>();
  const { user, hydrated } = useAuthStore();
  const [report, setReport] = useState<DnaReport | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/skin-dna/${user.id}`);
        setReport(res.data);

        // Fetch detailed product info for each recommendation
        if (res.data?.recommendations && res.data.recommendations.length > 0) {
          const detailPromises = res.data.recommendations.map(async (rec: any) => {
            try {
              const productRes = await api.get(`/products/${rec.productId}`);
              return { ...productRes.data, reason: rec.reason };
            } catch {
              // Return mock product on failure so UI doesn't break
              return {
                id: rec.productId,
                name: rec.name,
                price: 999,
                discountPercent: 10,
                rating: 4.5,
                image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&q=80',
                brand: 'Beauty Parlé',
                reason: rec.reason,
              };
            }
          });
          const resolved = await Promise.all(detailPromises);
          setProducts(resolved);
        }
      } catch (err: any) {
        console.error('❌ Failed to fetch skin DNA report:', err);
        setError(err.response?.data?.message || 'Could not load your skin DNA analysis.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [user, hydrated]);

  if (!hydrated || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-300">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs tracking-wider uppercase font-semibold text-zinc-400">Loading DNA Profile...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-300 p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center space-y-6 shadow-xl">
            <span className="text-4xl">🔒</span>
            <h2 className="text-2xl font-bold font-playfair text-zinc-100">Unlock Skin DNA Reports</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Log in to analyze your personalized skin DNA metrics, previous visual scans, and custom cosmetic recommendations.
            </p>
            <Link href={`/${locale}/auth/login`} className="block">
              <button className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-full font-bold text-xs tracking-wider uppercase transition shadow-lg cursor-pointer">
                Login / Register
              </button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !report) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-300 p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center space-y-6 shadow-xl">
            <span className="text-4xl">🧬</span>
            <h2 className="text-xl font-bold text-zinc-200">No DNA Report Generated</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Take our interactive quiz or upload a skin photo to trigger a hyper-personalized Skin DNA report.
            </p>
            <div className="flex gap-4">
              <Link href={`/${locale}/quiz`} className="flex-1">
                <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full font-bold text-xs uppercase tracking-wider transition cursor-pointer">
                  Take Quiz
                </button>
              </Link>
              <Link href={`/${locale}/skin-analysis`} className="flex-1">
                <button className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-full font-bold text-xs uppercase tracking-wider transition cursor-pointer">
                  Scan Skin
                </button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // --- SVG Radar Chart Math ---
  const categories = Object.keys(report.scores) as (keyof typeof report.scores)[];
  const scores = categories.map((cat) => report.scores[cat]);
  const center = 160;
  const maxVal = 100;
  const radius = 100;

  // Compute vertices for 5 angles
  const points = categories.map((_, i) => {
    const angle = i * 2 * Math.PI / 5 - Math.PI / 2;
    return {
      angle,
      cos: Math.cos(angle),
      sin: Math.sin(angle),
    };
  });

  // Generate background polygons (grid lines)
  const gridLevels = [20, 40, 60, 80, 100];
  const gridPolygons = gridLevels.map((lvl) => {
    const r = (lvl / maxVal) * radius;
    return points.map((p) => `${center + r * p.cos},${center + r * p.sin}`).join(' ');
  });

  // Actual values polygon
  const valuePoints = points.map((p, i) => {
    const val = scores[i] || 0;
    const r = (val / maxVal) * radius;
    return `${center + r * p.cos},${center + r * p.sin}`;
  }).join(' ');

  return (
    <>
      <Header />
      <main className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4">
        <div className="container mx-auto max-w-5xl space-y-12">
          {/* Header Title */}
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/10 rounded-full text-xs font-bold text-pink-500 tracking-wider uppercase border border-pink-500/20">
              🧬 Hyper-Personalization Report
            </span>
            <h1 className="text-3xl md:text-5xl font-playfair font-bold tracking-tight">
              Skin DNA Analyzer
            </h1>
            <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              AI-driven insights synthesized from your skin scans, quizzes, and preferences.
            </p>
          </div>

          {/* DNA Metrics Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: Custom SVG Radar Chart */}
            <div className="md:col-span-5 flex flex-col items-center bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-3xl">
              <h2 className="text-sm font-bold tracking-wider uppercase text-zinc-400 mb-6">
                Genomic Skin Matrix
              </h2>

              <svg width="320" height="320" className="w-full max-w-[280px]">
                {/* Grid Polygons */}
                {gridPolygons.map((pts, idx) => (
                  <polygon
                    key={idx}
                    points={pts}
                    fill="none"
                    stroke="rgba(244, 63, 94, 0.15)"
                    strokeWidth="1"
                  />
                ))}

                {/* Axis lines */}
                {points.map((p, i) => (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={center + radius * p.cos}
                    y2={center + radius * p.sin}
                    stroke="rgba(244, 63, 94, 0.2)"
                    strokeWidth="1.5"
                  />
                ))}

                {/* Score Area Polygon */}
                <polygon
                  points={valuePoints}
                  fill="rgba(244, 63, 94, 0.3)"
                  stroke="#ec4899"
                  strokeWidth="2"
                  filter="url(#glow)"
                />

                {/* Points */}
                {points.map((p, i) => {
                  const val = scores[i] || 0;
                  const r = (val / maxVal) * radius;
                  return (
                    <circle
                      key={i}
                      cx={center + r * p.cos}
                      cy={center + r * p.sin}
                      r="4.5"
                      fill="#ec4899"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Text Labels */}
                {points.map((p, i) => {
                  const label = categories[i];
                  const val = scores[i] || 0;
                  const offset = 22;
                  const lx = center + (radius + offset) * p.cos;
                  const ly = center + (radius + offset) * p.sin;
                  
                  // Label text alignment adjustments
                  let textAnchor: 'start' | 'end' | 'middle' = 'middle';
                  if (p.cos > 0.3) textAnchor = 'start';
                  if (p.cos < -0.3) textAnchor = 'end';

                  return (
                    <g key={i} className="select-none">
                      <text
                        x={lx}
                        y={ly}
                        fill="#f4f4f5"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor={textAnchor}
                        className="tracking-wider uppercase"
                      >
                        {label}
                      </text>
                      <text
                        x={lx}
                        y={ly + 11}
                        fill="#ec4899"
                        fontSize="9"
                        fontWeight="700"
                        textAnchor={textAnchor}
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Glow Filter Definition */}
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
              </svg>
            </div>

            {/* Right: AI Dermatologist Summary */}
            <div className="md:col-span-7 space-y-6">
              <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-3xl shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👩‍⚕️</span>
                  <div>
                    <h3 className="font-bold text-zinc-100 font-playfair text-lg">AI Dermatologist Summary</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Molecular DNA Synthesis</p>
                  </div>
                </div>
                <hr className="border-zinc-800" />
                <p className="text-sm text-zinc-300 leading-relaxed font-light">
                  {report.summary}
                </p>
              </div>

              {/* Individual Metrics Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {categories.map((cat, idx) => (
                  <div key={cat} className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider truncate block">
                      {cat}
                    </span>
                    <span className="text-xl font-bold font-mono text-pink-500">
                      {scores[idx]}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Recommended Products */}
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-3 flex justify-between items-end">
              <div>
                <h2 className="text-xl md:text-2xl font-playfair font-bold text-zinc-200">
                  Targeted Products for Your DNA
                </h2>
                <p className="text-xs text-zinc-400">
                  Recommended formulations selected from your results and purchase profile.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div key={prod.id} className="relative flex flex-col bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden group">
                  {/* AI Reason banner */}
                  <div className="bg-pink-500/10 border-b border-pink-500/20 px-5 py-3 text-[11px] text-pink-400 italic leading-snug">
                    ✨ {prod.reason}
                  </div>
                  {/* Standard Product Card */}
                  <div className="p-4 flex-1">
                    <ProductCard product={prod} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
