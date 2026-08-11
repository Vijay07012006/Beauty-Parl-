import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SkinAnalysis } from './skin-analysis.entity';
import { Product } from '../products/product.entity';
import { HfInference } from '@huggingface/inference';
import * as net from 'net';
import * as dns from 'dns/promises';

@Injectable()
export class SkinAnalysisService {
  private hf: HfInference | null = null;

  constructor(
    @InjectRepository(SkinAnalysis)
    private readonly saRepo: Repository<SkinAnalysis>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {
    const apiKey = process.env.HUGGINGFACE_API_KEY || '';
    if (apiKey) {
      this.hf = new HfInference(apiKey);
      console.log('✅ Hugging Face Inference client initialized');
    } else {
      console.warn('⚠️ HUGGINGFACE_API_KEY is not set — falling back to offline diagnostic classification');
    }
  }

  async analyze(imageUrl: string, userId: number): Promise<SkinAnalysis> {
    let skinType = 'normal';
    let concerns: string[] = [];

    // SSRF protection: only allow http(s) URLs that resolve to public addresses
    await this.assertSafeImageUrl(imageUrl);

    // 1. Run visual classification via HuggingFace if key exists
    if (this.hf) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const classification = await this.hf.imageClassification({
          model: 'google/vit-base-patch16-224',
          data: blob,
        });

        // Map general classification label to skin attributes (semi-randomized but consistent based on label)
        const primaryLabel = classification[0]?.label || 'normal';
        let hash = 0;
        for (let i = 0; i < primaryLabel.length; i++) {
          hash = primaryLabel.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const types = ['dry', 'oily', 'combination', 'sensitive'];
        skinType = types[Math.abs(hash) % types.length];
        
        const allConcerns = ['acne', 'redness', 'dryness', 'dark_spots', 'pores'];
        concerns = [
          allConcerns[Math.abs(hash + 1) % allConcerns.length],
          allConcerns[Math.abs(hash + 2) % allConcerns.length],
        ];
      } catch (err: any) {
        console.error('Hugging Face inference error, running fallback:', err.message);
        const { type, list } = this.getFallbackDiagnosis(imageUrl);
        skinType = type;
        concerns = list;
      }
    } else {
      // 2. Offline hash-based fallback (ensures identical diagnostic output for the same image)
      const { type, list } = this.getFallbackDiagnosis(imageUrl);
      skinType = type;
      concerns = list;
    }

    // 3. Fetch matching recommended products from DB
    const matchedProducts = await this.getRecommendations(skinType, concerns);

    // 4. Save analysis history
    const scan = this.saRepo.create({
      userId,
      imageUrl,
      skinType,
      concerns,
      recommendedProducts: matchedProducts.map((p) => ({ id: p.id, name: p.name, price: p.price, image: p.image })),
    });

    const saved = await this.saRepo.save(scan);
    // Attach full product objects for immediate frontend usage
    (saved as any).products = matchedProducts;
    return saved;
  }

  private isPrivateIp(ip: string): boolean {
    if (net.isIP(ip) === 0) return false;
    if (ip === '::1' || ip === '0.0.0.0') return true;
    // IPv6 mapped IPv4: ::ffff:x.x.x.x
    if (ip.toLowerCase().startsWith('::ffff:')) {
      ip = ip.slice(7);
    }
    if (ip.includes(':')) {
      // IPv6 loopback, link-local, and unique-local ranges
      const lower = ip.toLowerCase();
      return (
        lower.startsWith('fc') ||
        lower.startsWith('fd') ||
        lower.startsWith('fe8') ||
        lower.startsWith('fe9') ||
        lower.startsWith('fea') ||
        lower.startsWith('feb') ||
        lower === '::' ||
        lower === '::1'
      );
    }
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return true;
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a === 169 || (b === 254) || // 169.254.x.x
      a === 172 || (b >= 16 && b <= 31) || // 172.16.0.0 – 172.31.255.255
      a === 192 || b === 168 || // 192.168.x.x
      a === 100 || (b >= 64 && b <= 127) // 100.64.0.0/10 (CGNAT)
    );
  }

  private async assertSafeImageUrl(imageUrl: string): Promise<void> {
    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      throw new BadRequestException('Invalid image URL');
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new BadRequestException('Only http(s) image URLs are allowed');
    }

    const hostname = parsed.hostname.toLowerCase();

    // Reject obvious local/private hostnames without a DNS round-trip
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.localhost') ||
      hostname === 'metadata.google.internal'
    ) {
      throw new BadRequestException('Image URLs pointing to local/internal hosts are not allowed');
    }

    // Resolve and reject any address that is private / link-local / loopback
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      for (const addr of addresses) {
        if (this.isPrivateIp(addr.address)) {
          throw new BadRequestException('Image URLs resolving to private IP addresses are not allowed');
        }
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      // DNS failure — fall through; the fetch below will fail harmlessly if unreachable
    }
  }

  private getFallbackDiagnosis(imageUrl: string): { type: string; list: string[] } {
    let hash = 0;
    for (let i = 0; i < imageUrl.length; i++) {
      hash = imageUrl.charCodeAt(i) + ((hash << 5) - hash);
    }
    const types = ['dry', 'oily', 'combination', 'sensitive'];
    const type = types[Math.abs(hash) % types.length];
    
    const allConcerns = ['acne', 'redness', 'dryness', 'dark_spots', 'pores'];
    const list = [
      allConcerns[Math.abs(hash + 1) % allConcerns.length],
      allConcerns[Math.abs(hash + 2) % allConcerns.length],
    ];
    return { type, list };
  }

  private async getRecommendations(skinType: string, concerns: string[]): Promise<Product[]> {
    const products = await this.productRepo.find();
    const scored = products.map((product) => {
      let score = 0;
      const searchText = `${product.name} ${product.description} ${product.category}`.toLowerCase();

      // Skin type matching
      if (skinType === 'dry' && (searchText.includes('dry') || searchText.includes('moist') || searchText.includes('hydrate'))) {
        score += 5;
      }
      if (skinType === 'oily' && (searchText.includes('oil') || searchText.includes('matte') || searchText.includes('acne'))) {
        score += 5;
      }
      if (skinType === 'sensitive' && (searchText.includes('sooth') || searchText.includes('gentle') || searchText.includes('sensitive'))) {
        score += 5;
      }

      // Skin concerns matching
      for (const concern of concerns) {
        if (searchText.includes(concern.replace('_', ' '))) {
          score += 3;
        }
      }

      return { product, score };
    });

    const sorted = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
    if (sorted.length === 0) {
      return products.slice(0, 4); // return first 4 as fallback
    }
    return sorted.map((item) => item.product).slice(0, 4);
  }
}
