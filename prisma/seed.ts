import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (optional)
  await prisma.user.deleteMany({});

  // Seed example data
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
      },
    }),
    prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Regular User',
      },
    }),
  ]);

  console.log('Seeded users:', users);

  // Seed health check
  const healthCheck = await prisma.health.create({
    data: {
      status: 'ok',
      metadata: {
        seeded: true,
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log('Seeded health check:', healthCheck);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
