import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Waitlist } from './waitlist.entity';
import { Product } from '../products/product.entity';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Waitlist, Product]),
    EmailModule,
  ],
  controllers: [WaitlistController],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}
