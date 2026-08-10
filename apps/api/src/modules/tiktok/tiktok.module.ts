import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TikTokService } from './tiktok.service';
import { TikTokController } from './tiktok.controller';
import { Product } from '../products/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [TikTokController],
  providers: [TikTokService],
  exports: [TikTokService],
})
export class TikTokModule {}
