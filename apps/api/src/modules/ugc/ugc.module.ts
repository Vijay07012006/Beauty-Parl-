import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UgcService } from './ugc.service';
import { UgcController } from './ugc.controller';
import { UgcPhoto } from './ugc-photo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UgcPhoto]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UgcController],
  providers: [UgcService],
  exports: [UgcService],
})
export class UgcModule {}
