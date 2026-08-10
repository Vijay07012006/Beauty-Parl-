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
import { RecommendationsSection } from '@/components/products/RecommendationsSection';
import { RecentlyViewed } from '@/components/recently-viewed/RecentlyViewed';
import { SocialShare } from '@/components/social/SocialShare';
import { UgcGallery } from '@/components/ugc/UgcGallery';
import { toast } from 'sonner';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewList } from '@/components/reviews/ReviewList';

// Phase 5C imports
import { TikTokShopButton } from '@/components/products/TikTokShopButton';
import { BundleCard } from '@/components/products/BundleCard';

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

interface ProductTag {
  id: number;
  name: string;
  icon?: string;
  category?: string;
}

interface Bundle {
  id: number;
  name: string;
  description?: string;
  discountPercentage?: number;
  originalTotal: number;
  finalTotal: number;
  discountValue: number;
  products: any[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const locale = (params?.locale as string) || 'en';

  const [product, setProduct] = useState<Product | null>(null);
  const [productTags, setProductTags] = useState<ProductTag[]>([]);
  const [recommendedBundles, setRecommendedBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'how-to' | 'reviews'>('desc');

  // Variant selector
  const [selectedVariant, setSelectedVariant] = useState('Standard');

  // Reviews state
  const [reviewRefresh, setReviewRefresh] = useState(0);

  const { addItem } = useCartStore();

  const fetchProductData = async () => {
    if (!id) return;
    try {
      const [prodRes, tagsRes, bundlesRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/product-tags/product/${id}`).catch(() => ({ data: [] })),
        api.get(`/bundles/recommended?cart_ids=${id}`).catch(() => ({ data: [] })),
      ]);

      setProduct(prodRes.data);
      setProductTags(tagsRes.data);
      setRecommendedBundles(bundlesRes.data);

      // Trigger review list to load fresh data
      setReviewRefresh(Date.now());
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
    router.push(`/${locale}/cart`);
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
              onClick={() => router.push(`/${locale}/products`)}
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
                <div className="flex flex-col gap-2 pt-1">
                  <p className="text-xs text-muted-foreground font-semibold">
                    Category: {product.category}
                  </p>
                  
                  {/* Clean Beauty Tag Badges */}
                  {productTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {productTags.map((tag) => (
                        <span 
                          key={tag.id} 
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100/50 shadow-sm"
                        >
                          {tag.icon && <span>{tag.icon}</span>}
                          <span>{tag.name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rating stars display */}
              {product.rating !== undefined && (
                <div className="flex items-center gap-3">
                  <RatingStars rating={product.rating} count={product.ratingCount} size={18} />
                  <span className="text-xs text-muted-foreground border-l border-border/70 pl-3">
                    {product.ratingCount || 0} Verified Buyer Reviews
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

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-[10px] font-bold text-amber-700">
                ⭐ Earn {Math.round(Number(product.price) * 0.1)} loyalty points on this purchase!
              </div>

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

              {/* TikTok Shop Integration */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Also Available on TikTok</span>
                <TikTokShopButton />
              </div>

              <hr className="border-border/50" />

              {/* Social sharing widget */}
              <SocialShare
                productId={product.id}
                productName={product.name}
                productPrice={Number(product.price)}
                productImage={product.image}
              />

              <hr className="border-border/50" />

              {/* Pincode checker */}
              <DeliveryChecker />
            </div>
          </div>

          {/* Buy Together & Save (Bundles) */}
          {recommendedBundles.length > 0 && (
            <div className="space-y-6">
              <h3 className="font-playfair font-bold text-2xl tracking-tight">Buy Together & Save</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedBundles.map((bundle) => (
                  <BundleCard key={bundle.id} bundle={bundle} />
                ))}
              </div>
            </div>
          )}

          {/* Description & Reviews Tabs Section */}
          <div className="bg-card rounded-3xl border border-border/50 p-6 md:p-8 shadow-sm">
            {/* Tabs Header */}
            <div className="flex border-b border-border/50 overflow-x-auto gap-4 md:gap-8 pb-3">
              {(['desc', 'ingredients', 'how-to', 'reviews'] as const).map((tab) => {
                const labels = {
                  desc: 'Description',
                  ingredients: 'Ingredients',
                  'how-to': 'How to Use',
                  reviews: `Reviews (${product.ratingCount || 0})`
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
                  <ReviewForm
                    productId={product.id}
                    onReviewSubmitted={() => setReviewRefresh(Date.now())}
                  />
                  <ReviewList
                    productId={product.id}
                    refreshTrigger={reviewRefresh}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Customer Lookbook UGC Gallery */}
          <UgcGallery productId={product.id} />

          {/* AI Product Recommendations */}
          <RecommendationsSection type="also-bought" productId={product.id} limit={4} />

          {/* Recently Viewed Tracking & Carousel */}
          <RecentlyViewed productId={product.id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
