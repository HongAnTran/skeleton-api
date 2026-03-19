import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { DahahiService } from '../services/dahahi.service';
import { GetEmployeeListDto } from '../dto/get-employee-list.dto';
import {
  DahahiEmployeeItemDto,
  GetEmployeeListResponseDto,
} from '../dto/employee-list-response.dto';

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
  @ApiBody({ type: GetEmployeeListDto })
  @ApiResponse({
    status: 200,
    description: 'Danh sách nhân viên từ thiết bị Face Dahahi',
    type: GetEmployeeListResponseDto,
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
}
