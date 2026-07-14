import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('email.host'),
      port: this.config.get('email.port'),
      secure: false, // false for port 587
      auth: {
        user: this.config.get('email.user'),
        pass: this.config.get('email.pass'),
      },
    });
  }

  async sendOtpEmail(to: string, otp: string) {
    await this.transporter.sendMail({
      from: this.config.get('email.from'),
      to,
      subject: '🔐 Your OTP for Beauty Parlé',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-family: 'Playfair Display', serif; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
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
    });
  }

  async sendWelcomeEmail(to: string, name: string) {
    await this.transporter.sendMail({
      from: this.config.get('email.from'),
      to,
      subject: '✨ Welcome to Beauty Parlé!',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-family: 'Playfair Display', serif; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <h2 style="color: #4A1A2C; font-size: 22px; margin: 0 0 8px 0;">Hello ${name}! 👋</h2>
            <p style="color: #2D1B2E; font-size: 16px; margin: 0 0 16px 0;">Thank you for joining Beauty Parlé. We're so excited to have you!</p>
            <p style="color: #6B4C5A; font-size: 14px; margin: 0 0 16px 0;">Discover premium cosmetics, book professional makeup services, and embrace beauty that understands you — in your language.</p>
            <div style="margin: 20px 0; text-align: center;">
              <a href="${this.config.get('frontendUrl')}/en/products" style="background: #E8A0BF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: 600; display: inline-block;">Start Shopping 🛍️</a>
            </div>
          </div>
          <p style="color: #6B4C5A; font-size: 12px; margin-top: 24px; text-align: center;">Beauty Parlé — Where Beauty Speaks Your Language 🌸</p>
        </div>
      `,
    });
  }

  async sendOrderConfirmation(to: string, orderId: number, total: number, items: any[]) {
    const itemsHtml = items.map(i => 
      `<tr><td style="padding: 8px 0; border-bottom: 1px solid #FDF0F0;">${i.name}</td><td style="padding: 8px 0; text-align: center;">${i.quantity}</td><td style="padding: 8px 0; text-align: right;">$${Number(i.price).toFixed(2)}</td></tr>`
    ).join('');

    await this.transporter.sendMail({
      from: this.config.get('email.from'),
      to,
      subject: `✅ Order #${orderId} Confirmed!`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-family: 'Playfair Display', serif; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <h2 style="color: #4A1A2C; font-size: 22px; margin: 0 0 8px 0;">🎉 Order Confirmed!</h2>
            <p style="color: #2D1B2E; font-size: 16px; margin: 0 0 8px 0;"><strong>Order #${orderId}</strong></p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
              <tr style="background: #FDF0F0;"><th style="padding: 8px; text-align: left;">Product</th><th style="padding: 8px; text-align: center;">Qty</th><th style="padding: 8px; text-align: right;">Price</th></tr>
              ${itemsHtml}
              <tr style="border-top: 2px solid #E8A0BF;"><td colspan="2" style="padding: 8px; font-weight: bold;">Total</td><td style="padding: 8px; text-align: right; font-weight: bold; color: #E8A0BF;">$${Number(total).toFixed(2)}</td></tr>
            </table>
            <p style="color: #6B4C5A; font-size: 14px;">📦 We'll notify you once your order is shipped.</p>
          </div>
          <p style="color: #6B4C5A; font-size: 12px; margin-top: 24px; text-align: center;">Track your order anytime in your account.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetLink = `${this.config.get('frontendUrl')}/en/auth/reset-password/${resetToken}`;
    await this.transporter.sendMail({
      from: this.config.get('email.from'),
      to,
      subject: '🔑 Reset Your Password',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E8A0BF; font-family: 'Playfair Display', serif; font-size: 32px; margin: 0;">💄 Beauty Parlé</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 16px;">
            <h2 style="color: #4A1A2C; font-size: 22px; margin: 0 0 8px 0;">🔑 Reset Your Password</h2>
            <p style="color: #2D1B2E; font-size: 16px; margin: 0 0 16px 0;">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
            <div style="margin: 20px 0; text-align: center;">
              <a href="${resetLink}" style="background: #E8A0BF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: 600; display: inline-block;">Reset Password 🔐</a>
            </div>
            <p style="color: #6B4C5A; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    });
  }

  async sendOrderStatusEmail(to: string, orderId: number, status: string) {
    const statusMap: Record<string, string> = {
      shipped: '📦 Shipped',
      delivered: '✅ Delivered',
      cancelled: '❌ Cancelled',
    };
    const statusText = statusMap[status] || status;

    await this.transporter.sendMail({
      from: this.config.get('email.from'),
      to,
      subject: `📦 Order #${orderId} Status Updated`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #FFF8F0; border-radius: 20px; border: 1px solid #FDF0F0;">
          <div style="background: white; padding: 24px; border-radius: 16px; text-align: center;">
            <h2 style="color: #4A1A2C; font-size: 22px;">Order #${orderId}</h2>
            <div style="font-size: 48px; margin: 16px 0;">${status === 'shipped' ? '📦' : status === 'delivered' ? '✅' : '⚠️'}</div>
            <p style="color: #2D1B2E; font-size: 18px; font-weight: 600;">${statusText}</p>
            <p style="color: #6B4C5A; font-size: 14px; margin-top: 8px;">Track your order in your account.</p>
          </div>
        </div>
      `,
    });
  }
}
