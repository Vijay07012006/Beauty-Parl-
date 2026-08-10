import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-16 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-sm space-y-8">
            <div className="border-b border-border/40 pb-6">
              <h1 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-2">Returns & Refunds Policy</h1>
              <p className="text-xs text-muted-foreground">Find out about our returns conditions, timelines, and refund steps.</p>
            </div>

            <div className="space-y-6 text-sm md:text-base text-muted-foreground leading-relaxed">
              <p>
                At <strong>Beauty Parlé</strong>, we want you to love your purchases. If you are not completely satisfied with your order, we are here to help you with your return or refund.
              </p>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">1. Return Timeline & Eligibility</h2>
                <p>
                  You have <strong>15 days</strong> from the date of delivery to return any eligible item.
                </p>
                <p>
                  To be eligible for a return:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Items must be unopened, unused, and in their original packaging with all seals intact.</li>
                  <li>Due to health and hygiene guidelines, opened cosmetics, skincare, and personal care products cannot be returned unless they arrived damaged or defective.</li>
                  <li>Sales items and promotional gifts are not eligible for returns.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">2. Step-by-Step Return Process</h2>
                <p>
                  Returning items is simple:
                </p>
                <ol className="list-decimal pl-6 space-y-3">
                  <li>
                    <strong>Request a Return:</strong> Send an email to returns@beautyparle.com with your Order ID, names of items you wish to return, and the reason for the return.
                  </li>
                  <li>
                    <strong>Package the Items:</strong> Securely wrap items in their original packaging to avoid any transit damages.
                  </li>
                  <li>
                    <strong>Pickup & Transit:</strong> Our courier partners will schedule a reverse pickup from your shipping address within 2-3 business days.
                  </li>
                  <li>
                    <strong>Inspection & Approval:</strong> Once we receive the returned package, our quality assurance team will inspect the item(s) and approve the refund.
                  </li>
                </ol>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">3. Refunds Policy</h2>
                <p>
                  Once approved, your refund will be processed immediately:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Prepaid Orders:</strong> Refund will be credited back to your original payment bank account, credit card, or UPI wallet within 5-7 business days.</li>
                  <li><strong>Cash on Delivery (COD) Orders:</strong> We will request your bank account details or UPI ID and transfer the refund amount within 7 business days.</li>
                  <li>Alternatively, you can opt for <strong>Store Credit</strong>, which is issued instantly as a voucher code and can be used on any future purchase.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">4. Exchanges</h2>
                <p>
                  We only replace items if they are defective or damaged. If you need to exchange an item for the same product, send us an email at returns@beautyparle.com and we will organize an exchange delivery for you free of cost.
                </p>
              </section>

              <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground">
                <p>If you need any assistance regarding returns and refunds, please contact us at returns@beautyparle.com.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
