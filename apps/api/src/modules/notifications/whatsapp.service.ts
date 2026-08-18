import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private whatsappNumber: string | undefined;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (this.accountSid && this.authToken && this.whatsappNumber) {
      this.logger.log('✅ Twilio WhatsApp API initialized');
    } else {
      this.logger.warn(
        '⚠️ Twilio WhatsApp environment variables missing. Falling back to Mock WhatsApp console logging.',
      );
    }
  }

  async sendWhatsappMessage(to: string, body: string): Promise<boolean> {
    // Standardize phone number format for WhatsApp. Twilio format is: whatsapp:+91xxxxxxxxxx
    const formattedTo = to.startsWith('whatsapp:')
      ? to
      : `whatsapp:${to.startsWith('+') ? to : `+91${to}`}`;
    const formattedFrom = this.whatsappNumber?.startsWith('whatsapp:')
      ? this.whatsappNumber
      : `whatsapp:${this.whatsappNumber}`;

    if (this.accountSid && this.authToken && this.whatsappNumber) {
      try {
        const auth = Buffer.from(
          `${this.accountSid}:${this.authToken}`,
        ).toString('base64');
        const params = new URLSearchParams();
        params.append('To', formattedTo);
        params.append('From', formattedFrom);
        params.append('Body', body);

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          },
        );

        if (!response.ok) {
          const errText = await response.text();
          this.logger.error(
            `Failed to send Twilio WhatsApp message: ${errText}`,
          );
          return false;
        }

        const data = await response.json();
        this.logger.log(`WhatsApp message sent successfully: ${data.sid}`);
        return true;
      } catch (err: any) {
        this.logger.error(
          `Error occurred while sending Twilio WhatsApp message: ${err.message}`,
        );
        return false;
      }
    } else {
      // Mock WhatsApp Logger
      this.logger.log(`📱 [WhatsApp Mock] Message to: ${formattedTo}`);
      this.logger.log(`💬 Content: "${body}"`);
      return true;
    }
  }

  async sendOrderStatusUpdate(
    phone: string,
    orderId: number,
    status: string,
  ): Promise<boolean> {
    const statusMap: Record<string, string> = {
      pending: 'is pending confirmation ⏳',
      processing: 'is being packed 📦',
      shipped: 'has been shipped 🚚',
      delivered:
        'has been delivered! 🎉 Thank you for shopping with Beauty Parlé.',
      cancelled: 'has been cancelled ❌',
    };
    const message = `Hello! Your Beauty Parlé Order #${orderId} status has been updated. Your package ${statusMap[status] || `is now: ${status}`}. Track details on your portal.`;
    return this.sendWhatsappMessage(phone, message);
  }
}
