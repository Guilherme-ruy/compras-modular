const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'sucesso@teste.com' }
    });

    if (!user) {
        console.error("User not found!");
        return;
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId }
    });

    if (!tenant) {
        console.error("Tenant not found!");
        return;
    }

    // Move createdAt back by 28 days (so remaining days = 30 - 28 = 2)
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - 28);

    await prisma.tenant.update({
        where: { id: tenant.id },
        data: { createdAt: newDate }
    });

    console.log(`Updated tenant ${tenant.name}. CreatedAt is now ${newDate.toISOString()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
