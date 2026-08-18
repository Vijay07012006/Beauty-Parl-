import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Request() req: any) {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @Get('count')
  async countWishlist(@Request() req: any) {
    const count = await this.wishlistService.countWishlistItems(req.user.id);
    return { count };
  }

  @Get('check/:productId')
  async checkWishlist(
    @Request() req: any,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const inWishlist = await this.wishlistService.isInWishlist(
      req.user.id,
      productId,
    );
    return { inWishlist };
  }

  @Post(':productId')
  addToWishlist(
    @Request() req: any,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.addToWishlist(req.user.id, productId);
  }

  @Delete(':productId')
  removeFromWishlist(
    @Request() req: any,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.removeFromWishlist(req.user.id, productId);
  }
}
