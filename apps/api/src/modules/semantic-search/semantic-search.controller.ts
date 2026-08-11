import { Controller, Get, Query, HttpCode, HttpStatus, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
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
    return this.semanticSearchService.search(q, limit);
  }
}
