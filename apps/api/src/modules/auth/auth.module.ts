import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { FacebookStrategy } from './facebook.strategy';
import { User } from './user.entity';
import { EmailModule } from '../email/email.module';
import { RedisModule } from '../redis/redis.module';
import { AdminSeeder } from './admin-seeder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
    EmailModule,
    RedisModule,
  ],
  controllers: [AuthController, OtpController],
  providers: [AuthService, OtpService, JwtStrategy, GoogleStrategy, FacebookStrategy, AdminSeeder],
  exports: [AuthService],
})
export class AuthModule {}
