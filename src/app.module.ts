import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

import configuration from './config/configuration';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { validate } from './config/config.validation';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { NoCacheInterceptor } from './common/interceptors/no-cache.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, appConfig, databaseConfig],
      validate,
      envFilePath: ['.env.local', '.env'],
      cache: true,
      expandVariables: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60000,
        limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 10,
      },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: NoCacheInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
