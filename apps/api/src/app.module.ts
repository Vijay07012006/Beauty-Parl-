import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UserThrottlerGuard } from './modules/auth/user-throttler.guard';
import { Role } from './modules/roles/role.entity';
import { RolesModule } from './modules/roles/roles.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AdminModule } from './modules/admin/admin.module';
import { RedisModule } from './modules/redis/redis.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuditLog } from './modules/audit-logs/audit-log.entity';
import { ActiveSession } from './modules/audit-logs/active-session.entity';
import { FailedLogin } from './modules/audit-logs/failed-login.entity';
import { EmailModule } from './modules/email/email.module';
import { SupportTicket } from './modules/support/support-ticket.entity';
import { TicketReply } from './modules/support/ticket-reply.entity';
import { Notification } from './modules/support/notification.entity';
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
import { UgcPhoto } from './modules/ugc/ugc-photo.entity';
import { SkinAnalysis } from './modules/skin-analysis/skin-analysis.entity';
import { Subscription } from './modules/subscriptions/subscription.entity';
import { Return } from './modules/returns/return.entity';
import { Waitlist } from './modules/waitlist/waitlist.entity';
import { BeautyBox } from './modules/beauty-boxes/beauty-box.entity';
import { UserRoutine } from './modules/routines/user-routine.entity';
import { LiveEvent } from './modules/live-shopping/live-event.entity';
import { LoyaltyTransaction } from './modules/loyalty/loyalty-transaction.entity';
import { LoyaltyReward } from './modules/loyalty/loyalty-reward.entity';
import { Referral } from './modules/referrals/referral.entity';
import { ReferralTracking } from './modules/referrals/referral-tracking.entity';
import { Achievement } from './modules/gamification/achievement.entity';
import { UserAchievement } from './modules/gamification/user-achievement.entity';

// Phase 5C Entities
import { ProductTag } from './modules/product-tags/product-tag.entity';
import { ProductTagMapping } from './modules/product-tags/product-tag-mapping.entity';
import { Look } from './modules/looks/look.entity';
import { LookProduct } from './modules/looks/look-product.entity';
import { Bundle } from './modules/bundles/bundle.entity';
import { BundleProduct } from './modules/bundles/bundle-product.entity';

import { ScheduleModule } from '@nestjs/schedule';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { CartModule } from './modules/cart/cart.module';
import { ChatModule } from './modules/chat/chat.module';
import { ComparisonModule } from './modules/comparison/comparison.module';
import { RecentlyViewedModule } from './modules/recently-viewed/recently-viewed.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { WishlistAlertsModule } from './modules/wishlist-alerts/wishlist-alerts.module';
import { SocialModule } from './modules/social/social.module';
import { SkinAnalysisModule } from './modules/skin-analysis/skin-analysis.module';
import { UgcModule } from './modules/ugc/ugc.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { BeautyBoxesModule } from './modules/beauty-boxes/beauty-boxes.module';
import { RoutinesModule } from './modules/routines/routines.module';
import { LiveShoppingModule } from './modules/live-shopping/live-shopping.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { ReferralsModule } from './modules/referrals/referrals.module';

// Phase 5C Modules
import { ProductTagsModule } from './modules/product-tags/product-tags.module';
import { LooksModule } from './modules/looks/looks.module';
import { BundlesModule } from './modules/bundles/bundles.module';
import { TikTokModule } from './modules/tiktok/tiktok.module';

// AI Modules
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { SemanticSearchModule } from './modules/semantic-search/semantic-search.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { AiConversation } from './modules/ai-assistant/entities/ai-conversation.entity';
import { AiGeneration } from './modules/ai-assistant/entities/ai-generation.entity';
import { AiMemory } from './modules/ai-assistant/entities/ai-memory.entity';
import { SupportModule } from './modules/support/support.module';
import { InventoryModule } from './modules/inventory/inventory.module';

// Phase 8D Modules
import { CheckoutModule } from './modules/checkout/checkout.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

// Phase 8E Modules & Entities
import { SessionsModule } from './modules/sessions/sessions.module';
import { GdprModule } from './modules/gdpr/gdpr.module';
import { FraudModule } from './modules/fraud/fraud.module';
import { AuditModule } from './modules/audit/audit.module';
import { DeletionRequest } from './modules/gdpr/deletion-request.entity';
import { FraudAlert } from './modules/fraud/fraud-alert.entity';

