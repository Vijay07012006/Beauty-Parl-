import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ShippingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-16 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-sm space-y-8">
            <div className="border-b border-border/40 pb-6">
              <h1 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-2">Shipping Policy</h1>
              <p className="text-xs text-muted-foreground">Learn about our shipping rates, delivery timelines, and logistics partners.</p>
            </div>

            <div className="space-y-6 text-sm md:text-base text-muted-foreground leading-relaxed">
              <p>
                At <strong>Beauty Parlé</strong>, we aim to deliver your favorite cosmetics and skincare products quickly and securely. Below is everything you need to know about our shipping practices.
              </p>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">Shipping Rates & Estimates</h2>
                <p>
                  Shipping costs and delivery timelines depend on your order value and chosen delivery method:
                </p>
                <div className="overflow-x-auto border border-border/50 rounded-xl mt-4">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-secondary/40 text-foreground font-semibold">
                        <th className="p-3 border-b border-border/50">Shipping Method</th>
                        <th className="p-3 border-b border-border/50">Order Value</th>
                        <th className="p-3 border-b border-border/50">Cost</th>
                        <th className="p-3 border-b border-border/50">Delivery Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      <tr>
                        <td className="p-3 font-semibold">Standard Shipping</td>
                        <td className="p-3">Under $50</td>
                        <td className="p-3">$5.00</td>
                        <td className="p-3">3-5 Business Days</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Standard Shipping</td>
                        <td className="p-3">Over $50</td>
                        <td className="p-3 text-emerald-600 font-semibold">FREE</td>
                        <td className="p-3">3-5 Business Days</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Express Shipping</td>
                        <td className="p-3">Any Value</td>
                        <td className="p-3">$12.00</td>
                        <td className="p-3">1-2 Business Days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">Processing Time</h2>
                <p>
                  All orders are processed within 1-2 business days (excluding Sundays and national holidays). If we experience a high volume of orders, shipments may be slightly delayed. In case of significant delays, we will notify you via email or SMS.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">Shipment Confirmation & Tracking</h2>
                <p>
                  You will receive a shipment confirmation email containing your tracking number(s) once your order has shipped. The tracking number will be active within 24 hours of shipment generation.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">Damages & Issues</h2>
                <p>
                  Beauty Parlé is not liable for products damaged or lost during shipping. However, customer satisfaction is our top priority. If you receive your order damaged, please save all packaging materials and damaged goods, capture photos, and contact our support team immediately so we can help resolve the issue.
                </p>
              </section>

              <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground">
                <p>If you have any questions regarding your shipment, please reach out to us at shipping@beautyparle.com.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
