import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-playfair font-bold text-center mb-4">About Beauty Parlé</h1>
          <p className="text-muted-foreground text-center mb-8">Where Beauty Speaks Your Language</p>

          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              <strong>Beauty Parlé</strong> is your premium destination for cosmetics and beauty services. 
              We believe that beauty is universal, but it speaks differently to everyone — in your language, 
              for your unique style.
            </p>
            <p>
              From high-quality makeup products to professional salon services, we bring together the best 
              of beauty under one roof. Whether you're looking for the perfect lipstick shade or a complete 
              bridal makeover, our team is here to make you feel confident and beautiful.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-secondary/30 p-6 rounded-2xl text-center">
                <div className="text-4xl mb-2">🌿</div>
                <h3 className="font-bold">Premium Quality</h3>
                <p className="text-sm text-muted-foreground">Curated from the best brands</p>
              </div>
              <div className="bg-secondary/30 p-6 rounded-2xl text-center">
                <div className="text-4xl mb-2">🌍</div>
                <h3 className="font-bold">Multi-Language</h3>
                <p className="text-sm text-muted-foreground">Beauty in your mother tongue</p>
              </div>
              <div className="bg-secondary/30 p-6 rounded-2xl text-center">
                <div className="text-4xl mb-2">💖</div>
                <h3 className="font-bold">5,000+ Happy Clients</h3>
                <p className="text-sm text-muted-foreground">Trusted by beauty lovers</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
