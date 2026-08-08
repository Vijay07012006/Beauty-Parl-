'use client';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: number;
}

export function RatingStars({ rating, count, size = 16 }: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.25 && rating % 1 < 0.75;
  const roundedRating = Math.round(rating * 2) / 2;

  return (
    <div className="flex items-center gap-1.5 text-amber-500 select-none">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, idx) => {
          const val = idx + 1;
          let fill = 'none';
          if (val <= fullStars) fill = 'currentColor';
          else if (val === fullStars + 1 && hasHalf) fill = 'url(#half-star)';
          else if (val === fullStars + 1 && rating % 1 >= 0.75) fill = 'currentColor';

          return (
            <svg
              key={idx}
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={fill}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <defs>
                <linearGradient id="half-star">
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                </linearGradient>
              </defs>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          );
        })}
      </div>
      {rating > 0 && <span className="text-xs font-semibold text-foreground/80">{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}
