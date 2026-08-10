import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen py-16 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-sm space-y-8">
            <div className="border-b border-border/40 pb-6">
              <h1 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-2">Privacy Policy</h1>
              <p className="text-xs text-muted-foreground">Last updated: August 10, 2026</p>
            </div>

            <div className="space-y-6 text-sm md:text-base text-muted-foreground leading-relaxed">
              <p>
                At <strong>Beauty Parlé</strong>, we value your trust and are committed to protecting your personal information. This Privacy Policy describes how we collect, use, disclose, and protect your data when you visit our website, make a purchase, or book our services.
              </p>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">1. Information We Collect</h2>
                <p>
                  We collect personal information that you voluntarily provide to us when you register, make a purchase, participate in our loyalty program, fill out a contact form, or schedule an appointment. This information may include:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Name, email address, phone number, and physical shipping/billing address.</li>
                  <li>Account login credentials (hashed passwords).</li>
                  <li>Payment details (which are securely processed directly by our payment gateways, Razorpay and Stripe).</li>
                  <li>Information about your preferences, skin profile, and routines gathered through our quiz or skin analysis tool.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">2. How We Use Your Information</h2>
                <p>
                  We use your personal data for purposes including:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Processing, fulfilling, and shipping your product orders.</li>
                  <li>Managing service bookings and sending confirmation notices.</li>
                  <li>Awarding loyalty points and managing rewards programs.</li>
                  <li>Personalizing your experience with product recommendations.</li>
                  <li>Communicating updates, promotions, and newsletters (subject to your email preferences).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">3. Sharing and Disclosing Information</h2>
                <p>
                  We do not sell or rent your personal information to third parties. We share your information only with trusted service providers who assist us in operating our website, conducting our business, or serving you (such as shipping carriers, email delivery services, and payment processors). All such third parties are obligated to keep your information confidential.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">4. Cookies and Tracking Technologies</h2>
                <p>
                  We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and remember your cart items. You can choose to disable cookies through your browser settings, though some features of our site may not function properly as a result.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">5. GDPR and Data Protection Rights</h2>
                <p>
                  If you reside in the European Economic Area (EEA), you have certain data protection rights under the GDPR, including the right to access, correct, delete, or limit the use of your personal data. If you wish to exercise these rights, please contact us at support@beautyparle.com.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-playfair font-bold text-foreground">6. Data Security</h2>
                <p>
                  We implement a variety of security measures to maintain the safety of your personal information. Sensitive data such as phone numbers and addresses are encrypted at rest using advanced cryptographic algorithms. All transactions are processed through secure payment gateway services and are not stored on our servers.
                </p>
              </section>

              <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground">
                <p>For any privacy-related inquiries, please email our Data Protection Officer at support@beautyparle.com.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
