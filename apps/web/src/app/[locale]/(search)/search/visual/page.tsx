/* eslint-disable */
'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { api } from '@/lib/api';
import Image from 'next/image';

export default function VisualSearchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const selectedFile = acceptedFiles[0];
      if (selectedFile) {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setProducts([]);
        setError(null);
        // Automatically trigger search when image is selected
        handleSearch(selectedFile);
      }
    },
  });

  const handleSearch = async (imageFile: File) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await api.post('/visual-search', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProducts(response.data || []);
    } catch (err: any) {
      console.error('❌ Visual search request failed:', err);
      setError(
        err.response?.data?.message ||
          'Visual search failed. Please verify that the Hugging Face API key is set and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setProducts([]);
    setError(null);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4">
        <div className="container mx-auto max-w-5xl space-y-12">
          {/* Header Title */}
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/10 rounded-full text-xs font-bold text-pink-500 tracking-wider uppercase border border-pink-500/20">
              📸 Reverse Image Search
            </span>
            <h1 className="text-3xl md:text-5xl font-playfair font-bold tracking-tight">
              Visual Search Engine
            </h1>
            <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              Upload an image of a cosmetic item or beauty product to discover similar items in our collection instantly.
            </p>
          </div>

          {/* Upload / Preview Card */}
          <div className="max-w-xl mx-auto">
            {!previewUrl ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] select-none ${
                  isDragActive
                    ? 'border-pink-500 bg-pink-500/5'
                    : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'
                }`}
              >
                <input {...getInputProps()} />
                <span className="text-4xl mb-4">📷</span>
                <p className="text-sm font-semibold text-zinc-200">
                  {isDragActive ? 'Drop your image here' : 'Drag & drop your product image here'}
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  Supports JPEG, PNG, or WEBP (Max 5MB)
                </p>
                <button className="mt-4 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full font-bold text-xs uppercase tracking-wider transition">
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl space-y-4">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-800">
                  <Image
                    src={previewUrl}
                    alt="Upload Preview"
                    fill
                    className="object-contain"
                  />
                  {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
                      <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-xs tracking-wider uppercase font-bold text-pink-500 animate-pulse">
                        Scanning Image...
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-zinc-400 font-semibold truncate max-w-[70%]">
                    📄 {file?.name}
                  </div>
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    Clear Image
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-xl mx-auto p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs text-center">
              ⚠️ {error}
            </div>
          )}

          {/* Search Results */}
          {!loading && products.length > 0 && (
            <div className="space-y-6">
              <div className="border-b border-zinc-800 pb-3 flex justify-between items-end">
                <div>
                  <h2 className="text-xl md:text-2xl font-playfair font-bold text-zinc-200">
                    Matches Found
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Showing products with highest visual similarity.
                  </p>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {products.length} matching items
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {!loading && products.length === 0 && file && !error && (
            <div className="text-center py-12 text-zinc-500 text-xs">
              No matching products found. Try uploading a clearer photo of a cosmetic item.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