// Phase 8F Modules & Entities
import { FlashSalesModule } from './modules/flash-sales/flash-sales.module';
import { FlashSale } from './modules/flash-sales/flash-sale.entity';
import { BlogModule } from './modules/blog/blog.module';
import { BlogPost } from './modules/blog/blog-post.entity';
import { BlogComment } from './modules/blog/blog-comment.entity';
import { MarketingModule } from './modules/marketing/marketing.module';
import { ObservabilityModule } from './observability/observability.module';

import { ProductEmbedding } from './modules/visual-search/product-embedding.entity';
import { VisualSearchModule } from './modules/visual-search/visual-search.module';
import { SkinDnaModule } from './modules/skin-dna/skin-dna.module';

import { Room } from './modules/co-shopping/entities/room.entity';
import { CreatorLook } from './modules/ugc/creator-look.entity';
import { CommissionEarning } from './modules/ugc/commission-earning.entity';
import { CreatorLookClick } from './modules/ugc/creator-look-click.entity';
import { ForumCategory, Thread, Reply } from './modules/forums/entities/forum.entities';
import { CoShoppingModule } from './modules/co-shopping/co-shopping.module';
import { ForumsModule } from './modules/forums/forums.module';

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
        host: config.get('database.url')
          ? undefined
          : config.get('database.host'),
        port: config.get('database.url')
          ? undefined
          : config.get('database.port'),
        username: config.get('database.url')
          ? undefined
          : config.get('database.username'),
        password: config.get('database.url')
          ? undefined
          : config.get('database.password'),
        database: config.get('database.url')
          ? undefined
          : config.get('database.database'),
        entities: [
          Product,
          User,
          Order,
          ProductReview,
          Wishlist,
          Address,
          Coupon,
          Cart,
          RecentlyViewed,
          WishlistAlert,
          QuizResponse,
          UgcPhoto,
          SkinAnalysis,
          Subscription,
          BeautyBox,
          UserRoutine,
          LiveEvent,
          LoyaltyTransaction,
          LoyaltyReward,
          Referral,
          ReferralTracking,
          Achievement,
          UserAchievement,
          ProductTag,
          ProductTagMapping,
          Look,
          LookProduct,
          Bundle,
          BundleProduct,
          AuditLog,
          AiConversation,
          AiGeneration,
          Role,
          ActiveSession,
          FailedLogin,
          SupportTicket,
          TicketReply,
          Notification,
          AiMemory,
          Return,
          Waitlist,
          DeletionRequest,
          FraudAlert,
          FlashSale,
          BlogPost,
          BlogComment,
          ProductEmbedding,
          Room,
          CreatorLook,
          CommissionEarning,
          CreatorLookClick,
          ForumCategory,
          Thread,
          Reply,
        ],
        autoLoadEntities: true,
        // M-2: auto-schema only by default outside production; production requires explicit DB_SYNCHRONIZE=true
        synchronize:
          process.env.NODE_ENV === 'production'
            ? process.env.DB_SYNCHRONIZE === 'true'
            : process.env.DB_SYNCHRONIZE !== 'false',
        logging: process.env.NODE_ENV === 'development',
        // M-3: verify the server cert by default; opt-out only via explicit DB_SSL_REJECT_UNAUTHORIZED=false
        ssl:
          process.env.NODE_ENV === 'production'
            ? {
                rejectUnauthorized:
                  process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
              }
            : false,
      }),
      inject: [ConfigService],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds default TTL
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
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
    SocialModule,
    SkinAnalysisModule,
    UgcModule,
    SubscriptionsModule,
    BeautyBoxesModule,
    RoutinesModule,
    LiveShoppingModule,
    LoyaltyModule,
    GamificationModule,
    ReferralsModule,
    ProductTagsModule,
    LooksModule,
    BundlesModule,
    TikTokModule,
    AuditLogsModule,
    AiChatModule,
    SemanticSearchModule,
    AiAssistantModule,
    RolesModule,
    SupportModule,
    InventoryModule,
    CheckoutModule,
    ReturnsModule,
    WaitlistModule,
    NotificationsModule,
    SessionsModule,
    GdprModule,
    FraudModule,
    AuditModule,
    FlashSalesModule,
    BlogModule,
    MarketingModule,
    ObservabilityModule,
    VisualSearchModule,
    SkinDnaModule,
    CoShoppingModule,
    ForumsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule {}
