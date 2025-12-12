import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { IdentityVerificationModule } from './modules/identity-verification/identity-verification.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { DeveloperBrandsModule } from './modules/developer-brands/developer-brands.module';
import { LaunchNotificationsModule } from './modules/launch-notifications/launch-notifications.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { ToolsModule } from './modules/tools/tools.module';
import { AiConversationsModule } from './modules/ai-conversations/ai-conversations.module';
import { AiGatewayModule } from './modules/ai-gateway/ai-gateway.module';
import { RealtimeGatewayModule } from './modules/realtime-gateway/realtime-gateway.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { HealthController } from './common/controllers/health.controller';
import { NonApiRejectMiddleware } from './common/middleware/non-api-reject.middleware';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => {
        const ttl = configService.get<number>('throttle.ttl', 60) * 1000;
        const limit = configService.get<number>('throttle.limit', 10);
        return {
          throttlers: [{
            ttl,
            limit,
          }],
        };
      },
    }),
    AuthModule,
    UsersModule,
    AdminModule,
    IdentityVerificationModule,
    PropertiesModule,
    DeveloperBrandsModule,
    LaunchNotificationsModule,
    PurchasesModule,
    ToolsModule,
    AiConversationsModule,
    AiGatewayModule,
    RealtimeGatewayModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useFactory: (configService: ConfigService) => {
        return new HttpExceptionFilter(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Rejeter les routes non-API avec un message clair
    consumer
      .apply(NonApiRejectMiddleware)
      .forRoutes('*');
  }
}
