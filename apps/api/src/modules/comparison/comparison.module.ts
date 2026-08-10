import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ComparisonService } from './comparison.service';
import { ComparisonController } from './comparison.controller';
import { Product } from '../products/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ComparisonController],
  providers: [ComparisonService],
  exports: [ComparisonService],
})
export class ComparisonModule {}
