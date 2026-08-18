import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeautyBox } from './beauty-box.entity';

@Injectable()
export class BeautyBoxesService {
  constructor(
    @InjectRepository(BeautyBox)
    private readonly boxRepo: Repository<BeautyBox>,
  ) {
    this.seedDefaultBoxes();
  }

  private async seedDefaultBoxes() {
    try {
      const count = await this.boxRepo.count();
      if (count === 0) {
        const defaults = [
          {
            name: 'Glow Essentials Discovery Box',
            description:
              'Unbox the secrets to radiant skin. Features clarifying face washes, vitamin C glow boosters, and skin firming creams.',
            price: 1499.0,
            imageUrl:
              'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400',
            items: [
              { name: 'Foaming Cleanser', size: '50ml' },
              { name: 'Vitamin C Brightening Serum', size: '15ml' },
              { name: 'Hydrating Gel Moisturizer', size: '30ml' },
            ],
            isActive: true,
          },
          {
            name: 'Matte Finish Makeup Box',
            description:
              'All-day matte look beauty kit. Curated primers, setting sprays, and ultra-wear foundation samples.',
            price: 1999.0,
            imageUrl:
              'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400',
            items: [
              { name: 'Poreless Matte Primer', size: '20ml' },
              { name: 'Longwear Liquid Foundation', size: '15ml' },
              { name: 'Oil Control Setting Spray', size: '30ml' },
            ],
            isActive: true,
          },
        ];
        await this.boxRepo.save(this.boxRepo.create(defaults));
        console.log('🌱 Seeded default Beauty Discovery Boxes');
      }
    } catch (err: any) {
      console.error('Failed to seed beauty boxes:', err.message);
    }
  }

  async list(): Promise<BeautyBox[]> {
    return this.boxRepo.find({ where: { isActive: true } });
  }

  async get(id: number): Promise<BeautyBox> {
    return this.boxRepo.findOneOrFail({ where: { id } });
  }

  async create(payload: Partial<BeautyBox>): Promise<BeautyBox> {
    const box = this.boxRepo.create(payload);
    return this.boxRepo.save(box);
  }

  async update(id: number, payload: Partial<BeautyBox>): Promise<BeautyBox> {
    await this.boxRepo.update(id, payload);
    return this.get(id);
  }

  async delete(id: number): Promise<void> {
    await this.boxRepo.delete(id);
  }
}
