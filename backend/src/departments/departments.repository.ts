import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface DepartmentListParams {
  search?: string;
  activeOnly?: boolean;
  page: number;
  perPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: DepartmentListParams) {
    const { search, activeOnly, page, perPage, sortBy = 'name', sortOrder = 'asc' } = params;

    const where: Prisma.DepartmentWhereInput = {};
    if (activeOnly) where.isActive = true;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.department.count({ where }),
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

  async findById(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Departamento não encontrado');
    return dept;
  }

  create(data: Prisma.DepartmentCreateInput) {
    return this.prisma.department.create({ data });
  }

  update(id: string, data: Prisma.DepartmentUpdateInput) {
    return this.prisma.department.update({ where: { id }, data });
  }
}
