import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Room } from './entities/room.entity';
import { Product } from '../products/product.entity';
import { CoShoppingService } from './co-shopping.service';
import { CoShoppingController } from './co-shopping.controller';
import { CoShoppingGateway } from './co-shopping.gateway';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Product]),
    CartModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CoShoppingController],
  providers: [CoShoppingService, CoShoppingGateway],
  exports: [CoShoppingService],
})
export class CoShoppingModule {}
