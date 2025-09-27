import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { EmployeeAuthService } from '../services/employee-auth.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { EmployeeData } from 'src/modules/auth/dto/current-user-response.dto';

@ApiTags('Employee Authentication')
@Controller('auth/employee')
export class EmployeeAuthController {
  constructor(private readonly employeeAuthService: EmployeeAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Employee login' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.employeeAuthService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh employee access token using refresh token',
  })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.employeeAuthService.refreshTokens(refreshTokenDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Employee logout' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Request() req: any) {
    if (req.user.type !== 'employee') {
      throw new Error('Invalid token type for employee authentication');
    }
    return this.employeeAuthService.logout(req.user.accountId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current employee information' })
  @ApiResponse({ status: 200, type: EmployeeData })
  async getCurrentEmployee(@Request() req: any) {
    if (req.user.type !== 'employee') {
      throw new Error('Invalid token type for employee authentication');
    }

    const employee = await this.employeeAuthService.getCurrentEmployee(
      req.user.employeeId,
    );
    return employee;
  }
}
