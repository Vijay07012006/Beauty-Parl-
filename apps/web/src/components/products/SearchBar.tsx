'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';

interface SearchResult {
  id: number;
  name: string;
  brand?: string;
  image?: string;
}

export function SearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced suggestion fetcher
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get(`/products`, {
          params: { limit: 5, search: query }
        });
        const items = response.data?.products || response.data?.data || response.data || [];
        setSuggestions(Array.isArray(items) ? items.slice(0, 5) : []);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/en/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg mx-auto">
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search premium cosmetics, skincare..."
          className="w-full pl-12 pr-16 py-3.5 rounded-full border border-border bg-card/85 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm shadow-sm transition-all"
        />
        {/* Search Icon */}
        <span className="absolute left-4 text-muted-foreground select-none pointer-events-none text-lg">
          🔍
        </span>
        {/* Clear/Submit indicators */}
        <div className="absolute right-3 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground text-xs cursor-pointer select-none"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-bold bg-primary text-white rounded-full hover:bg-primary/90 transition-colors cursor-pointer select-none"
          >
            Search
          </button>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (suggestions.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl border border-border/60 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          {loading && (
            <div className="p-3 text-xs text-muted-foreground text-center">
              Searching...
            </div>
          )}
          <div className="divide-y divide-border/40">
            {suggestions.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/en/product/${item.id}`);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/40 text-left transition-colors cursor-pointer"
              >
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary/20 flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">💄</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {item.name}
                  </p>
                  {item.brand && (
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {item.brand}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
