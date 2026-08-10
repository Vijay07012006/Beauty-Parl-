import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Bundle } from './bundle.entity';
import { BundleProduct } from './bundle-product.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class BundlesService implements OnModuleInit {
  constructor(
    @InjectRepository(Bundle)
    private readonly bundleRepo: Repository<Bundle>,
    @InjectRepository(BundleProduct)
    private readonly bpRepo: Repository<BundleProduct>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultBundles();
  }

  private async seedDefaultBundles() {
    try {
      const count = await this.bundleRepo.count();
      if (count === 0) {
        const defaults: Array<Partial<Bundle>> = [
          { name: 'Skincare Starter Kit', description: 'Everything you need for a glowing skincare routine.', discountPercentage: 15, isActive: true },
          { name: 'Makeup Essentials', description: 'Foundation, mascara, and lip color — the holy trinity.', discountPercentage: 10, isActive: true },
          { name: 'Hair Care Duo', description: 'Shampoo + Conditioner — the perfect pair for silky hair.', discountPercentage: 12, isActive: true },
          { name: 'Glow Up Bundle', description: 'Vitamin C serum, moisturizer, and SPF for radiant skin.', discountPercentage: 20, isActive: true },
        ];
        const saved = await this.bundleRepo.save(this.bundleRepo.create(defaults));
        // Assign pairs of products
        const products = await this.productRepo.find({ take: 8 });
        if (products.length >= 4) {
          const pairs = [
            [products[0], products[1]],
            [products[2], products[3]],
            products.slice(0, 2),
            products.slice(1, 4),
          ];
          for (let i = 0; i < saved.length; i++) {
            const bps = (pairs[i] || []).map(p => this.bpRepo.create({ bundleId: saved[i].id, productId: p.id }));
            if (bps.length) await this.bpRepo.save(bps);
          }
        }
        console.log('🌱 Seeded default Bundles catalog');
      }
    } catch (err: any) {
      console.error('Failed to seed bundles:', err.message);
    }
  }

  async findAll(): Promise<any[]> {
    const bundles = await this.bundleRepo.find({ where: { isActive: true }, order: { createdAt: 'ASC' } });
    return Promise.all(bundles.map(b => this.enrichBundle(b)));
  }

  async findOne(id: number): Promise<any> {
    const bundle = await this.bundleRepo.findOne({ where: { id } });
    if (!bundle) return null;
    return this.enrichBundle(bundle);
  }

  private async enrichBundle(bundle: Bundle): Promise<any> {
    const bps = await this.bpRepo.find({ where: { bundleId: bundle.id }, relations: ['product'] });
    const products = bps.map(bp => bp.product).filter(Boolean);
    const originalTotal = products.reduce((sum, p) => sum + Number(p!.price), 0);
    const discountValue = bundle.discountPercentage
      ? (originalTotal * bundle.discountPercentage) / 100
      : Number(bundle.discountAmount || 0);
    return { ...bundle, products, originalTotal, discountValue, finalTotal: originalTotal - discountValue };
  }

  async getRecommended(cartProductIds: number[]): Promise<any[]> {
    if (!cartProductIds.length) return this.findAll();
    // Find bundles that contain any of the cart products
    const bps = await this.bpRepo.find({ where: { productId: In(cartProductIds) } });
    const bundleIds = [...new Set(bps.map(bp => bp.bundleId))];
    if (!bundleIds.length) return this.findAll();
    const bundles = await this.bundleRepo.find({ where: { id: In(bundleIds), isActive: true } });
    return Promise.all(bundles.map(b => this.enrichBundle(b)));
  }

  async create(data: Partial<Bundle>): Promise<Bundle> {
    return this.bundleRepo.save(this.bundleRepo.create(data));
  }

  async update(id: number, data: Partial<Bundle>): Promise<Bundle | null> {
    await this.bundleRepo.update(id, data);
    return this.bundleRepo.findOne({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.bundleRepo.delete(id);
  }
}
