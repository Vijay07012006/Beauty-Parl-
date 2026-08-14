import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as SibApiV3Sdk from '@sendinblue/client';
import PDFDocument from 'pdfkit';
import { User } from '../auth/user.entity';

@Injectable()
export class EmailService {
  private apiInstance: SibApiV3Sdk.TransactionalEmailsApi;
  private fromEmail: string;
  private frontendUrl: string;

  constructor(
    private config: ConfigService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {
    const apiKey = process.env.BREVO_API_KEY || '';
    this.fromEmail = this.config.get<string>('email.from') || 'Beauty Parlé <noreply@beautyparle.com>';
    this.frontendUrl = this.config.get<string>('frontendUrl') || 'http://localhost:3000';

    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      apiKey,
    );

    if (apiKey) {
      console.log('✅ Brevo API initialized — transactional emails ready');
    } else {
      console.warn('⚠️ BREVO_API_KEY not set — emails will be skipped');
    }
  }

  private buildEmail(to: string, subject: string, html: string): SibApiV3Sdk.SendSmtpEmail {
    const email = new SibApiV3Sdk.SendSmtpEmail();
    // ✅ Extract plain email from "Name <email>" format — Brevo requires plain email only
    const plainEmail = this.fromEmail.replace(/.*<(.+)>/, '$1').trim() || this.fromEmail;
    email.sender = { name: 'Beauty Parlé', email: plainEmail };
    email.to = [{ email: to }];
    email.subject = subject;
    email.htmlContent = html;
    return email;
  }

