import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface SupplierListParams {
  search?: string;
  status?: string;
  page: number;
  perPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class SuppliersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: SupplierListParams) {
    const { search, status, page, perPage, sortBy = 'companyName', sortOrder = 'asc' } = params;

    const where: Prisma.SupplierWhereInput = { deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.supplier.count({ where }),
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
    return this.prisma.supplier.findFirst({ where: { id, deletedAt: null } });
  }

  create(data: Prisma.SupplierCreateInput) {
    return this.prisma.supplier.create({ data });
  }

  update(id: string, data: Prisma.SupplierUpdateInput) {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.supplier.update({ where: { id }, data: { status } });
  }
}
