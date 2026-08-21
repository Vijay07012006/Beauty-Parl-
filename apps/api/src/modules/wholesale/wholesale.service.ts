import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WholesaleOrder } from './entities/wholesale.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class WholesaleService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(WholesaleOrder)
    private readonly wholesaleRepo: Repository<WholesaleOrder>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {
    const apiKey =
      this.configService.get<string>('geminiApiKey') ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateBulkSuggestion(vendorId: number): Promise<any[]> {
    const history = await this.wholesaleRepo.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });

    const topProducts = await this.productRepo.find({ take: 5 });

    if (history.length === 0) {
      return topProducts.slice(0, 3).map((prod) => ({
        productId: prod.id,
        name: prod.name,
        suggestedQty: 100,
        reason: 'Recommended starting bulk quantity for onboarding partner brands.',
      }));
    }

    const totals: { [id: number]: { qty: number; count: number; name: string } } = {};
    for (const order of history) {
      for (const item of order.items) {
        if (!totals[item.productId]) {
          totals[item.productId] = { qty: 0, count: 0, name: item.name };
        }
        totals[item.productId].qty += Number(item.quantity);
        totals[item.productId].count += 1;
      }
    }

    const aggregated = Object.entries(totals).map(([prodId, val]) => ({
      productId: Number(prodId),
      name: val.name,
      averageQty: val.qty / val.count,
    }));

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `
You are a B2B replenishment assistant. Predict bulk orders based on client purchase logs:
${JSON.stringify(aggregated)}

Reply with JSON format ONLY:
[
  {
    "productId": number,
    "name": "string",
    "suggestedQty": number,
    "reason": "string describing trends (e.g. seasonal demand peaks, routine growth)"
  }
]
`;
        const result = await model.generateContent(prompt);
        const text = (await result.response).text().trim();
        return JSON.parse(text);
      } catch (err) {
        console.error('❌ Gemini B2B bulk prediction failed:', err);
      }
    }

    return aggregated.map((item) => ({
      productId: item.productId,
      name: item.name,
      suggestedQty: Math.ceil(item.averageQty * 1.5),
      reason: 'Calculated using historic averages + 50% seasonal safety margin.',
    }));
  }

  async listWholesaleOrders(vendorId: number): Promise<WholesaleOrder[]> {
    return this.wholesaleRepo.find({ where: { vendorId }, order: { createdAt: 'DESC' } });
  }

  async createWholesaleOrder(vendorId: number, items: { productId: number; quantity: number }[]): Promise<WholesaleOrder> {
    const list: any[] = [];
    let grandTotal = 0;

    for (const item of items) {
      const prod = await this.productRepo.findOne({ where: { id: item.productId } });
      if (!prod) continue;

      const b2bUnitPrice = Number(prod.price) * 0.70;
      const subtotal = b2bUnitPrice * item.quantity;
      grandTotal += subtotal;

      list.push({
        productId: prod.id,
        name: prod.name,
        price: b2bUnitPrice,
        quantity: item.quantity,
      });
    }

    const order = this.wholesaleRepo.create({
      vendorId,
      items: list,
      total: grandTotal,
      status: 'pending',
    });

    return this.wholesaleRepo.save(order);
  }
}
