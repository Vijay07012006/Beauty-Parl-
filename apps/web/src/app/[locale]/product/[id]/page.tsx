'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { ProductZoom } from '@/components/products/ProductZoom';
import { PriceDisplay } from '@/components/products/PriceDisplay';
import { RatingStars } from '@/components/products/RatingStars';
import { DeliveryChecker } from '@/components/products/DeliveryChecker';
import { WishlistButton } from '@/components/products/WishlistButton';
import { ProductCard } from '@/components/products/ProductCard';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  brand?: string;
  description: string;
  price: number;
  mrp?: number;
  discountPercent?: number;
  image: string;
  category: string;
  stock: number;
  rating?: number;
  ratingCount?: number;
}

interface Review {
  id: number;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'how-to' | 'reviews'>('desc');

  // Variant selector
  const [selectedVariant, setSelectedVariant] = useState('Standard');

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Similar Products state
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  const { addItem } = useCartStore();

  const fetchProductData = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);

      // Fetch reviews
      const reviewsRes = await api.get(`/products/${id}/reviews`);
      setReviews(reviewsRes.data || []);

      // Fetch similar products
      if (res.data?.category) {
        const similarRes = await api.get('/products', {
          params: { limit: 4, category: res.data.category }
        });
        const items = similarRes.data?.products || similarRes.data?.data || similarRes.data || [];
        const itemsArray = Array.isArray(items) ? items : [];
        setSimilarProducts(itemsArray.filter((item: Product) => item.id !== res.data.id).slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to load product detail', err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
      maxStock: product.stock,
      quantity,
    });
    toast.success(`🛒 Added ${quantity} of ${product.name} to cart!`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    handleAddToCart();
    router.push('/en/cart');
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reviewName.trim() || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await api.post(`/products/${id}/reviews`, {
        reviewerName: reviewName,
        rating: reviewRating,
        comment: reviewComment
      });
      toast.success('Thank you for your review!');
      setReviewName('');
      setReviewComment('');
      // Reload product data to get updated rating and review list
      fetchProductData();
    } catch (err) {
      toast.error('Failed to post review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Loading details...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground text-lg">Product not found</p>
            <button
              onClick={() => router.push('/en/products')}
              className="px-6 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors"
            >
              Back to Catalog
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // shade variants placeholder
  const variants = ['Standard', 'Rose Glow', 'Berry Kiss', 'Peach Satin'];

  return (
    <>
      <Header />
      <main className="min-h-screen py-10 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-6xl space-y-12">
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-card p-6 md:p-8 rounded-3xl border border-border/50 shadow-sm relative">
            {/* Wishlist Heart Overlay */}
            <div className="absolute top-6 right-6 z-10">
              <WishlistButton
                item={{
                  id: product.id,
                  name: product.name,
                  price: Number(product.price),
                  mrp: product.mrp ? Number(product.mrp) : undefined,
                  discountPercent: product.discountPercent,
                  image: product.image,
                  rating: product.rating,
                  ratingCount: product.ratingCount,
                  stock: product.stock
                }}
              />
            </div>

            {/* Product Image Section */}
            <div className="space-y-4">
              <div className="aspect-square w-full max-w-[500px] mx-auto relative rounded-3xl overflow-hidden shadow-sm">
                <ProductZoom src={product.image || '/images/products/makeup.webp'} alt={product.name} />
              </div>
              
              {/* Thumbs carousel */}
              <div className="flex gap-3 justify-center">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`relative w-16 h-16 rounded-xl border overflow-hidden cursor-pointer ${
                      idx === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Image
                      src={product.image || '/images/products/makeup.webp'}
                      alt={`${product.name} thumb ${idx}`}
                      fill
                      sizes="64px"
                      className="object-cover opacity-80 hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Brand and category */}
              <div className="space-y-1">
                {product.brand && (
                  <span className="text-xs font-bold tracking-wider text-primary uppercase">
                    {product.brand}
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-playfair font-bold leading-tight">
                  {product.name}
                </h1>
                <p className="text-xs text-muted-foreground font-semibold">
                  Category: {product.category}
                </p>
              </div>

              {/* Rating stars display */}
              {product.rating !== undefined && (
                <div className="flex items-center gap-3">
                  <RatingStars rating={product.rating} count={product.ratingCount} size={18} />
                  <span className="text-xs text-muted-foreground border-l border-border/70 pl-3">
                    {reviews.length} Verified Buyer Reviews
                  </span>
                </div>
              )}

              {/* Price display */}
              <PriceDisplay
                price={product.price}
                mrp={product.mrp}
                discountPercent={product.discountPercent}
                size="lg"
              />

              <hr className="border-border/50" />

              {/* Shade/Variant Selectors */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Variant</span>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedVariant === v
                          ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/25'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity selector & Stock */}
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Quantity</span>
                  <div className="flex items-center gap-2 border border-border rounded-full p-1 w-fit bg-background">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={product.stock <= 0}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary font-bold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-semibold select-none">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={product.stock <= 0}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary font-bold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1 pt-4">
                  <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/95 transition-all shadow-md shadow-primary/20 active:scale-95 disabled:opacity-50 cursor-pointer select-none"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="flex-1 py-4 bg-accent text-white font-bold rounded-full hover:bg-accent/95 transition-all shadow-md shadow-accent/20 active:scale-95 disabled:opacity-50 cursor-pointer select-none"
                >
                  Buy Now
                </button>
              </div>

              <hr className="border-border/50" />

              {/* Pincode checker */}
              <DeliveryChecker />
            </div>
          </div>

          {/* Description & Reviews Tabs Section */}
          <div className="bg-card rounded-3xl border border-border/50 p-6 md:p-8 shadow-sm">
            {/* Tabs Header */}
            <div className="flex border-b border-border/50 overflow-x-auto gap-4 md:gap-8 pb-3">
              {(['desc', 'ingredients', 'how-to', 'reviews'] as const).map((tab) => {
                const labels = {
                  desc: 'Description',
                  ingredients: 'Ingredients',
                  'how-to': 'How to Use',
                  reviews: `Reviews (${reviews.length})`
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 text-sm font-semibold transition-all relative whitespace-nowrap cursor-pointer ${
                      activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {labels[tab]}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tabs Content */}
            <div className="py-6">
              {activeTab === 'desc' && (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
                  <h4 className="text-sm font-semibold">Key Highlights</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Nourishes and balances natural skin texture</li>
                    <li>Clinically and dermatologically tested</li>
                    <li>Cruelty-free and formulated with clean botanical extracts</li>
                  </ul>
                </div>
              )}

              {activeTab === 'ingredients' && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Organic floral distillates, Hyaluronic acid, Coconut fruit oil, Shea butter, Aloe barbadensis, Rosehip extract, Vitamin C, Essential oil fragrance blends.
                  </p>
                  <p className="text-xs text-muted-foreground/70 italic">
                    Ingredients are updated periodically. Please check packaging for most accurate listing.
                  </p>
                </div>
              )}

              {activeTab === 'how-to' && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    1. Dispense a small amount onto fingertips or applicator.<br />
                    2. Apply evenly onto lips, hair, or pre-cleansed face area.<br />
                    3. Blend or massage gently in circular outward motions.<br />
                    4. Layer as desired to build product coverage or intensity.
                  </p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-8">
                  {/* Reviews Stats block */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-secondary/15 p-6 rounded-2xl border border-border/50">
                    <div className="text-center space-y-1">
                      <span className="text-4xl font-extrabold text-foreground">{(product.rating ?? 4.5).toFixed(1)}</span>
                      <div className="flex justify-center">
                        <RatingStars rating={product.rating ?? 4.5} />
                      </div>
                      <span className="text-xs text-muted-foreground">Product Rating Summary</span>
                    </div>

                    <div className="md:col-span-2 space-y-2 border-t md:border-t-0 md:border-l border-border/70 pt-4 md:pt-0 md:pl-6">
                      <h4 className="text-sm font-bold mb-3">Add Your Verified Review</h4>
                      <form onSubmit={handlePostReview} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          placeholder="Your Name"
                          className="px-3 py-2 rounded-xl border border-input text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(parseInt(e.target.value, 10))}
                          className="px-3 py-2 rounded-xl border border-input text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                        >
                          <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                          <option value="4">⭐⭐⭐⭐ (4/5)</option>
                          <option value="3">⭐⭐⭐ (3/5)</option>
                          <option value="2">⭐⭐ (2/5)</option>
                          <option value="1">⭐ (1/5)</option>
                        </select>
                        <textarea
                          required
                          rows={2}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Write comments here..."
                          className="md:col-span-2 px-3 py-2 rounded-xl border border-input text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="md:col-span-2 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Reviews List */}
                  {reviews.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground text-sm">No reviews yet. Be the first to share your thoughts!</p>
                  ) : (
                    <div className="space-y-4 divide-y divide-border/40">
                      {reviews.map((rev) => (
                        <div key={rev.id} className="pt-4 first:pt-0 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-sm">{rev.reviewerName}</h5>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <RatingStars rating={rev.rating} size={12} />
                          <p className="text-xs text-muted-foreground leading-relaxed">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Products Slider */}
          {similarProducts.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-playfair flex items-center gap-2">
                <span>🛍️</span> Customers Also Bought
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {similarProducts.map((simProd) => (
                  <ProductCard key={simProd.id} product={simProd} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
