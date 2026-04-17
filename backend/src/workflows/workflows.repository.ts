import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export const WORKFLOW_INCLUDE = {
  steps: {
    orderBy: { stepOrder: 'asc' as const },
    include: { approverRole: true, approverUser: true },
  },
  buyers: { include: { user: { include: { role: true } } } },
  department: true,
} as const;

@Injectable()
export class WorkflowsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    departmentId?: string;
    page: number;
    perPage: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { departmentId, page, perPage, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const where: Prisma.ApprovalWorkflowWhereInput = { isActive: true };
    if (departmentId) where.departmentId = departmentId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.approvalWorkflow.findMany({
        where,
        include: WORKFLOW_INCLUDE,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.approvalWorkflow.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.max(1, Math.ceil(total / perPage)),
      },
    };
  }

  findById(id: string) {
    return this.prisma.approvalWorkflow.findUnique({
      where: { id },
      include: WORKFLOW_INCLUDE,
    });
  }

  findActiveByDepartment(departmentId: string) {
    return this.prisma.approvalWorkflow.findFirst({
      where: { departmentId, isActive: true },
      include: WORKFLOW_INCLUDE,
    });
  }

  /** Find active workflow for a specific department (any amount >= minAmount) */
  findForPurchase(departmentId: string) {
    return this.prisma.approvalWorkflow.findFirst({
      where: { departmentId, isActive: true },
      include: WORKFLOW_INCLUDE,
      orderBy: { minAmount: 'desc' },
    });
  }

  findStepById(stepId: string) {
    return this.prisma.workflowStep.findUnique({
      where: { id: stepId },
      include: { workflow: { include: WORKFLOW_INCLUDE } },
    });
  }

  async create(data: {
    departmentId: string;
    previousWorkflowId?: string;
    version: number;
    finalAction: string;
    buyerUserIds: string[];
    steps: Array<{ stepOrder: number; approverUserId?: string; approverRoleId?: string }>;
  }) {
    return this.prisma.approvalWorkflow.create({
      data: {
        departmentId: data.departmentId,
        previousWorkflowId: data.previousWorkflowId,
        version: data.version,
        isActive: true,
        minAmount: 0,
        finalAction: data.finalAction,
        buyers: {
          create: data.buyerUserIds.map((userId) => ({ userId })),
        },
        steps: {
          create: data.steps.map((s) => ({
            stepOrder: s.stepOrder,
            approverUserId: s.approverUserId ?? null,
            approverRoleId: s.approverRoleId ?? null,
          })),
        },
      },
      include: WORKFLOW_INCLUDE,
    });
  }

  deactivate(id: string) {
    return this.prisma.approvalWorkflow.update({
      where: { id },
      data: { isActive: false },
    });
  }

  delete(id: string) {
    return this.prisma.approvalWorkflow.delete({ where: { id } });
  }
}
