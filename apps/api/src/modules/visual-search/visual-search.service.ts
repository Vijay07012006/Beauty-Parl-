/* eslint-disable */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HfInference } from '@huggingface/inference';
import { ProductEmbedding } from './product-embedding.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class VisualSearchService implements OnModuleInit {
  private hf: HfInference | null = null;
  private readonly MODEL_NAME = 'sentence-transformers/clip-ViT-B-32';
  private readonly TARGET_DIMENSION = 768;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ProductEmbedding)
    private readonly embeddingRepository: Repository<ProductEmbedding>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    const apiKey =
      this.configService.get<string>('HUGGINGFACE_API_KEY') ||
      process.env.HUGGINGFACE_API_KEY;
    if (apiKey) {
      this.hf = new HfInference(apiKey);
    } else {
      console.warn(
        '⚠️ HUGGINGFACE_API_KEY is not set. Visual search embeddings will not be generated.',
      );
    }
  }

  onModuleInit() {
    // Run background seeding asynchronously so NestJS startup is not blocked.
    this.seedEmbeddings().catch((err) => {
      console.error('❌ Error during background visual search seeding:', err);
    });
  }

  async generateEmbedding(imageBuffer: Buffer): Promise<number[]> {
    const apiKey =
      this.configService.get<string>('HUGGINGFACE_API_KEY') ||
      process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      throw new Error('Hugging Face API key is not configured.');
    }

    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32',
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/octet-stream',
          },
          method: 'POST',
          body: new Uint8Array(imageBuffer),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ HF API Error: ${response.status} - ${error}`);
        throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
      }

      const result = (await response.json()) as any;
      let vector: number[] = [];
      if (Array.isArray(result)) {
        if (Array.isArray(result[0])) {
          vector = result[0] as number[];
        } else {
          vector = result as number[];
        }
      }

      if (vector.length === 0) {
        throw new Error('Failed to extract vector features from image.');
      }

      // Pad/clip vector to fit target dimension (768)
      if (vector.length < this.TARGET_DIMENSION) {
        const padding = new Array(this.TARGET_DIMENSION - vector.length).fill(
          0,
        );
        vector = [...vector, ...padding];
      } else if (vector.length > this.TARGET_DIMENSION) {
        vector = vector.slice(0, this.TARGET_DIMENSION);
      }

      return vector;
    } catch (err: any) {
      console.error(
        `❌ Hugging Face feature extraction failed via direct fetch:`,
        err.message || err,
      );
      throw err;
    }
  }

  /**
   * Performs cosine similarity search using pgvector operator <=>
   */
  async searchByImage(
    imageBuffer: Buffer,
    limit: number = 10,
  ): Promise<Product[]> {
    const queryEmbedding = await this.generateEmbedding(imageBuffer);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Query similar products. <=> operator is Cosine Distance. Lower distance is closer/more similar.
    const rawResults = await this.productRepository.query(
      `
      SELECT p.*, (1 - (pe.embedding <=> $1::vector)) as similarity
      FROM products p
      JOIN product_embeddings pe ON p.id = pe.product_id
      ORDER BY pe.embedding <=> $1::vector ASC
      LIMIT $2
      `,
      [vectorString, limit],
    );

    // Coerce raw database fields to match TypeORM entity types
    return rawResults.map((row: any) => ({
      id: Number(row.id),
      name: row.name,
      description: row.description,
      price: Number(row.price),
      mrp: row.mrp !== null ? Number(row.mrp) : undefined,
      discountPercent: Number(row.discountPercent),
      image: row.image,
      category: row.category,
      stock: Number(row.stock),
      rating: Number(row.rating),
      ratingCount: Number(row.ratingCount),
      brand: row.brand,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  private getBaseUrl(): string {
    let url = this.configService.get<string>('FRONTEND_URL') ||
              process.env.FRONTEND_URL ||
              process.env.VERCEL_URL ||
              process.env.RENDER_EXTERNAL_URL ||
              'http://localhost:3000';

    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/$/, '');
  }

  /**
   * Seed missing product embeddings in the background
   */
  private async seedEmbeddings() {
    if (!this.hf) return;

    // Wait 10 seconds after boot to let app settle
    await new Promise((resolve) => setTimeout(resolve, 10000));

    try {
      const products = await this.productRepository
        .createQueryBuilder('product')
        .leftJoin(ProductEmbedding, 'pe', 'pe.productId = product.id')
        .where('pe.productId IS NULL')
        .getMany();

      if (products.length === 0) {
        console.log(`ℹ️ All products already have visual search embeddings.`);
        return;
      }

      console.log(
        `ℹ️ Checking visual search embeddings: ${products.length} products need embeddings.`,
      );

      let seededCount = 0;
      const baseUrl = this.getBaseUrl();

      for (const product of products) {
        if (!product.image) continue;

        try {
          console.log(
            `🖼️ Seeding visual embedding for product ${product.id} (${product.name})...`,
          );
          const imageUrl = product.image.startsWith('http')
            ? product.image
            : `${baseUrl}/${product.image.replace(/^\//, '')}`;

          const response = await fetch(imageUrl);
          if (!response.ok) {
            console.warn(`⚠️ Skipping embedding for product ${product.id}: Image not accessible`);
            continue;
          }

          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const embedding = await this.generateEmbedding(buffer);

          const entity = new ProductEmbedding();
          entity.productId = product.id;
          entity.embedding = embedding;

          await this.embeddingRepository.save(entity);
          seededCount++;

          // Add 1s delay to respect Hugging Face API rate limits
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (err: any) {
          console.warn(
            `⚠️ Skipping embedding for product ${product.id}: Image not accessible`,
          );
        }
      }

      if (seededCount > 0) {
        console.log(
          `✅ Visual search seeding complete. Added embeddings for ${seededCount} products.`,
        );
      }
    } catch (err: any) {
      console.error('❌ Error during background visual search seeding:', err.message || err);
    }
  }
}
