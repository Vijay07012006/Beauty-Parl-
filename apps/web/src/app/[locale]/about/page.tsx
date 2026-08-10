import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Target, Eye, ShieldCheck, Heart, Award, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-16 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-5xl space-y-16">
          
          {/* Hero Section */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">
              About Beauty Parlé
            </h1>
            <p className="text-primary font-semibold text-lg uppercase tracking-wider font-mono">
              Where Beauty Speaks Your Language
            </p>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              We build premium cosmetics and wellness routines that recognize and adapt to your unique voice, language, and culture.
            </p>
          </div>

          {/* Brand Story Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-sm">
            <div className="space-y-6">
              <h2 className="text-3xl font-playfair font-bold text-foreground">Our Story</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Founded in 2024, Beauty Parlé emerged from a simple observation: the beauty industry is global, but personalization is local. Beauty is personal, but we often struggle with instructions, labels, and routines that feel disconnected from our native languages and regional skin profiles.
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                We set out to create a translation-first, AI-driven cosmetics hub. Combining advanced dermatological research with localized regional support, we ensure that whether you are searching in English, Hindi, Tamil, or Bengali, your beauty journey is intuitive, culturally inclusive, and entirely transparent.
              </p>
            </div>
            <div className="bg-secondary/30 rounded-3xl p-8 flex flex-col justify-center items-center text-center space-y-4 relative overflow-hidden h-80">
              <span className="text-6xl text-primary drop-shadow-sm select-none">💄</span>
              <h3 className="text-xl font-playfair font-bold text-foreground">Premium Localized Cosmetics</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Empowering beauty enthusiasts across the country with access to products explained in their mother tongue.
              </p>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-2xl" />
            </div>
          </div>

          {/* Mission, Vision, Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-4 hover:border-primary/30 transition-colors duration-300">
              <div className="p-3 bg-primary/10 w-fit rounded-2xl text-primary">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-playfair font-bold text-foreground">Our Mission</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                To break linguistic barriers in the cosmetics industry, providing accessible skincare consultations and premium clean-beauty products to every household in their language of choice.
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-4 hover:border-primary/30 transition-colors duration-300">
              <div className="p-3 bg-primary/10 w-fit rounded-2xl text-primary">
                <Eye size={24} />
              </div>
              <h3 className="text-xl font-playfair font-bold text-foreground">Our Vision</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                To become the world's most inclusive beauty ecosystem, where generative AI and clean chemistry blend to deliver hyper-personalized routines to individuals globally.
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-4 hover:border-primary/30 transition-colors duration-300">
              <div className="p-3 bg-primary/10 w-fit rounded-2xl text-primary">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-playfair font-bold text-foreground">Our Values</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Integrity, chemical transparency, and extreme inclusivity. We guarantee 100% cruelty-free sourcing, recyclable packaging, and complete scientific verification for every single formulation.
              </p>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-center mb-8">Beauty Parlé in Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-border/50">
              <div className="space-y-2 py-4 md:py-0">
                <p className="text-3xl md:text-4xl font-bold text-primary font-mono">10+</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Languages Supported</p>
              </div>
              <div className="space-y-2 py-4 md:py-0">
                <p className="text-3xl md:text-4xl font-bold text-primary font-mono">50K+</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Happy Customers</p>
              </div>
              <div className="space-y-2 py-4 md:py-0">
                <p className="text-3xl md:text-4xl font-bold text-primary font-mono">100%</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Cruelty-Free Products</p>
              </div>
              <div className="space-y-2 py-4 md:py-0">
                <p className="text-3xl md:text-4xl font-bold text-primary font-mono">4.8★</p>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Average Customer Rating</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
