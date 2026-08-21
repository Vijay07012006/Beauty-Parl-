import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ABTest } from './entities/ab-test.entity';

@Injectable()
export class ABTestingService implements OnModuleInit {
  constructor(
    @InjectRepository(ABTest)
    private readonly abTestRepo: Repository<ABTest>,
  ) {}

  async onModuleInit() {
    const count = await this.abTestRepo.count();
    if (count === 0) {
      await this.createTest('PriceDisplayDiscount', 'show-price', 'show-discount', 0.5);
      console.log('🌱 Seeded default A/B Test experiment "PriceDisplayDiscount".');
    }
  }

  async createTest(name: string, variantA: string, variantB: string, allocation: number): Promise<ABTest> {
    const test = this.abTestRepo.create({
      name,
      variantA,
      variantB,
      allocation,
    });
    return this.abTestRepo.save(test);
  }

  async listActiveTests(): Promise<ABTest[]> {
    return this.abTestRepo.find({
      order: { id: 'DESC' },
    });
  }

  async getVariantForUser(userId: string | number, testName: string): Promise<string> {
    const test = await this.abTestRepo.findOne({ where: { name: testName } });
    if (!test) {
      return 'A';
    }

    const hash = crypto.createHash('md5').update(`${userId}:${test.name}`).digest('hex');
    const percent = parseInt(hash.substring(0, 8), 16) % 100;
    return percent < (Number(test.allocation) * 100) ? test.variantB : test.variantA;
  }
}
