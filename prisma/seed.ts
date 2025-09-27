import { PasswordUtil } from './../src/common/utils/password.util';
import { PrismaClient, UserRole } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({});

  const user = await prisma.user.create({
    data: {
      name: 'Admin User',
      role: UserRole.ADMIN,
      account: {
        create: {
          email: 'admin@example.com',
          passwordHash: await PasswordUtil.hash('admin123456'),
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
