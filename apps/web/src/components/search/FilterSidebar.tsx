'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';

interface FilterSidebarProps {
  categories: string[];
  onFilterChange: (filters: any) => void;
}

export function FilterSidebar({ categories, onFilterChange }: FilterSidebarProps) {
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [expanded, setExpanded] = useState({ category: true, price: true, rating: true });

  // Sync state with URL params on load
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setMinRating(searchParams.get('minRating') || '');
    setSort(searchParams.get('sort') || 'newest');
  }, [searchParams]);

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const applyFilters = () => {
    const filters: any = {};
    if (selectedCategory) filters.category = selectedCategory;
    if (minPrice) filters.minPrice = minPrice;
    if (maxPrice) filters.maxPrice = maxPrice;
    if (minRating) filters.minRating = minRating;
    if (sort) filters.sort = sort;
    onFilterChange(filters);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setSort('newest');
    onFilterChange({});
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-6 shadow-sm sticky top-24">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h3 className="font-playfair font-bold text-lg text-foreground">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full text-sm font-bold text-foreground focus:outline-none cursor-pointer"
        >
          Category
          {expanded.category ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded.category && (
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedCategory('')}
              className={`w-full text-left px-3 py-1.5 text-xs rounded-xl transition-all cursor-pointer ${
                !selectedCategory
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-xl transition-all cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <hr className="border-border/30" />

      {/* Price Range Filter */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-sm font-bold text-foreground focus:outline-none cursor-pointer"
        >
          Price Range
          {expanded.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded.price && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
            />
            <span className="text-muted-foreground text-xs font-semibold">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
            />
          </div>
        )}
      </div>

      <hr className="border-border/30" />

      {/* Rating Filter */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full text-sm font-bold text-foreground focus:outline-none cursor-pointer"
        >
          Minimum Rating
          {expanded.rating ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded.rating && (
          <div className="space-y-1 pt-1">
            {[4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setMinRating(String(rating))}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  Number(minRating) === rating
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Star size={12} className={Number(minRating) === rating ? 'fill-primary' : 'fill-none'} />
                <span>{rating}+ Star{rating > 1 ? 's' : ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <hr className="border-border/30" />

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground block">Sort By</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none cursor-pointer"
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating-desc">Top Rated</option>
        </select>
      </div>

      {/* Apply Filters Button */}
      <button
        onClick={applyFilters}
        className="w-full py-3 bg-primary text-white rounded-full font-semibold text-xs hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
      >
        Apply Filters
      </button>
    </div>
  );
}
