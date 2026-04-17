import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(userId: string, roleName: string) {
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'VIEWER'].includes(roleName.toUpperCase());

    const scopeWhere = isAdmin
      ? {}
      : {
          OR: [
            { requesterId: userId },
            { department: { userDepartments: { some: { userId } } } },
          ],
        };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      pendingCount,
      approvedThisMonth,
      purchasesThisMonth,
      rejectedThisMonth,
      spendByDepartment,
    ] = await Promise.all([
      // Pedidos aguardando aprovação
      this.prisma.purchase.count({
        where: { ...scopeWhere, status: 'PENDING_APPROVAL' },
      }),

      // Total aprovado/concluído no mês
      this.prisma.purchase.aggregate({
        where: {
          ...scopeWhere,
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),

      // Volume de pedidos criados no mês
      this.prisma.purchase.count({
        where: {
          ...scopeWhere,
          createdAt: { gte: startOfMonth },
        },
      }),

      // Pedidos rejeitados no mês
      this.prisma.purchase.count({
        where: {
          ...scopeWhere,
          status: 'REJECTED',
          createdAt: { gte: startOfMonth },
        },
      }),

      // Gasto aprovado agrupado por departamento
      this.prisma.purchase.groupBy({
        by: ['departmentId'],
        where: {
          ...scopeWhere,
          status: 'COMPLETED',
        },
        _sum: { totalAmount: true },
      }),
    ]);

    // Resolve department names for the spend chart
    const departmentIds = spendByDepartment
      .map((s) => s.departmentId)
      .filter((id): id is string => id !== null);

    const departments = await this.prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, name: true },
    });

    const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

    const spendChart = spendByDepartment
      .filter((s) => s.departmentId !== null)
      .map((s) => ({
        department_name: deptMap[s.departmentId!] ?? 'Desconhecido',
        amount: s._sum.totalAmount ?? 0,
      }));

    return {
      pending_purchases_count: pendingCount,
      total_approved_amount: approvedThisMonth._sum.totalAmount ?? 0,
      purchases_this_month: purchasesThisMonth,
      rejected_this_month: rejectedThisMonth,
      spend_by_department: spendChart,
    };
  }
}
