import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserAuthService } from './services/user-auth.service';
import { EmployeeAuthService } from './services/employee-auth.service';
import { UserAdminAuthService } from './services/user-admin-auth.service';
import { UserAuthController } from './controllers/user-auth.controller';
import { EmployeeAuthController } from './controllers/employee-auth.controller';
import { UserAdminAuthController } from './controllers/user-admin-auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    UserAuthController,
    EmployeeAuthController,
    UserAdminAuthController,
  ],
  providers: [
    UserAuthService,
    EmployeeAuthService,
    UserAdminAuthService,
    JwtStrategy,
  ],
  exports: [
    UserAuthService,
    EmployeeAuthService,
    UserAdminAuthService,
    JwtModule,
  ],
})
export class AuthModule {}
