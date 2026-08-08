'use client';

import { RatingStars } from './RatingStars';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  selectedRating: number;
  onRatingChange: (val: number) => void;
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  onClear: () => void;
}

const categories = [
  'all',
  'Makeup',
  'Skincare',
  'Haircare',
  'Fragrance',
  'Tools & Brushes',
  'Bath & Body',
  'Men\'s Grooming',
  'Natural & Organic',
  'Luxury Collection',
  'Accessories'
];

const brands = [
  'all',
  'MAC',
  'Maybelline',
  "L'Oreal",
  'NARS',
  'Fenty Beauty',
  'Dior',
  'The Ordinary',
  'Neutrogena',
  'CeraVe',
  'Olay',
  'COSRX',
  'Jack Black',
  'Herbivore',
  'Sigma',
  'Real Techniques',
  'Briogeo',
  'Redken'
];

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  selectedRating,
  onRatingChange,
  selectedBrand,
  onBrandChange,
  onClear
}: CategoryFilterProps) {
  return (
    <div className="bg-card p-6 rounded-3xl border border-border/50 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Filters</h3>
        <button
          onClick={onClear}
          className="text-xs font-bold text-primary hover:underline cursor-pointer"
        >
          Clear All
        </button>
      </div>

      <hr className="border-border/50" />

      {/* Category List */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</h4>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`text-left px-3 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-border/50" />

      {/* Brand Selector */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brands</h4>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => onBrandChange(brand)}
              className={`text-left px-3 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                selectedBrand.toLowerCase() === brand.toLowerCase()
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-border/50" />

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Range</h4>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-input text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-input text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      <hr className="border-border/50" />

      {/* Rating Filter */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rating Threshold</h4>
        <div className="flex flex-col gap-2">
          {[4, 3, 2].map((num) => (
            <button
              key={num}
              onClick={() => onRatingChange(num)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                selectedRating === num
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <RatingStars rating={num} />
              <span className="text-xs text-muted-foreground">& Up</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
