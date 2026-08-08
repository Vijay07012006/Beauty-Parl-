'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarRating } from '@/components/ui/StarRating';
import { api } from '@/lib/api';

interface Review {
  id: number;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewListProps {
  productId: number;
  refreshTrigger?: number;
}

export function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        api.get(`/products/${productId}/reviews`),
        api.get(`/products/${productId}/reviews/stats`),
      ]);
      setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
      setStats(statsRes.data || { average: 0, count: 0 });
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // Distribution of ratings (1-5 star bars)
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0 ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-secondary/30 rounded-2xl h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="bg-secondary/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start">
          {/* Big score */}
          <div className="text-center shrink-0">
            <div className="text-5xl font-extrabold text-foreground leading-none">
              {stats.average.toFixed(1)}
            </div>
            <StarRating rating={Math.round(stats.average)} size={18} />
            <p className="text-xs text-muted-foreground mt-1">{stats.count} review{stats.count !== 1 ? 's' : ''}</p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 w-full space-y-1.5">
            {distribution.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground shrink-0">{star}</span>
                <span className="text-yellow-400">★</span>
                <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-yellow-400 rounded-full"
                  />
                </div>
                <span className="w-6 text-right text-muted-foreground shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <span className="text-3xl mb-2 block">💬</span>
          <p className="text-sm">No reviews yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border/50 rounded-2xl p-5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {(review.reviewerName || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{review.reviewerName || 'Anonymous'}</p>
                        <StarRating rating={review.rating} size={13} />
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
