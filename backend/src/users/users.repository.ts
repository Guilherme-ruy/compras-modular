import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export const USER_INCLUDE = {
  role: true,
  userDepartments: { include: { department: true } },
} as const;

// Flattens userDepartments → departments for frontend consumption
function serializeUser(user: any) {
  const { userDepartments, ...rest } = user;
  return {
    ...rest,
    departments: (userDepartments ?? []).map((ud: any) => ud.department),
  };
}

export interface UserListParams {
  search?: string;
  roleId?: string;
  departmentId?: string;
  page: number;
  perPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: UserListParams) {
    const { search, roleId, departmentId, page, perPage, sortBy = 'name', sortOrder = 'asc' } = params;

    const where: Prisma.UserWhereInput = {};
    if (roleId) where.roleId = roleId;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (departmentId) {
      where.userDepartments = { some: { departmentId } };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: USER_INCLUDE,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map(serializeUser),
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.max(1, Math.ceil(total / perPage)),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: USER_INCLUDE });
    return user ? serializeUser(user) : null;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: USER_INCLUDE,
    });
    return user ? serializeUser(user) : null;
  }

  findByRoleAndDepartment(roleId: string, departmentId: string) {
    return this.prisma.user.findMany({
      where: {
        roleId,
        isActive: true,
        userDepartments: { some: { departmentId } },
      },
      include: USER_INCLUDE,
    });
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    roleId: string;
    departmentIds: string[];
  }) {
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        isActive: true,
        userDepartments: {
          create: data.departmentIds.map((departmentId) => ({ departmentId })),
        },
      },
      include: USER_INCLUDE,
    });
    return serializeUser(user);
  }

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      passwordHash?: string;
      roleId?: string;
      isActive?: boolean;
      departmentIds?: string[];
    },
  ) {
    const { departmentIds, ...rest } = data;

    const user = await this.prisma.$transaction(async (tx) => {
      if (departmentIds !== undefined) {
        await tx.userDepartment.deleteMany({
          where: { userId: id },
        });

        if (departmentIds.length > 0) {
          await tx.userDepartment.createMany({
            data: departmentIds.map((departmentId) => ({
              userId: id,
              departmentId,
            })),
          });
        }
      }

      return tx.user.update({
        where: { id },
        data: rest,
        include: USER_INCLUDE,
      });
    });

    return serializeUser(user);
  }

  // ── Impact queries ──────────────────────────────────────────────────────

  countActiveApproverAssignments(userId: string) {
    return this.prisma.workflowStep.count({
      where: {
        approverUserId: userId,
        workflow: { isActive: true },
      },
    });
  }

  countActiveBuyerAssignments(userId: string) {
    return this.prisma.workflowBuyer.count({
      where: {
        userId,
        workflow: { isActive: true },
      },
    });
  }

  countPendingApprovalsAtDepartments(userId: string, departmentIds: string[]) {
    return this.prisma.purchase.count({
      where: {
        status: 'PENDING_APPROVAL',
        departmentId: { in: departmentIds },
        currentStep: { approverUserId: userId },
      },
    });
  }

  countHistoricalPurchasesInDepartments(userId: string, departmentIds: string[]) {
    return this.prisma.purchase.count({
      where: {
        requesterId: userId,
        departmentId: { in: departmentIds },
      },
    });
  }

  countApproverAssignmentsAtDepartments(userId: string, departmentIds: string[]) {
    return this.prisma.workflowStep.count({
      where: {
        approverUserId: userId,
        workflow: { isActive: true, departmentId: { in: departmentIds } },
      },
    });
  }

  countBuyerAssignmentsAtDepartments(userId: string, departmentIds: string[]) {
    return this.prisma.workflowBuyer.count({
      where: {
        userId,
        workflow: { isActive: true, departmentId: { in: departmentIds } },
      },
    });
  }
}
