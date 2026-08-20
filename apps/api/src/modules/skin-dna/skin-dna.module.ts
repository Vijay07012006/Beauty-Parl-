import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkinDnaController } from './skin-dna.controller';
import { SkinDnaService } from './skin-dna.service';
import { QuizResponse } from '../quizzes/quiz-response.entity';
import { Order } from '../orders/order.entity';
import { SkinAnalysis } from '../skin-analysis/skin-analysis.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizResponse, Order, SkinAnalysis, Product]),
  ],
  controllers: [SkinDnaController],
  providers: [SkinDnaService],
  exports: [SkinDnaService],
})
export class SkinDnaModule {}
