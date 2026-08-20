/* eslint-disable */
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QuizResponse } from '../quizzes/quiz-response.entity';
import { Order } from '../orders/order.entity';
import { SkinAnalysis } from '../skin-analysis/skin-analysis.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class SkinDnaService {
  private genAI: GoogleGenerativeAI | null = null;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(QuizResponse)
    private readonly quizRepository: Repository<QuizResponse>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(SkinAnalysis)
    private readonly skinAnalysisRepository: Repository<SkinAnalysis>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    const apiKey =
      this.configService.get<string>('geminiApiKey') ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      console.warn(
        '⚠️ GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY is not set. Skin DNA reports will fall back to mockup data.',
      );
    }
  }

  async getReport(userId: number): Promise<any> {
    const cacheKey = `skin-dna:${userId}`;
    const cachedReport = await this.cacheManager.get<any>(cacheKey);
    if (cachedReport) {
      return cachedReport;
    }

    const report = await this.generateReport(userId);
    await this.cacheManager.set(cacheKey, report, this.CACHE_TTL);
    return report;
  }

  private async generateReport(userId: number): Promise<any> {
    // 1. Fetch user data in parallel
    const [quizzes, orders, analyses, products] = await Promise.all([
      this.quizRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
      this.orderRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
      this.skinAnalysisRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
      this.productRepository.find({
        select: ['id', 'name', 'brand', 'category', 'description'],
      }),
    ]);

    // 2. Format user data for prompt
    const quizAnswers = quizzes.map((q) => q.answers);
    const purchaseHistory = orders.flatMap((o) =>
      Array.isArray(o.items)
        ? o.items.map((i: any) => ({ name: i.name, productId: i.productId }))
        : [],
    );
    const skinAnalysisPhotos = analyses.map((a) => ({
      imageUrl: a.imageUrl,
      skinType: a.skinType,
      concerns: a.concerns,
      createdAt: a.createdAt,
    }));

    // 3. Fallback to mockup data if Gemini is not configured
    if (!this.genAI) {
      console.log('ℹ️ Generating fallback mockup Skin DNA report...');
      return this.getMockupReport(products);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `
You are a leading cosmetic dermatologist and genetic skin specialist.
Analyze the user's skin profile data and generate a comprehensive Skin DNA Report in JSON format.

User Data:
1. Quiz Responses: ${JSON.stringify(quizAnswers)}
2. Purchase History (products they purchased): ${JSON.stringify(purchaseHistory)}
3. Previous Skin Analysis History: ${JSON.stringify(skinAnalysisPhotos)}

Available Products in Store (Recommend exactly 3 products ONLY from this list):
${JSON.stringify(products.slice(0, 40))}

Provide the response in EXACTLY this JSON structure:
{
  "scores": {
    "Hydration": number (1-100 score where higher is better hydration),
    "Elasticity": number (1-100 score where higher is better elasticity),
    "Pigmentation": number (1-100 score where higher means better evenness/less pigmentation),
    "Sensitivity": number (1-100 score where higher means less sensitive skin),
    "Acne Risk": number (1-100 score where higher means lower risk of breakout)
  },
  "summary": "Provide a professional 3-sentence summary of the skin condition, genetic risks, and care direction.",
  "recommendations": [
    {
      "productId": number (the id of the recommended product from the list above),
      "name": "name of the product",
      "reason": "precise 1-sentence reason why this product is recommended based on the Skin DNA analysis"
    }
  ]
}

Ensure that:
1. "scores" has exactly these 5 keys: "Hydration", "Elasticity", "Pigmentation", "Sensitivity", "Acne Risk".
2. "recommendations" contains exactly 3 products with their actual productIds from the list of available products.
3. The response is strict JSON without any surrounding text or markdown blocks.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Clean the response text from markdown block wrappers if present
      const cleanedJson = text
        .replace(/^```json\s*/i, '')
        .replace(/```$/, '')
        .trim();
      const parsedReport = JSON.parse(cleanedJson);

      // Verify that recommendations match products
      parsedReport.recommendations = parsedReport.recommendations.map(
        (rec: any) => {
          const prod = products.find((p) => p.id === Number(rec.productId));
          return {
            productId: prod ? prod.id : products[0]?.id || 1,
            name: prod ? prod.name : rec.name,
            reason: rec.reason || 'Recommended based on skin concerns.',
          };
        },
      );

      return parsedReport;
    } catch (err: any) {
      console.error(
        '❌ Gemini skin DNA generation failed, falling back to mockup:',
        err.message || err,
      );
      return this.getMockupReport(products);
    }
  }

  private getMockupReport(products: Product[]): any {
    // Pick 3 random products or first 3 products
    const selectedRecs = products.slice(0, 3).map((p) => ({
      productId: p.id,
      name: p.name,
      reason: `Matches your profile for targeted skin support and barrier health.`,
    }));

    return {
      scores: {
        Hydration: 72,
        Elasticity: 84,
        Pigmentation: 68,
        Sensitivity: 55,
        'Acne Risk': 78,
      },
      summary:
        'Your skin shows a solid genetic predisposition for collagen elasticity, but suffers from mild transepidermal water loss. There is a moderate sensitivity risk, particularly when exposed to strong surfactants. We recommend a gentle, barrier-restoring routine focused on hydration and soothing agents.',
      recommendations:
        selectedRecs.length > 0
          ? selectedRecs
          : [
              {
                productId: 1,
                name: 'Hydrating Ceramide Cleanser',
                reason: 'Restores skin barrier water levels.',
              },
              {
                productId: 2,
                name: 'Squalane Glow Oil',
                reason: 'Locks in moisture without clogging pores.',
              },
              {
                productId: 3,
                name: 'Centella Soothing Gel',
                reason: 'Calms redness and inflammation.',
              },
            ],
    };
  }
}
