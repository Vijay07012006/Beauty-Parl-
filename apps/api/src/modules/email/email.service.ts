import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
            <h2 style="color: #4A1A2C; font-size: 22px; margin: 0 0 8px 0;">Hello ${name}! 👋</h2>
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
      `<tr><td style="padding: 8px 0; border-bottom: 1px solid #FDF0F0;">${i.name}</td><td style="padding: 8px 0; text-align: center;">${i.quantity}</td><td style="padding: 8px 0; text-align: right;">$${Number(i.price).toFixed(2)}</td></tr>`
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
          <img src="${item.image || ''}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; margin-right: 16px;" />
          <div style="flex-grow: 1;">
            <p style="margin: 0; font-weight: 600; color: #2D1B2E; font-size: 14px;">${item.name}</p>
            <p style="margin: 4px 0 0 0; color: #6B4C5A; font-size: 12px;">Qty: ${item.quantity} | Rs. ${item.price}</p>
          </div>
        </div>
      `,
      )
      .join('');

    const discountHtml = discountCode
      ? `
        <div style="background: #FDF0F0; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #4A1A2C; font-weight: bold; font-size: 16px;">🎁 Special Offer for You!</p>
          <p style="margin: 0; color: #6B4C5A; font-size: 14px;">Use code <strong style="color: #E8A0BF; font-size: 18px;">${discountCode}</strong> at checkout to get 10% off!</p>
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
}
