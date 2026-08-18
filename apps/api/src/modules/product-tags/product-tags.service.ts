import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductTag } from './product-tag.entity';
import { ProductTagMapping } from './product-tag-mapping.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class ProductTagsService implements OnModuleInit {
  constructor(
    @InjectRepository(ProductTag)
    private readonly tagRepo: Repository<ProductTag>,
    @InjectRepository(ProductTagMapping)
    private readonly mappingRepo: Repository<ProductTagMapping>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultTags();
  }

  private async seedDefaultTags() {
    try {
      const count = await this.tagRepo.count();
      if (count === 0) {
        const defaults: Array<Partial<ProductTag>> = [
          { name: 'Vegan', icon: '🌱', category: 'benefit' },
          { name: 'Cruelty-Free', icon: '🐰', category: 'benefit' },
          { name: 'Paraben-Free', icon: '🧪', category: 'ingredient' },
          { name: 'Sulfate-Free', icon: '💧', category: 'ingredient' },
          { name: 'Fragrance-Free', icon: '🌸', category: 'ingredient' },
          { name: 'Sustainable', icon: '♻️', category: 'benefit' },
          { name: 'Hypoallergenic', icon: '🛡️', category: 'concern' },
          { name: 'SPF Protection', icon: '☀️', category: 'benefit' },
          { name: 'Anti-Aging', icon: '✨', category: 'concern' },
          { name: 'Hydrating', icon: '💦', category: 'benefit' },
          { name: 'Oil-Free', icon: '🫧', category: 'ingredient' },
          { name: 'Natural', icon: '🍃', category: 'benefit' },
        ];
        await this.tagRepo.save(this.tagRepo.create(defaults));
        console.log('🌱 Seeded default product tags');
      }
    } catch (err: any) {
      console.error('Failed to seed product tags:', err.message);
    }
  }

  async findAll(): Promise<ProductTag[]> {
    return this.tagRepo.find({ order: { category: 'ASC', name: 'ASC' } });
  }

  async addTagsToProduct(productId: number, tagIds: number[]): Promise<void> {
    // Remove existing
    await this.mappingRepo.delete({ productId });
    // Insert new
    const mappings = tagIds.map((tagId) =>
      this.mappingRepo.create({ productId, tagId }),
    );
    await this.mappingRepo.save(mappings);
  }

  async getTagsForProduct(productId: number): Promise<ProductTag[]> {
    const mappings = await this.mappingRepo.find({
      where: { productId },
      relations: ['tag'],
    });
    return mappings.map((m) => m.tag!).filter(Boolean);
  }

  async getProductsByTags(tagNames: string[]): Promise<number[]> {
    if (!tagNames.length) return [];
    // Find tag IDs
    const tags = await this.tagRepo.find({ where: { name: In(tagNames) } });
    if (!tags.length) return [];
    const tagIds = tags.map((t) => t.id);
    // Find products that have ALL these tags (intersection)
    const raw: { productId: number; cnt: string }[] = await this.mappingRepo
      .createQueryBuilder('m')
      .select('m.productId', 'productId')
      .addSelect('COUNT(m.tagId)', 'cnt')
      .where('m.tagId IN (:...tagIds)', { tagIds })
      .groupBy('m.productId')
      .having('COUNT(m.tagId) >= :required', { required: tagIds.length })
      .getRawMany();
    return raw.map((r) => r.productId);
  }
}
