import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShiftSignupCronService } from './shift-signup-cron.service';

@ApiTags('Cron Jobs')
@Controller('cron')
export class CronController {
  constructor(
    private readonly shiftSignupCronService: ShiftSignupCronService,
  ) {}

  @Post('update-completed-shifts')
  @ApiOperation({
    summary: 'Manually trigger update of completed shift signups',
    description:
      'Manually run the cron job to update shift signups that have passed their date to COMPLETED status',
  })
  @ApiResponse({
    status: 200,
    description: 'Cron job executed successfully',
  })
  async updateCompletedShifts() {
    await this.shiftSignupCronService.updateCompletedShiftSignups();
    return {
      message: 'Update completed shift signups job executed successfully',
    };
  }
}
