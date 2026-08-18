import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoutine } from './user-routine.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class RoutinesService {
  constructor(
    @InjectRepository(UserRoutine)
    private readonly routineRepo: Repository<UserRoutine>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async analyze(answers: {
    skinType: string;
    primaryConcern: string;
  }): Promise<any> {
    const { skinType, primaryConcern } = answers;
    const allProducts = await this.productRepo.find();

    const morningProducts: Product[] = [];
    const nightProducts: Product[] = [];

    // Simple robust keyword parsing to separate morning/night items
    for (const p of allProducts) {
      const matchText =
        `${p.name} ${p.description} ${p.category}`.toLowerCase();

      const skinMatch =
        !skinType ||
        matchText.includes(skinType.toLowerCase()) ||
        skinType.toLowerCase() === 'normal';
      const concernMatch =
        !primaryConcern ||
        matchText.includes(primaryConcern.replace('_', ' ').toLowerCase());

      if (skinMatch || concernMatch) {
        if (
          matchText.includes('day') ||
          matchText.includes('sun') ||
          matchText.includes('wash') ||
          matchText.includes('cleanser')
        ) {
          if (morningProducts.length < 3) morningProducts.push(p);
        } else if (
          matchText.includes('night') ||
          matchText.includes('retinol') ||
          matchText.includes('mask') ||
          matchText.includes('serum') ||
          matchText.includes('cream')
        ) {
          if (nightProducts.length < 3) nightProducts.push(p);
        }
      }
    }

    // Fallbacks if lists are empty
    if (morningProducts.length === 0)
      morningProducts.push(...allProducts.slice(0, 2));
    if (nightProducts.length === 0)
      nightProducts.push(...allProducts.slice(2, 4));

    return {
      name: `Custom ${skinType || 'Daily'} Skin Routine`,
      morning: morningProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
      })),
      night: nightProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
      })),
    };
  }

  async saveRoutine(
    name: string,
    products: any,
    userId: number,
  ): Promise<UserRoutine> {
    const routine = this.routineRepo.create({
      userId,
      name,
      products,
      isActive: true,
    });
    return this.routineRepo.save(routine);
  }

  async list(userId: number): Promise<UserRoutine[]> {
    return this.routineRepo.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getRoutine(id: number, userId: number): Promise<UserRoutine> {
    return this.routineRepo.findOneOrFail({ where: { id, userId } });
  }
}
