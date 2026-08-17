import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FlashSale } from './flash-sale.entity';

@Injectable()
export class FlashSalesService {
  constructor(
    @InjectRepository(FlashSale)
    private readonly flashSaleRepo: Repository<FlashSale>,
  ) {}

  async createFlashSale(data: {
    name: string;
    description?: string;
    discountPercentage: number;
    startTime: Date;
    endTime: Date;
    productIds: number[];
  }): Promise<FlashSale> {
    const sale = this.flashSaleRepo.create({
      name: data.name,
      description: data.description,
      discountPercentage: data.discountPercentage,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      isActive: true,
      products: data.productIds.map(id => ({ id } as any)),
    });
    return this.flashSaleRepo.save(sale);
  }

  async getActiveFlashSales(): Promise<FlashSale[]> {
    const now = new Date();
    return this.flashSaleRepo.find({
      where: {
        isActive: true,
        startTime: LessThanOrEqual(now),
        endTime: MoreThanOrEqual(now),
      },
      relations: ['products'],
    });
  }

  async getFlashSaleById(id: number): Promise<FlashSale> {
    const sale = await this.flashSaleRepo.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!sale) {
      throw new NotFoundException('Flash sale not found');
    }
    return sale;
  }
}
