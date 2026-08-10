import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ProductTagsService } from './product-tags.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('product-tags')
export class ProductTagsController {
  constructor(private readonly productTagsService: ProductTagsService) {}

  @Get()
  findAll() {
    return this.productTagsService.findAll();
  }

  @Get('product/:productId')
  getTagsForProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.productTagsService.getTagsForProduct(productId);
  }

  @Post('product/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  setTagsForProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: { tagIds: number[] },
  ) {
    return this.productTagsService.addTagsToProduct(productId, body.tagIds);
  }
}
