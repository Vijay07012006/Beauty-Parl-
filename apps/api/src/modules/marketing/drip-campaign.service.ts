import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';

@Injectable()
export class DripCampaignService {
  constructor(private readonly emailService: EmailService) {}

  async triggerWelcomeSeries(email: string, name: string) {
    console.log(`📧 [DripCampaign] Starting Welcome Series for: ${email}`);

    // Welcome Email (Immediate)
    await this.emailService.sendWelcomeEmail(email, name);

    // Tip & Hacks Email (Simulated: 5 seconds in development, otherwise 24 hours)
    const delay2 = process.env.NODE_ENV === 'production' ? 24 * 60 * 60 * 1000 : 5000;
    setTimeout(async () => {
      await this.emailService.sendEmail(
        email,
        '🌸 Pro Beauty Tips from Beauty Parlé!',
        `
          <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background: #FFF8F0; border-radius: 20px;">
            <h2 style="color: #4A1A2C;">Hello ${name}, get the most out of your beauty routine!</h2>
            <p>1. Always apply serum on damp skin for maximum absorption.</p>
            <p>2. Double cleanse at night to remove all makeup and impurities.</p>
            <p>3. Use a lightweight sunscreen daily — even indoors!</p>
            <p style="margin-top: 20px; font-weight: bold;">Stay glowing,<br>The Beauty Parlé Team 💄</p>
          </div>
        `,
      );
      console.log(`📧 [DripCampaign] Welcome Series Day 2 Email sent to ${email}`);
    }, delay2);

    // Onboarding Coupon Email (Simulated: 10 seconds in dev, otherwise 5 days)
    const delay5 = process.env.NODE_ENV === 'production' ? 5 * 24 * 60 * 60 * 1000 : 10000;
    setTimeout(async () => {
      await this.emailService.sendEmail(
        email,
        '🎁 Here is Rs. 150 Off your first order!',
        `
          <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background: #FFF8F0; border-radius: 20px; text-align: center;">
            <h2 style="color: #E8A0BF;">Welcome Gift! 🎉</h2>
            <p>We want to make your first experience extra special. Use code below at checkout:</p>
            <div style="background: white; border: 2px dashed #E8A0BF; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; color: #4A1A2C;">
              WELCOME150
            </div>
            <p>Get Rs. 150 off on orders above Rs. 1000. Valid for 7 days.</p>
          </div>
        `,
      );
      console.log(`📧 [DripCampaign] Welcome Series Day 5 Email sent to ${email}`);
    }, delay5);
  }

  async triggerAbandonedCartSeries(email: string, name: string, total: number) {
    console.log(`📧 [DripCampaign] Starting Abandoned Cart Series for: ${email}`);

    // Email 1 (Simulated: 3 seconds, otherwise 2 hours)
    const delay1 = process.env.NODE_ENV === 'production' ? 2 * 60 * 60 * 1000 : 3000;
    setTimeout(async () => {
      await this.emailService.sendEmail(
        email,
        '💄 Did you forget something?',
        `
          <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background: #FFF8F0; border-radius: 20px;">
            <h2>We noticed you left items in your cart...</h2>
            <p>Hi ${name}, your favorites (totaling Rs. ${total.toFixed(2)}) are waiting for you!</p>
            <p>Complete your purchase now before they sell out.</p>
            <a href="http://localhost:3000/en/cart" style="background: #E8A0BF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 999px; display: inline-block; margin-top: 15px;">Return to Cart 🛍️</a>
          </div>
        `,
      );
      console.log(`📧 [DripCampaign] Abandoned Cart Email 1 sent to ${email}`);
    }, delay1);

    // Email 2 (Simulated: 6 seconds, otherwise 24 hours)
    const delay2 = process.env.NODE_ENV === 'production' ? 24 * 60 * 60 * 1000 : 6000;
    setTimeout(async () => {
      await this.emailService.sendEmail(
        email,
        '✨ Free Shipping on your saved cart!',
        `
          <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background: #FFF8F0; border-radius: 20px; text-align: center;">
            <h2>Unlock Free Shipping! 🚀</h2>
            <p>Complete your order now and enjoy free delivery on your selected beauty essentials.</p>
            <a href="http://localhost:3000/en/cart" style="background: #4A1A2C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 999px; display: inline-block; margin-top: 15px;">Checkout Now</a>
          </div>
        `,
      );
      console.log(`📧 [DripCampaign] Abandoned Cart Email 2 sent to ${email}`);
    }, delay2);
  }

  async triggerPostPurchaseSeries(email: string, name: string, orderId: number) {
    console.log(`📧 [DripCampaign] Starting Post-Purchase Series for: ${email}`);

    // Email 1 (Simulated: 4 seconds, otherwise 7 days)
    const delay = process.env.NODE_ENV === 'production' ? 7 * 24 * 60 * 60 * 1000 : 4000;
    setTimeout(async () => {
      await this.emailService.sendEmail(
        email,
        '🌟 How is your new beauty gear?',
        `
          <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background: #FFF8F0; border-radius: 20px; text-align: center;">
            <h2>We\'d love your feedback!</h2>
            <p>Hi ${name}, order #${orderId} was delivered recently. How do you like your new products?</p>
            <p>Leave a review on our site and earn 10 extra loyalty points!</p>
            <a href="http://localhost:3000/en/profile" style="background: #E8A0BF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 999px; display: inline-block; margin-top: 15px;">Review Order</a>
          </div>
        `,
      );
      console.log(`📧 [DripCampaign] Post-Purchase Email sent to ${email}`);
    }, delay);
  }
}
