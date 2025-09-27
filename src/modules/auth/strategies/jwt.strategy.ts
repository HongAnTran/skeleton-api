import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // accountId
  email: string;
  role?: UserRole; // Only for users
  type: 'user' | 'employee';
  userId?: string; // Only for users
  employeeId?: string; // Only for employees
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      accountId: payload.sub,
      email: payload.email,
      role: payload.role,
      type: payload.type,
      userId: payload.userId,
      employeeId: payload.employeeId,
    };
  }
}
