import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../../database/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class EmployeeAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const account = await this.prisma.account.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!account || !account.passwordHash || !account.employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!account.employee.active) {
      throw new UnauthorizedException('Employee account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      account.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens({
      accountId: account.id,
      email: account.email,
      employeeId: account.employee.id,
    });

    await this.updateRefreshToken(account.id, tokens.refresh_token);

    return tokens;
  }

  async getCurrentEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        branch: true,
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    if (!employee) {
      throw new ForbiddenException('Access Denied - Invalid employee');
    }

    if (!employee.active) {
      throw new ForbiddenException(
        'Access Denied - Employee account is inactive',
      );
    }

    return employee;
  }

  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;

    const account = await this.prisma.account.findFirst({
      where: { refreshToken },
      include: { employee: true },
    });

    if (!account?.employee) {
      throw new ForbiddenException('Access Denied - Invalid refresh token');
    }

    if (!account.employee.active) {
      throw new ForbiddenException(
        'Access Denied - Employee account is inactive',
      );
    }

    const tokens = await this.generateTokens({
      accountId: account.id,
      email: account.email,
      employeeId: account.employee.id,
    });

    await this.updateRefreshToken(account.id, tokens.refresh_token);

    return tokens;
  }

  async logout(accountId: string): Promise<{ message: string }> {
    await this.prisma.account.update({
      where: { id: accountId },
      data: { refreshToken: null },
    });
    return { message: 'Employee logged out successfully' };
  }

  private async generateTokens({
    employeeId,
    email,
    accountId,
  }: {
    accountId: string;
    employeeId: string;
    email: string;
  }) {
    const payload = {
      sub: accountId,
      email,
      type: 'employee' as const,
      employeeId,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'refresh-secret',
        ),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ),
      }),
    ]);

    const expiresIn = this.parseExpirationTime(
      this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    );

    return {
      access_token,
      refresh_token,
      expires_in: expiresIn,
    };
  }

  private async updateRefreshToken(accountId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });
  }

  private parseExpirationTime(exp: string): number {
    const time = parseInt(exp.slice(0, -1));
    const unit = exp.slice(-1);

    switch (unit) {
      case 's':
        return time;
      case 'm':
        return time * 60;
      case 'h':
        return time * 60 * 60;
      case 'd':
        return time * 24 * 60 * 60;
      default:
        return 900;
    }
  }
}
