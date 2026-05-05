import { Module } from '@nestjs/common';
import { VoucherRulesController } from './voucher-rules.controller';
import { VoucherRulesService } from './voucher-rules.service';

@Module({
  controllers: [VoucherRulesController],
  providers: [VoucherRulesService],
  exports: [VoucherRulesService],
})
export class VoucherRulesModule {}
