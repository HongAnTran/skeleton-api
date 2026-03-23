import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GetEmployeeListDto } from '../dto/get-employee-list.dto';
import { GetCheckinHistoryDto } from '../dto/get-checkin-history.dto';
import {
  DahahiEmployeeItemDto,
  GetEmployeeListResponseDto,
} from '../dto/employee-list-response.dto';
import {
  DahahiCheckinHistoryItemDto,
  DahahiCheckinHistoryReportDto,
  GetCheckinHistoryResponseDto,
  GetCheckinHistoryWithReportDto,
} from '../dto/checkin-history-response.dto';

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
        this.httpService.post<T>(`${this.baseUrl}/api${path}`, body, {
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

  /** Khoảng cách tối đa (ms) giữa 2 lần check-in vẫn xem là cùng một cụm (trùng đọc máy). */
  private static readonly CHECKIN_CLUSTER_GAP_MS = 2 * 60 * 1000;

  private parseCheckinDateTime(item: DahahiCheckinHistoryItemDto): Date | null {
    const raw =
      item.CheckinTime1Str?.trim() || item.CheckinTimeStr?.trim() || '';
    if (!raw) {
      return null;
    }

    const m = raw.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
    );
    if (!m) {
      return null;
    }

    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    const hour = parseInt(m[4], 10);
    const minute = parseInt(m[5], 10);
    const second = parseInt(m[6], 10);

    if ([day, month, year, hour, minute, second].some((n) => Number.isNaN(n))) {
      return null;
    }

    const d = new Date(year, month - 1, day, hour, minute, second);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private dateKeyLocal(d: Date): string {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
  }

  /**
   * Giờ công: tổng (theo ngày) = (check-in cuối − check-in đầu trong ngày), cộng dồn.
   * Ngày quên checkout: ngày có >1 cụm (hai lần cách nhau > 2 phút, gom trùng máy).
   */
  private buildCheckinReport(
    items: DahahiCheckinHistoryItemDto[],
  ): DahahiCheckinHistoryReportDto {
    const byDay = new Map<string, number[]>();

    for (const item of items) {
      const dt = this.parseCheckinDateTime(item);
      if (!dt) {
        continue;
      }
      const key = this.dateKeyLocal(dt);
      const list = byDay.get(key) ?? [];
      list.push(dt.getTime());
      byDay.set(key, list);
    }

    let totalWorkHours = 0;

    const sortedDayKeys = [...byDay.keys()].sort();

    for (const dayKey of sortedDayKeys) {
      const times = byDay.get(dayKey);
      if (!times?.length) {
        continue;
      }
      times.sort((a, b) => a - b);
      const first = times[0];
      const last = times[times.length - 1];
      totalWorkHours += (last - first) / (1000 * 60 * 60);
    }

    return {
      totalWorkHours: Math.round(totalWorkHours * 100) / 100,
      totalRecords: items.length,
    };
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
      pageIndex: query.pageIndex ?? 1,
      pageSize: query.pageSize ?? 50,
    };

    const { Data: result } = await this.post<GetEmployeeListResponseDto>(
      '/facereg/GetEmployeeList',
      body,
    );
    return result.map((item) => ({
      _id: item._id,
      Address: item.Address,
      CreatedBy: item.CreatedBy,
      CreatedDate: item.CreatedDate,
      Email: item.Email,
      EmployeeCode: item.EmployeeCode,
      Name: item.Name,
      Mobile: item.Mobile,
      Status: item.Status,
      StatusName: item.StatusName,
      StructureDepartmentName: item.StructureDepartmentName,
      IsDeleted: item.IsDeleted,
      Avatar: item.Avatar ? `${this.baseUrl}${item.Avatar}` : '',
    }));
  }

  /**
   * Lịch sử check-in theo khoảng thời gian và mã nhân viên.
   * API: POST /api/facereg/checkinhis
   * Tự động gọi nhiều trang cho đến khi lấy hết bản ghi (theo Total hoặc trang cuối).
   */
  async getCheckinHistory(
    query: GetCheckinHistoryDto,
  ): Promise<GetCheckinHistoryWithReportDto> {
    const pageSize = 100;
    const maxPages = 500;
    const all: DahahiCheckinHistoryItemDto[] = [];

    const mapRow = (
      item: DahahiCheckinHistoryItemDto,
    ): DahahiCheckinHistoryItemDto => ({
      ...item,
      LiveImageUrl: item.LiveImageUrl
        ? `${this.baseUrl}${item.LiveImageUrl}`
        : '',
    });

    for (let pageIndex = 1; pageIndex <= maxPages; pageIndex += 1) {
      const response = await this.post<GetCheckinHistoryResponseDto>(
        '/facereg/checkinhis',
        {
          pageIndex,
          pageSize,
          EmployeeCode: query.EmployeeCode,
          FromTimeStr: query.FromTimeStr,
          ToTimeStr: query.ToTimeStr,
        },
      );

      const rows = response.Data ?? [];
      const totalParsed =
        response.Total != null && !Number.isNaN(Number(response.Total))
          ? Number(response.Total)
          : null;

      all.push(...rows.map(mapRow));

      if (rows.length === 0) {
        break;
      }
      if (totalParsed != null && all.length >= totalParsed) {
        break;
      }
      if (rows.length < pageSize) {
        break;
      }
    }

    if (all.length === maxPages * pageSize) {
      this.logger.warn(
        `getCheckinHistory: đạt giới hạn ${maxPages} trang (pageSize=${pageSize}), có thể chưa lấy hết dữ liệu Dahahi`,
      );
    }

    return {
      data: all,
      report: this.buildCheckinReport(all),
    };
  }
}
