import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { WebhookSubscription, WebhookAttempt } from './entities/webhook.entity';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(WebhookSubscription)
    private readonly subscriptionRepo: Repository<WebhookSubscription>,
    @InjectRepository(WebhookAttempt)
    private readonly attemptRepo: Repository<WebhookAttempt>,
  ) {}

  async subscribe(url: string, events: string[]): Promise<WebhookSubscription> {
    const signingSecret = crypto.randomBytes(32).toString('base64');
    const sub = this.subscriptionRepo.create({
      url,
      events,
      signingSecret,
      isActive: true,
    });
    return this.subscriptionRepo.save(sub);
  }

  async unsubscribe(subscriptionId: number): Promise<void> {
    await this.subscriptionRepo.update(subscriptionId, { isActive: false });
  }

  async listSubscriptions(): Promise<WebhookSubscription[]> {
    return this.subscriptionRepo.find({ order: { id: 'DESC' } });
  }

  async listAttempts(): Promise<WebhookAttempt[]> {
    return this.attemptRepo.find({ order: { id: 'DESC' }, take: 50 });
  }

  async trigger(event: string, data: any): Promise<void> {
    const subscriptions = await this.subscriptionRepo.find({ where: { isActive: true } });
    const targets = subscriptions.filter((sub) => sub.events.includes(event));

    for (const sub of targets) {
      this.dispatchWebhook(sub, event, data).catch((err) => {
        console.error(`❌ Webhook dispatch failure for subscription #${sub.id}:`, err);
      });
    }
  }

  private async dispatchWebhook(sub: WebhookSubscription, event: string, data: any): Promise<void> {
    const timestamp = Date.now();
    const payload = JSON.stringify({ event, data, timestamp });
    
    const signature = crypto
      .createHmac('sha256', sub.signingSecret)
      .update(payload)
      .digest('hex');

    let responseStatus = 0;
    let responseBody = '';
    let success = false;

    try {
      const res = await fetch(sub.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Beauty-Signature': signature,
        },
        body: payload,
      });

      responseStatus = res.status;
      responseBody = await res.text();
      success = res.ok;
    } catch (err: any) {
      responseStatus = 500;
      responseBody = err.message || 'Network Fetch Error';
      success = false;
    }

    const attempt = this.attemptRepo.create({
      subscriptionId: sub.id,
      event,
      responseStatus,
      responseBody: responseBody.slice(0, 1000),
      success,
    });

    await this.attemptRepo.save(attempt);
  }
}
