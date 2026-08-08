'use client';

import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  max = 5,
  size = 18,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const displayRating = interactive ? (hovered || rating) : rating;

  return (
    <div className="flex gap-0.5" role={interactive ? 'radiogroup' : undefined}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const filled = star <= displayRating;
        const halfFilled = !filled && star - 0.5 <= displayRating;
        return (
          <button
            key={star}
            type="button"
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? star === rating : undefined}
            aria-label={interactive ? `Rate ${star} out of ${max}` : undefined}
            disabled={!interactive}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => interactive && onRatingChange?.(star)}
            className={interactive ? 'cursor-pointer focus:outline-none transition-transform hover:scale-110 active:scale-95' : 'cursor-default'}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={filled ? '#FBBF24' : halfFilled ? 'url(#half)' : 'none'}
              stroke={filled || halfFilled ? '#FBBF24' : '#D1D5DB'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {halfFilled && (
                <defs>
                  <linearGradient id="half">
                    <stop offset="50%" stopColor="#FBBF24" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              )}
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
