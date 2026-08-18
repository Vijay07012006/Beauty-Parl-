import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Look } from './look.entity';
import { LookProduct } from './look-product.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class LooksService implements OnModuleInit {
  constructor(
    @InjectRepository(Look)
    private readonly lookRepo: Repository<Look>,
    @InjectRepository(LookProduct)
    private readonly lpRepo: Repository<LookProduct>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultLooks();
  }

  private async seedDefaultLooks() {
    try {
      const count = await this.lookRepo.count();
      if (count === 0) {
        const defaults: Array<Partial<Look>> = [
          {
            name: 'Date Night Glam',
            slug: 'date-night-glam',
            description:
              'Sultry, bold looks for a perfect evening out. Deep tones, dewy skin, and defined eyes.',
            occasion: 'Date Night',
            imageUrl:
              'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800&q=80',
            skinType: 'All',
            isActive: true,
          },
          {
            name: 'Office Ready',
            slug: 'office-ready',
            description:
              'Polished and professional. Clean skin, subtle lip, and neat brows.',
            occasion: 'Office',
            imageUrl:
              'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&q=80',
            skinType: 'All',
            isActive: true,
          },
          {
            name: 'Dewy Skin Glow',
            slug: 'dewy-skin-glow',
            description:
              'Glass skin meets effortless glow. Minimalist makeup, maximum radiance.',
            occasion: 'Casual',
            imageUrl:
              'https://images.unsplash.com/photo-1515688594390-b649af70d282?w=800&q=80',
            skinType: 'Dry',
            isActive: true,
          },
          {
            name: 'Festival Vibes',
            slug: 'festival-vibes',
            description:
              'Bold colors, glitter, and statement looks for festival season.',
            occasion: 'Festival',
            imageUrl:
              'https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&q=80',
            skinType: 'All',
            isActive: true,
          },
          {
            name: 'Bridal Bliss',
            slug: 'bridal-bliss',
            description:
              'Timeless bridal beauty — luminous foundation, flushed cheeks, and delicate lips.',
            occasion: 'Bridal',
            imageUrl:
              'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
            skinType: 'All',
            isActive: true,
          },
          {
            name: 'No-Makeup Makeup',
            slug: 'no-makeup-makeup',
            description:
              'Your skin but better. Light coverage, natural tones, and fresh glow.',
            occasion: 'Everyday',
            imageUrl:
              'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=800&q=80',
            skinType: 'Oily',
            isActive: true,
          },
        ];
        const saved = await this.lookRepo.save(this.lookRepo.create(defaults));
        // Assign first few products to looks (if products exist)
        const products = await this.productRepo.find({ take: 12 });
        if (products.length >= 3) {
          for (const look of saved) {
            const slice = products.splice(0, 2);
            const lps = slice.map((p, i) =>
              this.lpRepo.create({
                lookId: look.id,
                productId: p.id,
                position: i,
              }),
            );
            await this.lpRepo.save(lps);
          }
        }
        console.log('🌱 Seeded default Looks catalog');
      }
    } catch (err: any) {
      console.error('Failed to seed looks:', err.message);
    }
  }

  async findAll(): Promise<any[]> {
    const looks = await this.lookRepo.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
    const result = await Promise.all(
      looks.map(async (look) => {
        const count = await this.lpRepo.count({ where: { lookId: look.id } });
        return { ...look, productCount: count };
      }),
    );
    return result;
  }

  async findBySlug(slug: string): Promise<any> {
    const look = await this.lookRepo.findOne({
      where: { slug, isActive: true },
    });
    if (!look) throw new NotFoundException(`Look "${slug}" not found`);
    const lookProducts = await this.lpRepo.find({
      where: { lookId: look.id },
      relations: ['product'],
      order: { position: 'ASC' },
    });
    const products = lookProducts.map((lp) => lp.product).filter(Boolean);
    return { ...look, products };
  }

  async create(data: Partial<Look>): Promise<Look> {
    return this.lookRepo.save(this.lookRepo.create(data));
  }

  async update(id: number, data: Partial<Look>): Promise<Look> {
    await this.lookRepo.update(id, data);
    const look = await this.lookRepo.findOne({ where: { id } });
    if (!look) throw new NotFoundException('Look not found');
    return look;
  }

  async delete(id: number): Promise<void> {
    await this.lookRepo.delete(id);
  }

  async addProductsToLook(lookId: number, productIds: number[]): Promise<void> {
    await this.lpRepo.delete({ lookId });
    const lps = productIds.map((pid, i) =>
      this.lpRepo.create({ lookId, productId: pid, position: i }),
    );
    await this.lpRepo.save(lps);
  }
}
