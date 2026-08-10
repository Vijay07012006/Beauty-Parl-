import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LiveShoppingService } from './live-shopping.service';
import { LiveShoppingController } from './live-shopping.controller';
import { LiveShoppingGateway } from './live-shopping.gateway';
import { LiveEvent } from './live-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveEvent]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [LiveShoppingController],
  providers: [LiveShoppingService, LiveShoppingGateway],
  exports: [LiveShoppingService],
})
export class LiveShoppingModule {}
