'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { Search, Star, Trash2, CheckCircle, HelpCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: number;
  productId: number;
  reviewerName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  product?: { name: string };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchReviews();
  }, [currentPage]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reviews/admin?page=${currentPage}&limit=${limit}`);
      setReviews(response.data.reviews || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load reviews list');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/reviews/admin/${id}/approve`);
      toast.success('Review approved successfully!');
      fetchReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve review');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await api.delete(`/reviews/admin/${id}`);
      toast.success('Review deleted successfully!');
      fetchReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const query = searchQuery.toLowerCase();
    return (
      review.reviewerName.toLowerCase().includes(query) ||
      review.comment.toLowerCase().includes(query) ||
      review.product?.name?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(total / limit);

  // Compute local quick statistics
  const avgLocalRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-foreground">Review Moderation</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage and moderate customer reviews and ratings.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-primary/10 text-primary rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Scanned</span>
              <h3 className="text-2xl font-bold text-foreground mt-0.5 font-mono">{total}</h3>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-xl">
              <Star className="w-6 h-6 fill-amber-500/20" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Page Avg Rating</span>
              <h3 className="text-2xl font-bold text-foreground mt-0.5 font-mono">{avgLocalRating} <span className="text-xs text-muted-foreground font-normal">/ 5</span></h3>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Approved on Page</span>
              <h3 className="text-2xl font-bold text-foreground mt-0.5 font-mono">
                {reviews.filter(r => r.isApproved).length}
              </h3>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md bg-card rounded-2xl shadow-sm border border-border/50">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by reviewer, comment, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-transparent border-0 focus:ring-0 focus:outline-none text-sm text-foreground"
          />
        </div>

        {/* Table/Cards container */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Loading reviews queue...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No reviews found.</div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/10 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="p-4">Reviewer</th>
                      <th className="p-4">Rating</th>
                      <th className="p-4">Comment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Created At</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 text-sm">
                    {filteredReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-secondary/5 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-foreground">{review.reviewerName}</div>
                          {review.product?.name && (
                            <div className="text-[10px] text-primary font-bold mt-0.5 max-w-xs truncate">{review.product.name}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`w-3.5 h-3.5 ${idx < review.rating ? 'text-amber-500 fill-amber-500' : 'text-border'}`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="line-clamp-2 text-muted-foreground">{review.comment}</p>
                        </td>
                        <td className="p-4">
                          {review.isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {!review.isApproved && (
                            <button
                              onClick={() => handleApprove(review.id)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-border/30">
                {filteredReviews.map((review) => (
                  <div key={review.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-foreground">{review.reviewerName}</div>
                        {review.product?.name && (
                          <div className="text-[10px] text-primary font-bold mt-0.5 max-w-[200px] truncate">{review.product.name}</div>
                        )}
                      </div>
                      {review.isApproved ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3.5 h-3.5 ${idx < review.rating ? 'text-amber-500 fill-amber-500' : 'text-border'}`}
                        />
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <div className="text-[10px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      {!review.isApproved && (
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 border border-border rounded-xl text-xs font-semibold bg-card disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 border border-border rounded-xl text-xs font-semibold bg-card disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
