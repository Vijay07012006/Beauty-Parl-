import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('product/:productId')
  async getReviews(@Param('productId') productId: number) {
    return this.productsService.findApprovedReviews(productId);
  }

  @Get('product/:productId/rating')
  async getReviewStats(@Param('productId') productId: number) {
    return this.productsService.getRatingStats(productId);
  }

  @Post('product/:productId')
  async addReview(
    @Param('productId') productId: number,
    @Body() body: { reviewerName: string; rating: number; comment: string }
  ) {
    return this.productsService.createReview(productId, body);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllReviews(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.productsService.getAllReviews(parseInt(page, 10), parseInt(limit, 10));
  }

  @Put('admin/:reviewId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async approveReview(@Param('reviewId') reviewId: number) {
    await this.productsService.approveReview(reviewId);
    return { success: true };
  }

  @Delete('admin/:reviewId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteReview(@Param('reviewId') reviewId: number) {
    return this.productsService.deleteReview(reviewId);
  }
}
