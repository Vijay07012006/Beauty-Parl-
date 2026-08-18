import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HfInference } from '@huggingface/inference';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';

interface ScoredProduct {
  product: Product;
  score: number;
}

@Injectable()
export class SemanticSearchService {
  private hf: HfInference | null = null;
  private readonly CACHE_TTL = 120000;
  private readonly EMBEDDING_MODEL = 'Supabase/gte-small';

  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {
    const apiKey = this.configService.get<string>('HUGGINGFACE_API_KEY');
    if (apiKey) {
      this.hf = new HfInference(apiKey);
    }
  }

  async search(
    q: string,
    limit: number = 10,
  ): Promise<{ products: Product[]; total: number; fromCache: boolean }> {
    const query = q.trim();
    if (!query) {
      return { products: [], total: 0, fromCache: false };
    }

    const cacheKey = `semantic_search:${query.toLowerCase()}:${limit}`;
    const cached = await this.cacheManager.get<{
      products: Product[];
      total: number;
    }>(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    const result = await this.doSearch(query, limit);

    if (result.products.length > 0) {
      await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    }

    return { ...result, fromCache: false };
  }

  private async doSearch(
    query: string,
    limit: number,
  ): Promise<{ products: Product[]; total: number }> {
    let scoredProducts: ScoredProduct[] = [];
    let usedSemantic = false;

    if (this.hf) {
      try {
        scoredProducts = await this.semanticSearch(query, limit);
        usedSemantic = scoredProducts.length > 0;
      } catch (err) {
        console.warn(
          'Semantic search failed, falling back to keyword search:',
          (err as any)?.message || err,
        );
      }
    }

    if (!usedSemantic) {
      scoredProducts = await this.keywordSearchWithRanking(query);
    }

    const sorted = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      products: sorted.map((s) => s.product),
      total: scoredProducts.length,
    };
  }

  private async semanticSearch(
    query: string,
    limit: number,
  ): Promise<ScoredProduct[]> {
    if (!this.hf) return [];

    const allProducts = await this.productRepository.find();
    if (allProducts.length === 0) return [];

    const queryEmbedding = await this.getEmbedding(query);
    if (!queryEmbedding.length) return [];

    const scored: ScoredProduct[] = [];

    // H-5: product text embeddings are cached (by text hash) so the N+1 external
    // embedding calls happen once per unique product, not once per search.
    for (let i = 0; i < allProducts.length; i++) {
      const p = allProducts[i];
      const text = `${p.name} ${p.brand || ''} ${p.category || ''} ${p.description}`;
      const productEmbedding = await this.getCachedEmbedding(text);
      if (!productEmbedding.length) continue;
      const similarity = this.cosineSimilarity(
        queryEmbedding,
        productEmbedding,
      );
      scored.push({ product: p, score: similarity });
    }

    return scored;
  }

  private async getCachedEmbedding(text: string): Promise<number[]> {
    const key = `embedding:${Buffer.from(text).toString('base64url').slice(0, 64)}`;
    const cached = await this.cacheManager.get<number[]>(key);
    if (cached) return cached;

    const embedding = await this.getEmbedding(text);
    if (embedding.length > 0) {
      // Cache embeddings for 24h — products are rarely updated
      await this.cacheManager
        .set(key, embedding, 24 * 60 * 60 * 1000)
        .catch(() => {});
    }
    return embedding;
  }

  private async getEmbedding(text: string): Promise<number[]> {
    if (!this.hf) return [];

    const result = await this.hf.featureExtraction({
      model: this.EMBEDDING_MODEL,
      inputs: text,
    });

    if (Array.isArray(result) && result.length > 0) {
      const first = result[0];
      if (Array.isArray(first) && typeof first[0] === 'number') {
        return first as number[];
      }
      if (typeof first === 'number') {
        return result as number[];
      }
    }
    return [];
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a.length || !b.length || a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async keywordSearchWithRanking(
    query: string,
  ): Promise<ScoredProduct[]> {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (terms.length === 0) return [];

    const exactPhrase = query.toLowerCase();
    const qb = this.productRepository.createQueryBuilder('product');

    const orConditions: string[] = [];
    const parameters: Record<string, string> = {};

    terms.forEach((term, idx) => {
      const paramKey = `term_${idx}`;
      parameters[paramKey] = `%${term}%`;
      orConditions.push(
        `(LOWER(product.name) ILIKE :${paramKey} OR LOWER(product.description) ILIKE :${paramKey} OR LOWER(product.brand) ILIKE :${paramKey} OR LOWER(product.category) ILIKE :${paramKey})`,
      );
    });

    if (orConditions.length > 0) {
      qb.where(`(${orConditions.join(' OR ')})`, parameters);
    }

    const products: Product[] = await qb.getMany();
    return this.scoreProducts(terms, exactPhrase, products);
  }

  private scoreProducts(
    terms: string[],
    exactPhrase: string,
    products: Product[],
  ): ScoredProduct[] {
    const scored: ScoredProduct[] = [];

    for (const product of products) {
      const name = product.name?.toLowerCase() || '';
      const desc = product.description?.toLowerCase() || '';
      const brand = product.brand?.toLowerCase() || '';
      const category = product.category?.toLowerCase() || '';
      const fullText = `${name} ${desc} ${brand} ${category}`;

      let score = 0;

      if (fullText.includes(exactPhrase)) {
        score += 10;
      }
      if (name.includes(exactPhrase)) {
        score += 8;
      }
      if (brand === exactPhrase || category === exactPhrase) {
        score += 6;
      }

      for (const term of terms) {
        if (name === term) score += 5;
        if (name.includes(term)) score += 3;
        if (brand === term) score += 4;
        if (brand.includes(term)) score += 2;
        if (category === term) score += 4;
        if (category.includes(term)) score += 2;
        if (desc.includes(term)) score += 1;
      }

      const editBoost = terms.reduce((acc, term) => {
        const fuzzyName = this.fuzzyMatch(term, name);
        const fuzzyBrand = this.fuzzyMatch(term, brand);
        const fuzzyCat = this.fuzzyMatch(term, category);
        return acc + Math.max(fuzzyName, fuzzyBrand, fuzzyCat);
      }, 0);
      score += editBoost * 0.5;

      if (product.rating >= 4.5) score += 0.5;
      if (product.stock > 0) score += 0.2;

      scored.push({ product, score });
    }

    return scored;
  }

  private fuzzyMatch(term: string, target: string): number {
    if (!term || !target) return 0;
    if (target.includes(term)) return 0;
    const words = target.split(/\s+/);
    for (const word of words) {
      const dist = this.levenshteinDistance(term, word);
      const maxLen = Math.max(term.length, word.length);
      if (maxLen === 0) continue;
      const similarity = 1 - dist / maxLen;
      if (similarity >= 0.75) {
        return similarity * 2;
      }
    }
    return 0;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1),
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}
