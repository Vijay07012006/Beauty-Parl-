import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BeautyBoxesService } from './beauty-boxes.service';
import { BeautyBoxesController } from './beauty-boxes.controller';
import { BeautyBox } from './beauty-box.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BeautyBox]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [BeautyBoxesController],
  providers: [BeautyBoxesService],
  exports: [BeautyBoxesService],
})
export class BeautyBoxesModule {}
