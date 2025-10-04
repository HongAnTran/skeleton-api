import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { ShiftSignupStatus } from '@prisma/client';

@Injectable()
export class ShiftSignupCronService {
  private readonly logger = new Logger(ShiftSignupCronService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async updateCompletedShiftSignups() {
    this.logger.log('Starting automatic update of completed shift signups...');

    try {
      const currentDate = new Date();

      const pendingSignups = await this.prisma.shiftSignup.findMany({
        where: {
          status: ShiftSignupStatus.PENDING,
          slot: {
            date: {
              lt: currentDate,
            },
          },
        },
      });

      if (pendingSignups.length === 0) {
        this.logger.log('No pending shift signups to update');
        return;
      }

      this.logger.log(
        `Found ${pendingSignups.length} pending shift signups to update`,
      );

      // Cập nhật status thành COMPLETED
      const updateResult = await this.prisma.shiftSignup.updateMany({
        where: {
          id: {
            in: pendingSignups.map((signup) => signup.id),
          },
        },
        data: {
          status: ShiftSignupStatus.COMPLETED,
        },
      });

      this.logger.log(
        `Successfully updated ${updateResult.count} shift signups to COMPLETED status`,
      );

      pendingSignups.forEach((signup) => {
        this.logger.log(
          `Updated signup ${signup.id} for employee ${signup.employeeId} - slot date: ${signup.slotId}`,
        );
      });
    } catch (error) {
      this.logger.error('Error updating completed shift signups:', error);
    }
  }
}
