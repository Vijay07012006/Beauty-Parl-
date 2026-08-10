import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RecentlyViewedService } from './recently-viewed.service';
import { RecentlyViewedController } from './recently-viewed.controller';
import { RecentlyViewed } from './recently-viewed.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecentlyViewed, Product]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RecentlyViewedController],
  providers: [RecentlyViewedService],
  exports: [RecentlyViewedService],
})
export class RecentlyViewedModule {}
