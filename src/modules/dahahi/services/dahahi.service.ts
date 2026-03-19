import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GetEmployeeListDto } from '../dto/get-employee-list.dto';
import {
  DahahiEmployeeItemDto,
  GetEmployeeListResponseDto,
} from '../dto/employee-list-response.dto';

@Injectable()
export class DahahiService {
  private readonly logger = new Logger(DahahiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get baseUrl(): string {
    return this.configService.get<string>('dahahi.baseUrl');
  }

  private get appKey(): string {
    return this.configService.get<string>('dahahi.appKey');
  }

  private get secretKey(): string {
    return this.configService.get<string>('dahahi.secretKey');
  }

  private async post<T>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const headers = {
      AppKey: this.appKey,
      SecretKey: this.secretKey,
      'Content-Type': 'application/json',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<T>(`${this.baseUrl}/api/${path}`, body, {
          headers,
          timeout: 30000,
        }),
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: unknown; status?: number } })
              .response?.data
          : error;
      this.logger.error(`Dahahi API error: ${path}`, message);
      throw new HttpException(
        'Không thể kết nối tới API Face Dahahi',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Lấy danh sách nhân viên từ thiết bị Face Dahahi.
   * API: POST /api/facereg/GetEmployeeList
   * Input: FullName, PageIndex, PageSize
   */
  async getEmployeeList(
    query: GetEmployeeListDto,
  ): Promise<DahahiEmployeeItemDto[]> {
    const body = {
      FullName: query.FullName ?? '',
      PageIndex: query.PageIndex ?? 1,
      PageSize: query.PageSize ?? 20,
    };

    const { Data: result } = await this.post<GetEmployeeListResponseDto>(
      '/facereg/GetEmployeeList',
      body,
    );
    return result.map((item) => ({
      ...item,
      avatar: item.Avatar ? `${this.baseUrl}${item.Avatar}` : null,
    }));
  }
}
