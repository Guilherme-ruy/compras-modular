import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding database...');

  // ── Roles ──────────────────────────────────────────────────────────────
  const roleNames = ['SUPERADMIN', 'ADMIN', 'APROVADOR', 'COMPRADOR', 'REQUISITANTE', 'VIEWER'];
  const createdRoles: Record<string, string> = {};

  for (const name of roleNames) {
    const r = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, permissions: {} },
    });
    createdRoles[name] = r.id;
    console.log(`  ✔ Role: ${name}`);
  }

  // ── System Settings ────────────────────────────────────────────────────
  await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      companyName: 'Compras Modular',
      document: '',
      themeConfig: { primaryColor: '#2563eb', logoUrl: '' },
    },
  });
  console.log('  ✔ SystemSettings');

  // ── Departments ────────────────────────────────────────────────────────
  const adminDept = await prisma.department.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000001', name: 'Administração', isActive: true },
  });
  const tiDept = await prisma.department.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: { id: '00000000-0000-0000-0000-000000000002', name: 'TI', isActive: true },
  });
  console.log(`  ✔ Departments: ${adminDept.name}, ${tiDept.name}`);

  // ── Helper: create user + link departments ─────────────────────────────
  async function upsertUser(
    email: string,
    name: string,
    roleName: string,
    deptIds: string[],
  ) {
    const hash = await bcrypt.hash('123456', 10);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return existing;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hash,
        roleId: createdRoles[roleName],
        isActive: true,
      },
    });

    for (const departmentId of deptIds) {
      await prisma.userDepartment.upsert({
        where: { userId_departmentId: { userId: user.id, departmentId } },
        update: {},
        create: { userId: user.id, departmentId },
      });
    }

    console.log(`  ✔ User: ${email} (${roleName})`);
    return user;
  }

  await upsertUser('admin@empresa.com', 'Administrador', 'SUPERADMIN', [adminDept.id]);
  const aprovador = await upsertUser('aprovador@empresa.com', 'João Aprovador', 'APROVADOR', [tiDept.id]);
  const comprador = await upsertUser('comprador@empresa.com', 'Maria Compradora', 'COMPRADOR', [tiDept.id]);
  await upsertUser('requisitante@empresa.com', 'Pedro Requisitante', 'REQUISITANTE', [tiDept.id]);

  // ── Workflow for TI ────────────────────────────────────────────────────
  const existingWorkflow = await prisma.approvalWorkflow.findFirst({
    where: { departmentId: tiDept.id, isActive: true },
  });

  if (!existingWorkflow) {
    const workflow = await prisma.approvalWorkflow.create({
      data: {
        departmentId: tiDept.id,
        version: 1,
        isActive: true,
        minAmount: 0,
        finalAction: 'BUYER_CLOSE',
      },
    });

    await prisma.workflowBuyer.create({
      data: { workflowId: workflow.id, userId: comprador.id },
    });

    await prisma.workflowStep.create({
      data: { workflowId: workflow.id, stepOrder: 1, approverUserId: aprovador.id },
    });

    console.log('  ✔ Workflow: TI (1 etapa, 1 comprador)');
  }

  console.log('\n✅ Seed concluído!');
  console.log('\n📋 Contas de teste (senha: 123456):');
  console.log('   admin@empresa.com         → SUPERADMIN');
  console.log('   aprovador@empresa.com      → APROVADOR  (TI)');
  console.log('   comprador@empresa.com      → COMPRADOR  (TI)');
  console.log('   requisitante@empresa.com   → REQUISITANTE (TI)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
