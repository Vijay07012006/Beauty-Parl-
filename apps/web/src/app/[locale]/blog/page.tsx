'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Search, Calendar, Clock, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BlogPost {
  id: number;
  title: string;
  category: 'Skincare' | 'Makeup' | 'Haircare' | 'Wellness';
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  author: string;
  emoji: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'The Ultimate Guide to a 5-Step Skincare Routine',
    category: 'Skincare',
    excerpt: 'Discover the absolute essentials of a daily skincare routine for radiant, glowing skin. Perfect for beginners and beauty enthusiasts alike.',
    content: 'Achieving glowing, healthy skin doesn’t require a 10-step routine. By focusing on the essentials, you can protect your skin barrier and target specific concerns effectively. Here is our recommended 5-step daily skincare routine:\n\n1. Cleanse: Use a gentle, pH-balanced cleanser to wash away oil and impurities without stripping moisture.\n2. Tone: Apply a hydrating toner to prep your skin and balance pH levels.\n3. Treat: Use serums containing active ingredients (like Hyaluronic Acid for hydration or Vitamin C for brightening) tailored to your skin needs.\n4. Moisturize: Seal in hydration with a moisturizer suitable for your skin type (cream for dry skin, gel for oily/combination skin).\n5. Protect: Never skip sunscreen! Apply broad-spectrum SPF 30 or higher every single morning to prevent premature aging and sun damage.',
    date: 'August 8, 2026',
    readTime: '4 min read',
    author: 'Elena Rostova',
    emoji: '🌿'
  },
  {
    id: 2,
    title: '5 Simple Summer Makeup Tips to Avoid Melting Look',
    category: 'Makeup',
    excerpt: 'Keep your makeup fresh, matte, and stunning even in the heat of summer with these pro techniques.',
    content: 'When the temperature rises, heavy makeup can melt or crease. Here are five easy tips to make your summer makeup transfer-proof and long-lasting:\n\n1. Start with a Mattifying Primer: Apply primer to your T-zone to control oil secretion.\n2. Lighten Your Base: Swap full-coverage foundation for a lightweight tinted moisturizer or BB cream.\n3. Use Cream Formulas: Cream blushes and bronzers blend seamlessly and look more natural in warm weather.\n4. Lock it in with Powder: Focus loose translucent powder only on areas prone to shine (nose, chin, forehead).\n5. Setting Spray is Key: Finish with a mattifying setting spray to lock everything in place for hours.',
    date: 'August 5, 2026',
    readTime: '3 min read',
    author: 'Priya Sharma',
    emoji: '☀️'
  },
  {
    id: 3,
    title: 'How to Prevent Hair Breakage and Achieve Shiny Locks',
    category: 'Haircare',
    excerpt: 'Are you struggling with dry or frizzy hair? Try these simple changes to transform your hair health.',
    content: 'Hair breakage is often caused by heat styling, chemical treatments, and mechanical stress like rough brushing. To restore your hair’s natural shine and strength, follow these habits:\n\n1. Use a Wide-Tooth Comb: Detangle wet hair gently from ends to roots.\n2. Lower the Heat: Keep styling tools below 350°F (180°C) and always apply a heat protectant spray first.\n3. Deep Condition Weekly: Use a hair mask rich in nourishing oils (like argan or coconut oil) to deep-hydrate your strands.\n4. Sleep on Silk: Swap cotton pillowcases for silk or satin to reduce friction and breakage overnight.\n5. Trim Regularly: Cut split ends every 6-8 weeks to keep hair ends strong and prevent splitting upwards.',
    date: 'July 28, 2026',
    readTime: '5 min read',
    author: 'Sarah Jenkins',
    emoji: '💇‍♀️'
  },
  {
    id: 4,
    title: 'The Connection Between Gut Health and Skin Glow',
    category: 'Wellness',
    excerpt: 'What you eat directly impacts your skin. Learn how healing your gut can clear up acne and inflammation.',
    content: 'The "gut-skin connection" is a well-researched topic in modern dermatology. Inflammation in the digestive tract often translates directly to skin issues like acne, eczema, and dullness. To support a healthy gut microbiome for glowing skin:\n\n1. Eat Probiotics: Include yogurt, kefir, and kimchi in your diet to introduce healthy bacteria.\n2. Stay Hydrated: Water is essential for flushing toxins and supporting cellular health.\n3. Limit Refined Sugar: Sugar spikes insulin, which can lead to sebum overproduction and breakouts.\n4. Load up on Antioxidants: Berries, leafy greens, and nuts fight oxidative stress and support skin healing.',
    date: 'July 22, 2026',
    readTime: '4 min read',
    author: 'Dr. Anita Roy',
    emoji: '🥑'
  },
  {
    id: 5,
    title: 'Flawless Base: The Art of Color Correction',
    category: 'Makeup',
    excerpt: 'Say goodbye to dark circles and redness. Learn how to use green, peach, and purple concealers like a pro.',
    content: 'Color correction utilizes color theory to neutralize skin discolorations before applying foundation. Here is how to choose the right corrector for your concerns:\n\n- Green Neutralizes Red: Ideal for acne scars, rosacea, or broken capillaries.\n- Peach/Orange Neutralizes Blue/Purple: Great for covering under-eye circles on fair to medium skin tones.\n- Yellow Neutralizes Purple: Covers bruises or dark spots.\n- Lavender Neutralizes Yellow: Cancels out sallow, dull undertones for a brightening effect.\n\nAlways apply color correctors sparingly, blend thoroughly, and overlay with a skin-matching concealer or foundation.',
    date: 'July 15, 2026',
    readTime: '3 min read',
    author: 'Priya Sharma',
    emoji: '🎨'
  }
];

const categories = ['All', 'Skincare', 'Makeup', 'Haircare', 'Wellness'];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;

  // Filter posts
  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Paginated posts
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  return (
    <>
      <Header />
      <main className="min-h-screen py-16 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-4">
              Beauty & Wellness Blog
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Explore professional beauty tips, makeup guides, haircare hacks, and holistic wellness tutorials curated by our experts.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-thin">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => { setSelectedCategory(category); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                    (selectedCategory === category)
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-card border border-border hover:bg-secondary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
              />
            </div>
          </div>

          {/* Blog posts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {currentPosts.length > 0 ? (
              currentPosts.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {post.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} />
                        {post.readTime}
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      <span className="text-4xl p-3 bg-secondary/30 rounded-2xl flex-shrink-0">{post.emoji}</span>
                      <div className="space-y-1">
                        <h2 className="text-lg md:text-xl font-playfair font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar size={12} />
                          {post.date} &bull; By {post.author}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedPost(post)}
                    className="mt-6 flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition cursor-pointer select-none self-start"
                  >
                    <span>Read Article</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                No articles found. Try other keywords or categories.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
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
      </main>

      {/* Reader Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/50 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative scrollbar-thin"
            >
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 p-2 bg-secondary/50 rounded-full hover:bg-secondary transition cursor-pointer text-foreground"
                aria-label="Close reader"
              >
                <X size={18} />
              </button>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-[10px] font-bold uppercase">
                    {selectedPost.category}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} />
                    {selectedPost.readTime}
                  </span>
                </div>

                <div className="flex items-center gap-4 border-b border-border/40 pb-4">
                  <span className="text-5xl bg-secondary/40 p-4 rounded-3xl">{selectedPost.emoji}</span>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground">
                      {selectedPost.title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Calendar size={12} />
                      {selectedPost.date} &bull; Written by {selectedPost.author}
                    </p>
                  </div>
                </div>

                <div className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line space-y-4">
                  {selectedPost.content}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
