import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SkinAnalysisService } from './skin-analysis.service';
import { SkinAnalysisController } from './skin-analysis.controller';
import { SkinAnalysis } from './skin-analysis.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SkinAnalysis, Product]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SkinAnalysisController],
  providers: [SkinAnalysisService],
  exports: [SkinAnalysisService],
})
export class SkinAnalysisModule {}
