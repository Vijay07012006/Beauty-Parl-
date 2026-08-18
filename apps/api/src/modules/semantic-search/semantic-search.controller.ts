import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { SemanticSearchService } from './semantic-search.service';
import { Product } from '../products/product.entity';

@Controller('semantic-search')
export class SemanticSearchController {
  constructor(private readonly semanticSearchService: SemanticSearchService) {}

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async search(
    @Query('q') q: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{ products: Product[]; total: number; fromCache: boolean }> {
    // H-5: bound the query length to prevent free/abusive embedding cost and cache-key bloat
    if (typeof q !== 'string' || !q.trim() || q.length > 200) {
      throw new BadRequestException(
        'Query must be a non-empty string up to 200 characters',
      );
    }
    const safeLimit = Math.min(50, Math.max(1, limit));
    return this.semanticSearchService.search(q, safeLimit);
  }
}
