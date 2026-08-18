import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class BulkImportService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async importFromCsv(
    csvContent: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    if (!csvContent || !csvContent.trim()) {
      throw new BadRequestException('CSV content is empty');
    }

    const lines = csvContent
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);
    if (lines.length <= 1) {
      throw new BadRequestException(
        'CSV does not contain any product rows (only headers or empty)',
      );
    }

    // Parse headers
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    // Find index maps
    const nameIdx = headers.indexOf('name');
    const priceIdx = headers.indexOf('price');
    const categoryIdx = headers.indexOf('category');
    const stockIdx = headers.indexOf('stock');
    const descIdx = headers.indexOf('description');
    const mrpIdx = headers.indexOf('mrp');
    const brandIdx = headers.indexOf('brand');
    const discountIdx = headers.indexOf('discountpercent');
    const imageIdx = headers.indexOf('image');

    if (
      nameIdx === -1 ||
      priceIdx === -1 ||
      categoryIdx === -1 ||
      stockIdx === -1
    ) {
      throw new BadRequestException(
        'CSV headers must include name, price, category, and stock',
      );
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Parse each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Handle simple comma separation (ignoring commas inside quotes for advanced support if needed, but standard splits are fine)
      const values = this.parseCsvLine(line);

      if (
        values.length <
        Math.max(nameIdx, priceIdx, categoryIdx, stockIdx) + 1
      ) {
        failedCount++;
        errors.push(`Row ${i + 1}: Insufficient column values.`);
        continue;
      }

      const name = values[nameIdx]?.trim();
      const priceVal = values[priceIdx]?.trim();
      const category = values[categoryIdx]?.trim() || 'General';
      const stockVal = values[stockIdx]?.trim();
      const description =
        descIdx !== -1 ? values[descIdx]?.trim() : 'No description available';
      const mrpVal = mrpIdx !== -1 ? values[mrpIdx]?.trim() : null;
      const brand = brandIdx !== -1 ? values[brandIdx]?.trim() : 'Beauty Parlé';
      const discountVal =
        discountIdx !== -1 ? values[discountIdx]?.trim() : '0';
      const image = imageIdx !== -1 ? values[imageIdx]?.trim() : '';

      if (!name) {
        failedCount++;
        errors.push(`Row ${i + 1}: Name is required.`);
        continue;
      }

      const price = parseFloat(priceVal);
      if (isNaN(price) || price < 0) {
        failedCount++;
        errors.push(`Row ${i + 1}: Invalid price "${priceVal}".`);
        continue;
      }

      const stock = parseInt(stockVal, 10);
      if (isNaN(stock) || stock < 0) {
        failedCount++;
        errors.push(`Row ${i + 1}: Invalid stock "${stockVal}".`);
        continue;
      }

      const discountPercent = parseInt(discountVal, 10) || 0;
      const mrp = mrpVal ? parseFloat(mrpVal) : undefined;

      try {
        const product = this.productRepo.create({
          name,
          price,
          category,
          stock,
          description: description || 'No description available',
          mrp,
          brand,
          discountPercent,
          image: image || undefined,
          rating: 4.5,
          ratingCount: 0,
        });

        await this.productRepo.save(product);
        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`Row ${i + 1}: Database save failed - ${err.message}`);
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      errors,
    };
  }

  // Simple RFC 4180 CSV line parser to handle quotes containing commas
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}
