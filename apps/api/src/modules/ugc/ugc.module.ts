import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UgcService } from './ugc.service';
import { UgcController } from './ugc.controller';
import { UgcPhoto } from './ugc-photo.entity';
import { CreatorLook } from './creator-look.entity';
import { CommissionEarning } from './commission-earning.entity';
import { CreatorLookClick } from './creator-look-click.entity';
import { User } from '../auth/user.entity';
import { OrderSubscriber } from './order.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UgcPhoto,
      CreatorLook,
      CommissionEarning,
      CreatorLookClick,
      User,
    ]),
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
  providers: [UgcService, OrderSubscriber],
  exports: [UgcService],
})
export class UgcModule {}