  // ✅ Escape user-controlled strings before interpolating into HTML (prevents email HTML injection)
  private escapeHtml(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ✅ Diagnostic test endpoint
  async sendTestEmail(to: string) {
    console.log(`📧 Sending test email to: ${to}`);
    const email = this.buildEmail(
      to,
      '✅ Beauty Parlé — SMTP Test',
      `
        <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background: #FFF8F0; border-radius: 20px;">
          <h1 style="color: #E8A0BF; text-align: center;">💄 Beauty Parlé</h1>
          <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
            <p style="font-size: 18px; color: #2D1B2E;">✅ Brevo API is working correctly!</p>
            <p style="color: #6B4C5A;">Email delivery is now powered by Brevo.</p>
            <p style="font-size: 12px; color: #6B4C5A; margin-top: 20px;">Sent at: ${new Date().toISOString()}</p>
          </div>
        </div>
      `,
    );
    await this.apiInstance.sendTransacEmail(email);
    console.log(`✅ Test email sent to: ${to}`);
  }

  async sendOtpEmail(to: string, otp: string) {
    const email = this.buildEmail(
      to,
      '🔐 Your OTP for Beauty Parlé',
      `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
            <p style="color: #6B4C5A; font-size: 14px;">Where Beauty Speaks Your Language</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <p style="color: #2D1B2E; font-size: 16px; margin: 0 0 16px 0;">Your verification code is:</p>
            <div style="background: #FDF0F0; border-radius: 12px; padding: 16px; text-align: center; font-size: 36px; font-weight: bold; color: #4A1A2C; letter-spacing: 8px; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #6B4C5A; font-size: 14px; margin-top: 16px;">This OTP is valid for <strong>5 minutes</strong>.</p>
          </div>
          <p style="color: #6B4C5A; font-size: 12px; margin-top: 24px; text-align: center;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    );
    await this.apiInstance.sendTransacEmail(email);
  }

  async sendWelcomeEmail(to: string, name: string) {
    const email = this.buildEmail(
      to,
      '✨ Welcome to Beauty Parlé!',
      `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <h2 style="color: #4A1A2C; font-size: 22px; margin: 0 0 8px 0;">Hello ${this.escapeHtml(name)}! 👋</h2>
            <p style="color: #2D1B2E; font-size: 16px; margin: 0 0 16px 0;">Thank you for joining Beauty Parlé. We're so excited to have you!</p>
            <p style="color: #6B4C5A; font-size: 14px; margin: 0 0 16px 0;">Discover premium cosmetics, book professional makeup services, and embrace beauty that understands you.</p>
            <div style="margin: 20px 0; text-align: center;">
              <a href="${this.frontendUrl}/en/products" style="background: #E8A0BF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: 600; display: inline-block;">Start Shopping 🛍️</a>
            </div>
          </div>
          <p style="color: #6B4C5A; font-size: 12px; margin-top: 24px; text-align: center;">Beauty Parlé — Where Beauty Speaks Your Language 🌸</p>
        </div>
      `,
    );
    await this.apiInstance.sendTransacEmail(email);
  }

  async sendSuspensionEmail(to: string, reason: string, duration: string) {
    const email = this.buildEmail(
      to,
      '⚠️ Account Suspended — Beauty Parlé',
      `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <h2 style="color: #4A1A2C; font-size: 20px; margin-top: 0; margin-bottom: 12px;">⚠️ Account Suspended</h2>
            <p style="color: #2D1B2E; font-size: 14px; line-height: 1.6;">
              Please be notified that your account has been suspended for violating our policies.
            </p>
            <div style="background: #FDF0F0; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; font-size: 13px; color: #4A1A2C;"><strong>Reason:</strong> ${this.escapeHtml(reason)}</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #4A1A2C;"><strong>Duration:</strong> ${this.escapeHtml(duration)}</p>
            </div>
            <p style="color: #6B4C5A; font-size: 12px;">If you believe this is a mistake, please reach out to our helpdesk.</p>
          </div>
        </div>
      `
    );
    await this.apiInstance.sendTransacEmail(email);
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetLink = `${this.frontendUrl}/en/auth/reset-password/${resetToken}`;
    const email = this.buildEmail(
      to,
      '🔑 Reset Your Password — Beauty Parlé',
      `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <h2 style="color: #4A1A2C; font-size: 22px; margin: 0 0 8px 0;">🔑 Reset Your Password</h2>
            <p style="color: #2D1B2E; font-size: 16px; margin: 0 0 16px 0;">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
            <div style="margin: 20px 0; text-align: center;">
              <a href="${resetLink}" style="background: #E8A0BF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: 600; display: inline-block;">Reset Password 🔐</a>
            </div>
            <p style="color: #6B4C5A; font-size: 12px; word-break: break-all;">Or copy this link: ${resetLink}</p>
            <p style="color: #6B4C5A; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    );
    await this.apiInstance.sendTransacEmail(email);
  }

  async sendOrderConfirmation(to: string, order: any) {
    // Check user preferences
    const user = await this.userRepo.findOne({ where: { email: to } });
    if (user && user.emailPreferences && user.emailPreferences.order_updates === false) {
      console.log(`📧 Order confirmation email skipped for ${to} (preference disabled)`);
      return;
    }

    const itemsHtml = order.items.map((i: any) =>
      `<tr><td style="padding: 8px 0; border-bottom: 1px solid #FDF0F0;">${this.escapeHtml(i.name)}</td><td style="padding: 8px 0; text-align: center;">${this.escapeHtml(i.quantity)}</td><td style="padding: 8px 0; text-align: right;">$${Number(i.price).toFixed(2)}</td></tr>`
    ).join('');

    const email = this.buildEmail(
      to,
      `✅ Order #${order.id} Confirmed! — Beauty Parlé`,
      `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <h2 style="color: #4A1A2C; font-size: 22px; margin: 0 0 8px 0;">🎉 Order Confirmed!</h2>
            <p style="color: #2D1B2E; font-size: 16px; margin: 0 0 8px 0;"><strong>Order #${order.id}</strong></p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
              <tr style="background: #FDF0F0;"><th style="padding: 8px; text-align: left;">Product</th><th style="padding: 8px; text-align: center;">Qty</th><th style="padding: 8px; text-align: right;">Price</th></tr>
              ${itemsHtml}
              <tr style="border-top: 2px solid #E8A0BF;"><td colspan="2" style="padding: 8px; font-weight: bold;">Total</td><td style="padding: 8px; text-align: right; font-weight: bold; color: #E8A0BF;">$${Number(order.total).toFixed(2)}</td></tr>
            </table>
            <p style="color: #6B4C5A; font-size: 14px;">📦 We'll notify you once your order is shipped.</p>
          </div>
          <p style="color: #6B4C5A; font-size: 12px; margin-top: 24px; text-align: center;">Track your order anytime in your account. A copy of your invoice is attached to this email.</p>
        </div>
      `,
    );

    try {
      const pdfBuffer = await this.generateReceiptPdf(order);
      email.attachment = [
        {
          content: pdfBuffer.toString('base64'),
          name: `invoice_${order.id}.pdf`,
        }
      ];
    } catch (err) {
      console.error(`❌ Failed to attach invoice PDF to confirmation email for Order #${order.id}:`, err);
    }

    await this.apiInstance.sendTransacEmail(email);
  }

  async generateReceiptPdf(order: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];
        doc.on('data', chunk => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Title & Logo
        doc.fillColor('#E8A0BF').fontSize(24).font('Helvetica-Bold').text('Beauty Parlé', 50, 50);
        doc.fillColor('#6B4C5A').fontSize(10).font('Helvetica-Oblique').text('Where Beauty Speaks Your Language', 50, 80);
        
        // Invoice label
        doc.fillColor('#2D1B2E').fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
        doc.fontSize(12).font('Helvetica').text(`#${order.id}`, 400, 75, { align: 'right' });

        // Horizontal line
        doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#FDF0F0').lineWidth(2).stroke();

        // Info metadata
        doc.fillColor('#6B4C5A').fontSize(10).font('Helvetica-Bold').text('SHIPPING ADDRESS', 50, 130);
        doc.fillColor('#2D1B2E').font('Helvetica').fontSize(10);
        const addr = order.shippingAddress || {};
        doc.text(addr.name || 'N/A', 50, 145);
        doc.text(addr.address || '', 50, 160);
        doc.text(`${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`, 50, 175);
        doc.text(`Phone: ${addr.phone || 'N/A'}`, 50, 190);

        doc.fillColor('#6B4C5A').font('Helvetica-Bold').text('ORDER DETAILS', 350, 130);
        doc.fillColor('#2D1B2E').font('Helvetica');
        const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'long', year: 'numeric'
        });
        doc.text(`Order Date: ${dateStr}`, 350, 145);
        doc.text(`Status: ${order.status.toUpperCase()}`, 350, 160);
        doc.text(`Payment: ${order.paymentMethod.toUpperCase()}`, 350, 175);

        // Line before table
        doc.moveTo(50, 220).lineTo(545, 220).strokeColor('#FDF0F0').lineWidth(1).stroke();

        // Table headers
        doc.fillColor('#6B4C5A').font('Helvetica-Bold');
        doc.text('Product', 50, 235);
        doc.text('Qty', 300, 235, { width: 50, align: 'center' });
        doc.text('Price', 380, 235, { width: 70, align: 'right' });
        doc.text('Total', 470, 235, { width: 75, align: 'right' });

        // Header underline
        doc.moveTo(50, 250).lineTo(545, 250).strokeColor('#E8A0BF').lineWidth(1).stroke();

        // Table rows
        let y = 265;
        doc.fillColor('#2D1B2E').font('Helvetica');
        for (const item of order.items || []) {
          // Check page overflow
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
          
          doc.text(item.name || 'Product', 50, y, { width: 230 });
          doc.text(String(item.quantity), 300, y, { width: 50, align: 'center' });
          doc.text(`$${Number(item.price).toFixed(2)}`, 380, y, { width: 70, align: 'right' });
          doc.text(`$${(Number(item.price) * item.quantity).toFixed(2)}`, 470, y, { width: 75, align: 'right' });
          
          y += 25;
        }

        // Summary lines
        if (y > 650) {
          doc.addPage();
          y = 50;
        }

        y += 15;
        doc.moveTo(350, y).lineTo(545, y).strokeColor('#FDF0F0').lineWidth(1).stroke();
        y += 10;

        // Pricing layout
        const printSummaryLine = (label: string, val: string, isBold = false) => {
          doc.fillColor(isBold ? '#4A1A2C' : '#6B4C5A');
          doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
          doc.text(label, 350, y);
          doc.text(val, 470, y, { width: 75, align: 'right' });
          y += 20;
        };

        printSummaryLine('Subtotal', `$${Number(order.subtotal).toFixed(2)}`);
        printSummaryLine('Shipping', `$${Number(order.shipping).toFixed(2)}`);
        printSummaryLine('Tax', `$${Number(order.tax).toFixed(2)}`);
        if (order.discount > 0) {
          printSummaryLine('Discount', `-$${Number(order.discount).toFixed(2)}`);
        }
        y += 5;
        doc.moveTo(350, y).lineTo(545, y).strokeColor('#E8A0BF').lineWidth(1.5).stroke();
        y += 10;
        printSummaryLine('Total', `$${Number(order.total).toFixed(2)}`, true);

        // Footer
        doc.fillColor('#6B4C5A').font('Helvetica-Oblique').fontSize(10)
          .text('Thank you for shopping with Beauty Parlé!', 50, 720, { align: 'center', width: 495 });
        doc.fontSize(8).font('Helvetica')
          .text('support@beautyparle.com | +91 98765 43210', 50, 740, { align: 'center', width: 495 });
        doc.text(`© ${new Date().getFullYear()} Beauty Parlé. All rights reserved.`, 50, 755, { align: 'center', width: 495 });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  async sendOrderStatusEmail(to: string, orderId: number, status: string) {
    // Check user preferences
    const user = await this.userRepo.findOne({ where: { email: to } });
    if (user && user.emailPreferences && user.emailPreferences.order_updates === false) {
      console.log(`📧 Order status email skipped for ${to} (preference disabled)`);
      return;
    }

    const statusMap: Record<string, string> = {
      shipped: '📦 Shipped',
      delivered: '✅ Delivered',
      cancelled: '❌ Cancelled',
    };
    const statusText = statusMap[status] || status;

    const email = this.buildEmail(
      to,
      `📦 Order #${orderId} Status Updated — Beauty Parlé`,
      `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="background: white; padding: 24px; border-radius: 16px; text-align: center;">
            <h2 style="color: #4A1A2C; font-size: 22px;">Order #${orderId}</h2>
            <div style="font-size: 48px; margin: 16px 0;">${status === 'shipped' ? '📦' : status === 'delivered' ? '✅' : '⚠️'}</div>
            <p style="color: #2D1B2E; font-size: 18px; font-weight: 600;">${statusText}</p>
            <p style="color: #6B4C5A; font-size: 14px; margin-top: 8px;">Track your order in your account.</p>
          </div>
        </div>
      `,
    );
    await this.apiInstance.sendTransacEmail(email);
  }

  async sendCartReminderEmail(to: string, items: any[], discountCode?: string) {
    const itemsHtml = items
      .map(
        (item: any) => `
        <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #FDF0F0;">
          <img src="${this.escapeHtml(item.image)}" alt="${this.escapeHtml(item.name)}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; margin-right: 16px;" />
          <div style="flex-grow: 1;">
            <p style="margin: 0; font-weight: 600; color: #2D1B2E; font-size: 14px;">${this.escapeHtml(item.name)}</p>
            <p style="margin: 4px 0 0 0; color: #6B4C5A; font-size: 12px;">Qty: ${this.escapeHtml(item.quantity)} | Rs. ${this.escapeHtml(item.price)}</p>
          </div>
        </div>
      `,
      )
      .join('');

    const discountHtml = discountCode
      ? `
        <div style="background: #FDF0F0; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #4A1A2C; font-weight: bold; font-size: 16px;">🎁 Special Offer for You!</p>
          <p style="margin: 0; color: #6B4C5A; font-size: 14px;">Use code <strong style="color: #E8A0BF; font-size: 18px;">${this.escapeHtml(discountCode)}</strong> at checkout to get 10% off!</p>
        </div>
      `
      : '';

    const email = this.buildEmail(
      to,
      discountCode ? '🎁 Complete your purchase with 10% OFF!' : '💄 Did you forget something in your cart?',
      `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <h2 style="color: #4A1A2C; font-size: 20px; margin-top: 0;">Items left in your cart:</h2>
            <div>
              ${itemsHtml}
            </div>
            ${discountHtml}
            <div style="text-align: center; margin-top: 24px;">
              <a href="${this.frontendUrl}/en/cart" style="background: #E8A0BF; color: white; padding: 12px 30px; border-radius: 99px; text-decoration: none; font-weight: bold; display: inline-block;">Return to Cart</a>
            </div>
          </div>
        </div>
      `,
    );
    await this.apiInstance.sendTransacEmail(email);
  }

  async sendWishlistAlertEmail(to: string, product: any, alertType: 'price_drop' | 'back_in_stock', priceThreshold?: number) {
    const isPriceDrop = alertType === 'price_drop';
    const safeName = this.escapeHtml(product.name);
    const safeImage = this.escapeHtml(product.image);
    const subject = isPriceDrop
      ? `📉 Price Drop Alert: ${safeName} is now Rs. ${Number(product.price).toFixed(2)}!`
      : `✨ Back in Stock Alert: ${safeName} is now available!`;

    const descriptionText = isPriceDrop
      ? `Great news! The price of <strong>${safeName}</strong> has dropped below your threshold of Rs. ${Number(priceThreshold).toFixed(2)}. It is now available for just <strong>Rs. ${Number(product.price).toFixed(2)}</strong>.`
      : `Great news! <strong>${safeName}</strong> is back in stock and ready to order. Grab yours before it runs out again!`;

    const email = this.buildEmail(
      to,
      subject,
      `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px; text-align: center;">
            <h2 style="color: #4A1A2C; font-size: 20px; margin-top: 0;">${isPriceDrop ? '📉 Price Dropped!' : '✨ Back in Stock!'}</h2>
            <div style="margin: 20px 0;">
              <img src="${safeImage}" alt="${safeName}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 16px;" />
            </div>
            <h3 style="color: #2D1B2E; font-size: 18px; margin: 10px 0;">${safeName}</h3>
            <p style="color: #6B4C5A; font-size: 14px; line-height: 1.6;">
              ${descriptionText}
            </p>
            <p style="font-size: 20px; font-weight: bold; color: #E8A0BF; margin: 16px 0;">
              Rs. ${Number(product.price).toFixed(2)}
            </p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${this.frontendUrl}/en/product/${product.id}" style="background: #E8A0BF; color: white; padding: 12px 30px; border-radius: 99px; text-decoration: none; font-weight: bold; display: inline-block;">Shop Now</a>
            </div>
          </div>
        </div>
      `,
    );
    await this.apiInstance.sendTransacEmail(email);
  }

  async sendSecurityAlertEmail(to: string, type: 'failed_logins' | 'suspicious_login', details: { ipAddress?: string; userAgent?: string; location?: string; count?: number }) {
    const isFailed = type === 'failed_logins';
    const subject = isFailed
      ? `🚨 Security Alert: Multiple Failed Login Attempts Detected`
      : `⚠️ Security Alert: Login from New Device/Location`;

    const htmlContent = isFailed
      ? `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF5F5; border-radius: 20px; border: 1px solid #FED7D7;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E53E3E; font-size: 32px; margin: 0;">🚨 Security Alert</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <h2 style="color: #2D3748; font-size: 18px; margin-top: 0;">Suspicious Activity Detected</h2>
            <p style="color: #4A5568; font-size: 14px; line-height: 1.6;">
              We detected <strong>${details.count || 3} failed login attempts</strong> to your account within a short period.
            </p>
            <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
            <table style="width: 100%; font-size: 13px; color: #4A5568;">
              <tr><td style="font-weight: bold; padding: 4px 0;">IP Address:</td><td>${details.ipAddress || 'Unknown'}</td></tr>
              <tr><td style="font-weight: bold; padding: 4px 0;">Device/Browser:</td><td>${details.userAgent || 'Unknown'}</td></tr>
              <tr><td style="font-weight: bold; padding: 4px 0;">Location:</td><td>${details.location || 'Unknown'}</td></tr>
            </table>
            <p style="color: #718096; font-size: 12px; margin-top: 20px;">
              If this wasn't you, we recommend resetting your password immediately.
            </p>
          </div>
        </div>
      `
      : `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFFAF0; border-radius: 20px; border: 1px solid #FEEBC8;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #DD6B20; font-size: 32px; margin: 0;">⚠️ New Login Detected</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <h2 style="color: #2D3748; font-size: 18px; margin-top: 0;">New Device or Location</h2>
            <p style="color: #4A5568; font-size: 14px; line-height: 1.6;">
              Your Beauty Parlé account was recently logged into from a new location or device that we haven't seen before.
            </p>
            <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
            <table style="width: 100%; font-size: 13px; color: #4A5568;">
              <tr><td style="font-weight: bold; padding: 4px 0;">IP Address:</td><td>${details.ipAddress || 'Unknown'}</td></tr>
              <tr><td style="font-weight: bold; padding: 4px 0;">Device/Browser:</td><td>${details.userAgent || 'Unknown'}</td></tr>
              <tr><td style="font-weight: bold; padding: 4px 0;">Location:</td><td>${details.location || 'Unknown'}</td></tr>
            </table>
            <p style="color: #718096; font-size: 12px; margin-top: 20px;">
              If this was you, you can safely ignore this email. If this wasn't you, please secure your account immediately.
            </p>
          </div>
        </div>
      `;

    const email = this.buildEmail(to, subject, htmlContent);
    await this.apiInstance.sendTransacEmail(email);
  }

  async sendTerminationEmail(to: string, name: string, reason: string, adminName: string) {
    const email = this.buildEmail(
      to,
      'Your Beauty Parlé Account Has Been Terminated',
      `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <h2 style="color: #4A1A2C; font-size: 20px; margin-top: 0; margin-bottom: 16px;">Dear ${name},</h2>
            <p style="color: #2D1B2E; font-size: 15px; line-height: 1.6;">
              Your account on Beauty Parlé has been <strong style="color: #db2777;">terminated</strong> by <strong>${adminName}</strong> (Super Admin).
            </p>
            <div style="margin: 20px 0; padding: 16px; background: #FFF5F5; border-radius: 12px; border-left: 4px solid #db2777;">
              <p style="color: #4A1A2C; font-size: 14px; margin: 0;"><strong>Reason:</strong> ${reason}</p>
            </div>
            <p style="color: #6B4C5A; font-size: 13px; line-height: 1.6;">
              If you believe this action was taken in error or want to dispute this decision, please contact our support team at:
            </p>
            <p style="text-align: center; margin-top: 20px;">
              <a href="mailto:support@beautyparle.com" style="color: #db2777; font-weight: bold; text-decoration: underline;">support@beautyparle.com</a>
            </p>
          </div>
          <p style="color: #6B4C5A; font-size: 11px; margin-top: 24px; text-align: center;">Beauty Parlé — Where Beauty Speaks Your Language 🌸</p>
        </div>
      `
    );
    await this.apiInstance.sendTransacEmail(email);
  }

  async sendTicketConfirmation(to: string, ticketId: number, subject: string, message: string) {
    const email = this.buildEmail(
      to,
      `We've received your support request (Ticket #${ticketId})`,
      `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <h2 style="color: #4A1A2C; font-size: 20px; margin-top: 0; margin-bottom: 16px;">Support Ticket #${ticketId} Raised</h2>
            <p style="color: #2D1B2E; font-size: 15px; line-height: 1.6;">
              Thank you for contacting Beauty Parlé Support. We have received your request and our support team will respond within 24 hours.
            </p>
            <div style="margin: 20px 0; padding: 16px; background: #secondary/10; border-radius: 12px; border-left: 4px solid #E8A0BF; font-size: 13px; color: #4A1A2C;">
              <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 0;"><strong>Message:</strong> ${message}</p>
            </div>
            <p style="color: #6B4C5A; font-size: 13px; line-height: 1.6;">
              You can track your support status on the portal or chat with JARVIS at any time.
            </p>
          </div>
          <p style="color: #6B4C5A; font-size: 11px; margin-top: 24px; text-align: center;">Beauty Parlé — Where Beauty Speaks Your Language 🌸</p>
        </div>
      `
    );
    await this.apiInstance.sendTransacEmail(email);
  }

  async sendTicketAdminAlert(ticketId: number, userName: string, subject: string, message: string) {
    try {
      const admins = await this.userRepo.find({
        where: { role: In(['admin', 'super_admin']) },
      });
      for (const admin of admins) {
        const email = this.buildEmail(
          admin.email,
          `🚨 New Support Ticket #${ticketId} from ${userName}`,
          `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF5F5; border-radius: 20px; border: 1px solid #FED7D7;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #E53E3E; font-size: 32px; margin: 0;">🚨 New Support Request</h1>
              </div>
              <div style="background: white; padding: 24px; border-radius: 16px;">
                <h2 style="color: #2D3748; font-size: 18px; margin-top: 0; margin-bottom: 16px;">Ticket Details</h2>
                <p style="color: #4A5568; font-size: 14px; line-height: 1.6;">
                  A new support request has been raised by <strong>${userName}</strong>.
                </p>
                <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
                <table style="width: 100%; font-size: 13px; color: #4A5568;">
                  <tr><td style="font-weight: bold; padding: 4px 0; width: 100px;">Ticket ID:</td><td>#${ticketId}</td></tr>
                  <tr><td style="font-weight: bold; padding: 4px 0;">Subject:</td><td>${subject}</td></tr>
                  <tr><td style="font-weight: bold; padding: 4px 0;">Message:</td><td>${message}</td></tr>
                </table>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="${this.frontendUrl}/en/admin/tickets" style="background: #E53E3E; color: white; padding: 12px 30px; border-radius: 99px; text-decoration: none; font-weight: bold; display: inline-block;">View Ticket Dashboard</a>
                </div>
              </div>
            </div>
          `
        );
        await this.apiInstance.sendTransacEmail(email);
      }
    } catch (err: any) {
      console.error('Failed to send admin ticket alerts:', err.message);
    }
  }

  async sendTicketResolvedEmail(to: string, ticketId: number, subject: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #FFF8F0; border-radius: 20px;">
        <h1 style="color: #E8A0BF;">💄 Beauty Parlé</h1>
        <h2>✅ Your Support Ticket #${ticketId} has been Resolved</h2>
        <p><strong>Issue:</strong> ${this.escapeHtml(subject)}</p>
        <p>Your issue has been resolved. If you need further assistance, please reply to this email or raise a new ticket.</p>
        <a href="${this.frontendUrl}/en/profile/tickets/${ticketId}" style="background: #E8A0BF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 999px; display: inline-block;">View Ticket</a>
        <p>Beauty Parlé — Where Beauty Speaks Your Language 🌸</p>
      </div>
    `;
    const email = this.buildEmail(to, `✅ Ticket #${ticketId} Resolved`, html);
    await this.apiInstance.sendTransacEmail(email);
  }

  async sendInventoryAlertEmail(to: string, productName: string, stock: number) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background: #FFF0F0; border-radius: 20px;">
        <h1 style="color: #FF5A5A; text-align: center;">💄 Beauty Parlé</h1>
        <div style="background: white; padding: 20px; border-radius: 12px;">
          <h2 style="color: #D32F2F; margin-top: 0;">🚨 Low Stock Alert!</h2>
          <p style="font-size: 16px; color: #2D1B2E;">The inventory for product <strong>${this.escapeHtml(productName)}</strong> is running low.</p>
          <div style="background: #FFEBEE; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; color: #C62828; margin: 20px 0; text-align: center;">
            Current Stock: ${stock} items (Threshold: < 10)
          </div>
          <p style="color: #6B4C5A;">Please restock this item soon to avoid out-of-stock situations.</p>
          <p style="font-size: 12px; color: #6B4C5A; margin-top: 20px;">Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;
    const email = this.buildEmail(to, `🚨 Low Stock Alert: ${productName}`, html);
    await this.apiInstance.sendTransacEmail(email);
  }
}
