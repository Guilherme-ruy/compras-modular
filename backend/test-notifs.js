const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { body: true, title: true }
  });
  console.log(JSON.stringify(notifs, null, 2));
}

main().finally(() => prisma.$disconnect());
