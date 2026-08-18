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
import { UserSession } from './user-session.entity';
import { EmailModule } from '../email/email.module';
import { RedisModule } from '../redis/redis.module';
import { AdminSeeder } from './admin-seeder.service';
import { ReferralsModule } from '../referrals/referrals.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { MarketingModule } from '../marketing/marketing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: {
          expiresIn: config.get('jwt.expiresIn'),
          issuer: 'beauty-parle-api',
          audience: 'beauty-parle-web',
        },
      }),
      inject: [ConfigService],
    }),
    EmailModule,
    RedisModule,
    ReferralsModule,
    AuditLogsModule,
    MarketingModule,
  ],
  controllers: [AuthController, OtpController],
  providers: [
    AuthService,
    OtpService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    AdminSeeder,
  ],
  exports: [AuthService],
})
export class AuthModule {}
