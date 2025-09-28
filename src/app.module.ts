import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { BranchesModule } from './modules/branches/branches.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { ShiftSlotsModule } from './modules/shift-slots/shift-slots.module';
import { ShiftSlotTypesModule } from './modules/shift-slot-types/shift-slot-types.module';
import { ShiftSignupsModule } from './modules/shift-signups/shift-signups.module';
import { TasksModule } from './modules/tasks/tasks.module';

import configuration from './config/configuration';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { validate } from './config/config.validation';

import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter';
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
    DatabaseModule,
    HealthModule,
    // Feature Modules
    AuthModule,
    UsersModule,
    EmployeesModule,
    BranchesModule,
    DepartmentsModule,
    ShiftSlotsModule,
    ShiftSlotTypesModule,
    ShiftSignupsModule,
    TasksModule,
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
    // {
    //   provide: APP_FILTER,
    //   useClass: AllExceptionsFilter,
    // },
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
