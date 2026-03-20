import { Controller, HttpCode, HttpStatus, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { DahahiService } from '../services/dahahi.service';
import { GetEmployeeListDto } from '../dto/get-employee-list.dto';
import { GetCheckinHistoryDto } from '../dto/get-checkin-history.dto';
import { DahahiEmployeeItemDto } from '../dto/employee-list-response.dto';
import { GetCheckinHistoryWithReportDto } from '../dto/checkin-history-response.dto';

@ApiTags('Dahahi - Face Recognition')
@Controller('dahahi')
export class DahahiController {
  constructor(private readonly dahahiService: DahahiService) {}

  @Public()
  @Get('employees')
  @ApiQuery({ name: 'fullName', required: false, type: String })
  @ApiQuery({ name: 'pageIndex', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Danh sách nhân viên',
    description:
      'Lấy danh sách nhân viên từ thiết bị Face Dahahi. Gọi API Online Dahahi với FullName, PageIndex, PageSize.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách nhân viên từ thiết bị Face Dahahi',
    type: [DahahiEmployeeItemDto],
  })
  @ApiResponse({
    status: 503,
    description: 'Không thể kết nối tới API Face Dahahi',
  })
  async getEmployeeList(
    @Query() query: GetEmployeeListDto,
  ): Promise<DahahiEmployeeItemDto[]> {
    return this.dahahiService.getEmployeeList(query);
  }

  @Public()
  @Get('checkinhis')
  @ApiQuery({ name: 'EmployeeCode', required: true, type: String })
  @ApiQuery({ name: 'FromTimeStr', required: true, type: String })
  @ApiQuery({ name: 'ToTimeStr', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lịch sử check-in',
    description:
      'Lấy lịch sử check-in Face Dahahi theo mã nhân viên và khoảng thời gian (FromTimeStr / ToTimeStr: DD/MM/YYYY HH:mm:ss). Trả về toàn bộ bản ghi (đã phân trang hết phía server) kèm report: tổng giờ công (ước lượng), mảng ngày quên checkout.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách lượt check-in và báo cáo',
    type: GetCheckinHistoryWithReportDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Không thể kết nối tới API Face Dahahi',
  })
  async getCheckinHistory(
    @Query() query: GetCheckinHistoryDto,
  ): Promise<GetCheckinHistoryWithReportDto> {
    return this.dahahiService.getCheckinHistory(query);
  }
}
