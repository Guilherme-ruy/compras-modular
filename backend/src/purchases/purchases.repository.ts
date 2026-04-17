import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export const PURCHASE_INCLUDE = {
  requester: { include: { role: true } },
  department: true,
  supplier: true,
  workflow: {
    include: {
      buyers: { include: { user: true } },
      steps: { orderBy: { stepOrder: 'asc' as const } },
    },
  },
  currentStep: {
    include: { approverRole: true, approverUser: true },
  },
  items: true,
} as const;

@Injectable()
export class PurchasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    requesterId?: string;
    departmentIds?: string[];
    departmentFilter?: string;
    status?: string;
    search?: string;
    page: number;
    perPage: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isAdmin?: boolean;
  }) {
    const {
      requesterId, departmentIds, departmentFilter,
      status, search, page, perPage,
      sortBy = 'createdAt', sortOrder = 'desc', isAdmin,
    } = params;

    const where: Prisma.PurchaseWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { metadata: { path: ['notes'], string_contains: search } },
      ];
    }
    if (departmentFilter) {
      where.departmentId = departmentFilter;
    }

    if (!isAdmin && requesterId && departmentIds) {
      // REQUESTER: sees own purchases OR purchases in their departments
      where.OR = [
        { requesterId },
        { departmentId: { in: departmentIds } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        where,
        include: PURCHASE_INCLUDE,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.purchase.count({ where }),
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
    return this.prisma.purchase.findUnique({
      where: { id },
      include: {
        ...PURCHASE_INCLUDE,
        approvals: {
          include: { actor: true, step: true },
          orderBy: { actedAt: 'asc' },
        },
      },
    });
  }

  async create(data: {
    requesterId: string;
    departmentId: string;
    supplierId?: string;
    totalAmount: number;
    metadata: any;
    items: Array<{ description: string; link?: string; quantity: number; unitPrice: number }>;
  }) {
    return this.prisma.purchase.create({
      data: {
        requesterId: data.requesterId,
        departmentId: data.departmentId,
        supplierId: data.supplierId ?? null,
        totalAmount: data.totalAmount,
        status: 'DRAFT',
        metadata: data.metadata ?? {},
        items: {
          create: data.items.map((i) => ({
            description: i.description,
            link: i.link ?? '',
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      },
      include: PURCHASE_INCLUDE,
    });
  }

  async update(
    id: string,
    data: {
      departmentId?: string;
      supplierId?: string | null;
      totalAmount?: number;
      metadata?: any;
      items?: Array<{ description: string; link?: string; quantity: number; unitPrice: number }>;
    },
  ) {
    const { items, ...rest } = data;
    return this.prisma.$transaction(async (tx) => {
      if (items !== undefined) {
        await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
        await tx.purchaseItem.createMany({
          data: items.map((i) => ({
            purchaseId: id,
            description: i.description,
            link: i.link ?? '',
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        });
      }
      return tx.purchase.update({
        where: { id },
        data: rest,
        include: PURCHASE_INCLUDE,
      });
    });
  }

  updateStatusAndStep(
    tx: Prisma.TransactionClient,
    purchaseId: string,
    status: string,
    currentStepId: string | null,
    workflowId?: string | null,
  ) {
    return tx.purchase.update({
      where: { id: purchaseId },
      data: {
        status,
        currentStepId,
        ...(workflowId !== undefined && { workflowId }),
      },
    });
  }

  createApprovalLog(
    tx: Prisma.TransactionClient,
    data: {
      purchaseId: string;
      stepId?: string | null;
      actedBy: string;
      action: string;
      comments?: string;
      attachments?: any[];
    },
  ) {
    return tx.purchaseApproval.create({
      data: {
        purchaseId: data.purchaseId,
        stepId: data.stepId ?? null,
        actedBy: data.actedBy,
        action: data.action,
        comments: data.comments ?? '',
        attachments: data.attachments ?? [],
      },
    });
  }
}
