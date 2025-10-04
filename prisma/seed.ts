import { PasswordUtil } from './../src/common/utils/password.util';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
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
      account: {
        connect: {
          id: account.id,
        },
      },
    },
  });

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
      account: {
        connect: {
          id: account2.id,
        },
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
