import { PasswordUtil } from './../src/common/utils/password.util';
import { PrismaClient, VoucherConditionType } from '@prisma/client';
const prisma = new PrismaClient();

async function seedAccounts() {
  const existingAdmin = await prisma.account.findUnique({
    where: { username: 'tranhongankrn' },
  });
  if (!existingAdmin) {
    const account = await prisma.account.create({
      data: {
        username: 'tranhongankrn',
        email: 'tranhongankrn.2001@gmail.com',
        passwordHash: await PasswordUtil.hash('ANlol2001@'),
        role: 'ADMIN',
      },
    });
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        account: { connect: { id: account.id } },
      },
    });
  }

  const existingUser = await prisma.account.findUnique({
    where: { username: 'hitaothom' },
  });
  if (!existingUser) {
    const account2 = await prisma.account.create({
      data: {
        username: 'hitaothom',
        email: 'hitaothom@gmail.com',
        passwordHash: await PasswordUtil.hash('admin123456@'),
        role: 'USER',
      },
    });
    await prisma.user.create({
      data: {
        name: 'HiTaoThom',
        account: { connect: { id: account2.id } },
      },
    });
  }
}

async function seedVoucherRules() {
  const defaults: Array<{
    name: string;
    conditionType: VoucherConditionType;
    conditionValue: string;
    discountVnd: number;
    flags?: string[];
  }> = [
      {
        name: 'Khách thân thiết - 1 hóa đơn',
        conditionType: VoucherConditionType.INVOICE_COUNT_TIER,
        conditionValue: '1',
        discountVnd: 100000,
      },
      {
        name: 'Khách thân thiết - 2 hóa đơn',
        conditionType: VoucherConditionType.INVOICE_COUNT_TIER,
        conditionValue: '2',
        discountVnd: 150000,
      },
      {
        name: 'Khách thân thiết - 3 hóa đơn',
        conditionType: VoucherConditionType.INVOICE_COUNT_TIER,
        conditionValue: '3',
        discountVnd: 200000,
      },
      {
        name: 'Khách thân thiết - 4+ hóa đơn',
        conditionType: VoucherConditionType.INVOICE_COUNT_TIER,
        conditionValue: '4',
        discountVnd: 300000,
      },
      {
        name: 'Ưu đãi Care+ Pro Max còn hạn',
        conditionType: VoucherConditionType.WARRANTY_ACTIVE,
        conditionValue: 'Bảo Hành CARE⁺ PRO MAX',
        discountVnd: 300000,
        flags: ['careProMax'],
      },
    ];

  for (const rule of defaults) {
    const existing = await prisma.voucherRule.findFirst({
      where: { name: rule.name },
    });
    if (existing) continue;
    await prisma.voucherRule.create({
      data: {
        name: rule.name,
        conditionType: rule.conditionType,
        conditionValue: rule.conditionValue,
        discountVnd: rule.discountVnd,
        flags: rule.flags ?? [],
      },
    });
  }
}

async function main() {
  await seedAccounts();
  await seedVoucherRules();
  console.log('Seed completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
