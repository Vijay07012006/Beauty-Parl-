import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-16 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-sm space-y-8">
            <div className="border-b border-border/40 pb-6">
              <h1 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-2">Terms of Service</h1>
              <p className="text-xs text-muted-foreground">Last updated: August 10, 2026</p>
            </div>

            <div className="space-y-6 text-sm md:text-base text-muted-foreground leading-relaxed">
              <p>
                Welcome to <strong>Beauty Parlé</strong>. By accessing our website or purchasing our products and booking our services, you agree to comply with and be bound by the following Terms of Service. Please read them carefully.
              </p>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">1. Acceptance of Terms</h2>
                <p>
                  By visiting our site or buying products from us, you engage in our "Service" and agree to be bound by these terms, including additional policies referenced herein or available via hyperlink. These terms apply to all users of the site, including browsers, customers, merchants, and contributors of content.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">2. Account Registration</h2>
                <p>
                  To make purchases or book appointments, you may be required to create an account. You agree to provide accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your account login information and password.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">3. Products and Services</h2>
                <p>
                  We reserve the right to limit the sales of our products or services to any person, geographic region, or jurisdiction. Descriptions of products and pricing are subject to change at any time without notice. We make every effort to display the colors and images of our products as accurately as possible.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">4. Accuracy of Billing and Account Information</h2>
                <p>
                  We reserve the right to refuse any order you place with us. In the event that we make a change to or cancel an order, we may attempt to notify you by contacting the email or billing address/phone number provided at the time the order was made.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">5. Appointments and Cancellation Policy</h2>
                <p>
                  For beauty services booked on our site, cancellations must be requested at least 24 hours prior to the scheduled appointment time. Cancellations made less than 24 hours in advance may be subject to a cancellation fee.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">6. Limitation of Liability</h2>
                <p>
                  In no event shall Beauty Parlé, our directors, employees, or affiliates be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, or consequential damages of any kind arising from your use of any of our services or products.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">7. Governing Law</h2>
                <p>
                  These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India, under the jurisdiction of courts in Glamour City.
                </p>
              </section>

              <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground">
                <p>If you have any questions about these Terms of Service, please contact us at support@beautyparle.com.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
