import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, VoucherConditionType, VoucherRule } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateVoucherRuleDto } from './dto/create-voucher-rule.dto';
import { UpdateVoucherRuleDto } from './dto/update-voucher-rule.dto';
import { ListVoucherRulesQueryDto } from './dto/list-voucher-rules.dto';

@Injectable()
export class VoucherRulesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Validate conditionValue tương ứng với conditionType. */
  private validateConditionValue(
    type: VoucherConditionType,
    value: string,
  ): void {
    if (type === VoucherConditionType.INVOICE_COUNT_TIER) {
      const n = parseInt(value, 10);
      if (Number.isNaN(n) || n < 0) {
        throw new BadRequestException(
          'Với INVOICE_COUNT_TIER, conditionValue phải là số nguyên không âm (vd "3").',
        );
      }
    } else if (type === VoucherConditionType.WARRANTY_ACTIVE) {
      if (!value.trim()) {
        throw new BadRequestException(
          'Với WARRANTY_ACTIVE, conditionValue là tên gói bảo hành và không được rỗng.',
        );
      }
    }
  }

  async list(query: ListVoucherRulesQueryDto): Promise<VoucherRule[]> {
    const where: Prisma.VoucherRuleWhereInput = {};
    if (query.conditionType) where.conditionType = query.conditionType;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.prisma.voucherRule.findMany({
      where,
      orderBy: [{ conditionType: 'asc' }, { discountVnd: 'asc' }],
    });
  }

  async getById(id: string): Promise<VoucherRule> {
    const rule = await this.prisma.voucherRule.findUnique({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Không tìm thấy voucher rule với id=${id}`);
    }
    return rule;
  }

  async create(dto: CreateVoucherRuleDto): Promise<VoucherRule> {
    this.validateConditionValue(dto.conditionType, dto.conditionValue);

    return this.prisma.voucherRule.create({
      data: {
        name: dto.name,
        conditionType: dto.conditionType,
        conditionValue: dto.conditionValue,
        discountVnd: dto.discountVnd,
        flags: dto.flags ?? [],
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateVoucherRuleDto): Promise<VoucherRule> {
    const existing = await this.getById(id);

    // Nếu user thay đổi conditionType hoặc conditionValue, validate lại
    const nextType = dto.conditionType ?? existing.conditionType;
    const nextValue = dto.conditionValue ?? existing.conditionValue;
    if (
      dto.conditionType !== undefined ||
      dto.conditionValue !== undefined
    ) {
      this.validateConditionValue(nextType, nextValue);
    }

    return this.prisma.voucherRule.update({
      where: { id },
      data: {
        name: dto.name,
        conditionType: dto.conditionType,
        conditionValue: dto.conditionValue,
        discountVnd: dto.discountVnd,
        flags: dto.flags,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    await this.getById(id);
    await this.prisma.voucherRule.delete({ where: { id } });
    return { id, deleted: true };
  }
}
