import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WishlistAlertsService } from './wishlist-alerts.service';
import { WishlistAlertsController } from './wishlist-alerts.controller';
import { WishlistAlert } from './wishlist-alert.entity';
import { Product } from '../products/product.entity';
import { User } from '../auth/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WishlistAlert, Product, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WishlistAlertsController],
  providers: [WishlistAlertsService],
  exports: [WishlistAlertsService],
})
export class WishlistAlertsModule {}
