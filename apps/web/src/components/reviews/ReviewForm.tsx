'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { StarRating } from '@/components/ui/StarRating';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ReviewFormProps {
  productId: number;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user } = useAuthStore();

  const [rating, setRating] = useState(0);
  const [reviewerName, setReviewerName] = useState(user?.name || '');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating before submitting.');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a comment before submitting.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/products/${productId}/reviews`, {
        reviewerName: reviewerName.trim() || 'Anonymous',
        rating,
        comment: comment.trim(),
      });
      toast.success('✅ Review submitted! Thank you for your feedback.');
      setRating(0);
      setComment('');
      setSubmitted(true);
      onReviewSubmitted?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2"
      >
        <span className="text-3xl">✅</span>
        <h4 className="font-semibold text-green-800">Review Submitted!</h4>
        <p className="text-green-700 text-sm">Your feedback helps other shoppers. Thank you!</p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-xs text-green-600 underline hover:text-green-800"
        >
          Write another review
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-card border border-border/50 rounded-2xl p-6 space-y-5"
    >
      <h3 className="text-lg font-playfair font-bold text-foreground">Write a Review</h3>

      {/* Star selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <StarRating
            rating={rating}
            size={28}
            interactive
            onRatingChange={setRating}
          />
          {rating > 0 && (
            <span className="text-sm font-semibold text-primary">
              {['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your Name
        </label>
        <input
          type="text"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder={user?.name || 'Anonymous'}
          className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Review <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </motion.form>
  );
}
