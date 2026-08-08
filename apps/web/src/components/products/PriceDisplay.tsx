'use client';

interface PriceDisplayProps {
  price: number;
  mrp?: number;
  discountPercent?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceDisplay({ price, mrp, discountPercent, size = 'md' }: PriceDisplayProps) {
  const showMrp = mrp && mrp > price && discountPercent && discountPercent > 0;

  const priceSizes = {
    sm: 'text-sm font-bold',
    md: 'text-lg font-bold',
    lg: 'text-3xl font-bold'
  };

  const mrpSizes = {
    sm: 'text-xs line-through text-muted-foreground',
    md: 'text-sm line-through text-muted-foreground',
    lg: 'text-lg line-through text-muted-foreground'
  };

  return (
    <div className="flex items-baseline gap-2">
      <span className={`${priceSizes[size]} text-primary`}>
        ${Number(price).toFixed(2)}
      </span>
      {showMrp && (
        <>
          <span className={mrpSizes[size]}>
            ${Number(mrp).toFixed(2)}
          </span>
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            {discountPercent}% OFF
          </span>
        </>
      )}
    </div>
  );
}
