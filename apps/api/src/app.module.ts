import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AdminModule } from './modules/admin/admin.module';
import { RedisModule } from './modules/redis/redis.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { EmailModule } from './modules/email/email.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { Product } from './modules/products/product.entity';
import { ProductReview } from './modules/products/review.entity';
import { Wishlist } from './modules/wishlist/wishlist.entity';
import { Address } from './modules/addresses/address.entity';
import { Coupon } from './modules/coupons/coupon.entity';
import { User } from './modules/auth/user.entity';
import { Order } from './modules/orders/order.entity';
import { Cart } from './modules/cart/cart.entity';
import { RecentlyViewed } from './modules/recently-viewed/recently-viewed.entity';
import { WishlistAlert } from './modules/wishlist-alerts/wishlist-alert.entity';
import { QuizResponse } from './modules/quizzes/quiz-response.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { CartModule } from './modules/cart/cart.module';
import { ChatModule } from './modules/chat/chat.module';
import { ComparisonModule } from './modules/comparison/comparison.module';
import { RecentlyViewedModule } from './modules/recently-viewed/recently-viewed.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { WishlistAlertsModule } from './modules/wishlist-alerts/wishlist-alerts.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: '../../.env.local',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('database.url'),
        host: config.get('database.url') ? undefined : config.get('database.host'),
        port: config.get('database.url') ? undefined : config.get('database.port'),
        username: config.get('database.url') ? undefined : config.get('database.username'),
        password: config.get('database.url') ? undefined : config.get('database.password'),
        database: config.get('database.url') ? undefined : config.get('database.database'),
        entities: [Product, User, Order, ProductReview, Wishlist, Address, Coupon, Cart, RecentlyViewed, WishlistAlert, QuizResponse],
        autoLoadEntities: true,
        synchronize: process.env.DB_SYNCHRONIZE !== 'false', // Default to true unless explicitly disabled, ensuring tables are created on startup since there are no migrations
        logging: process.env.NODE_ENV === 'development',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds default TTL
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    ScheduleModule.forRoot(),
    AuthModule,
    ProductsModule,
    OrdersModule,
    AdminModule,
    RedisModule,
    PaymentsModule,
    EmailModule,
    WishlistModule,
    AddressesModule,
    CouponsModule,
    RecommendationsModule,
    CartModule,
    ChatModule,
    ComparisonModule,
    RecentlyViewedModule,
    QuizzesModule,
    WishlistAlertsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }