import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class BulkExportService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async exportToCsv(): Promise<string> {
    const products = await this.productRepo.find({
      order: { id: 'ASC' },
    });

    const headers = [
      'id',
      'name',
      'price',
      'mrp',
      'discountpercent',
      'category',
      'stock',
      'brand',
      'rating',
      'ratingcount',
      'description',
      'image',
    ];
    const csvRows = [headers.join(',')];

    for (const product of products) {
      const row = [
        product.id,
        this.escapeCsvValue(product.name),
        product.price,
        product.mrp ?? '',
        product.discountPercent,
        this.escapeCsvValue(product.category),
        product.stock,
        this.escapeCsvValue(product.brand),
        product.rating,
        product.ratingCount,
        this.escapeCsvValue(product.description),
        this.escapeCsvValue(product.image),
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\r\n');
  }

  private escapeCsvValue(val: any): string {
    if (val === null || val === undefined) return '';
    const stringVal = String(val);
    if (
      stringVal.includes(',') ||
      stringVal.includes('"') ||
      stringVal.includes('\n') ||
      stringVal.includes('\r')
    ) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  }
}
