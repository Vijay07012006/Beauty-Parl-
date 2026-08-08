'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { api } from '@/lib/api';

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({ initialQuery = '', onSearch }: SearchBarProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 1) {
      const delay = setTimeout(() => {
        fetchSuggestions();
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products?search=${query}&limit=5`);
      setSuggestions(response.data.products || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      if (onSearch) {
        onSearch(query);
      } else {
        router.push(`/${locale}/products?search=${encodeURIComponent(query)}`);
      }
    }
  };

  const handleSuggestionClick = (productId: number) => {
    setShowSuggestions(false);
    router.push(`/${locale}/product/${productId}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none placeholder:text-muted-foreground text-sm transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="ml-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/95 transition font-semibold text-sm cursor-pointer select-none"
        >
          Search
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {suggestions.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSuggestionClick(product.id)}
              className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition flex items-center gap-3 border-b border-border/30 last:border-0 cursor-pointer"
            >
              <div className="w-10 h-10 bg-secondary/20 rounded-lg overflow-hidden flex-shrink-0 relative">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">💄</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
                <p className="text-xs text-primary font-bold">${Number(product.price).toFixed(2)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
