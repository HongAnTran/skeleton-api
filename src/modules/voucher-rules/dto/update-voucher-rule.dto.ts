import { PartialType } from '@nestjs/swagger';
import { CreateVoucherRuleDto } from './create-voucher-rule.dto';

export class UpdateVoucherRuleDto extends PartialType(CreateVoucherRuleDto) {}
