import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const CATEGORY_INCLUDE = {
  parent: { select: { id: true, name: true } },
  _count: { select: { items: true } },
} as const;

export interface CategoryListParams {
  search?: string;
  activeOnly?: boolean;
  page: number;
  perPage: number;
}

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: CategoryListParams) {
    const { search, activeOnly, page, perPage } = params;

    const where: Prisma.CategoryWhereInput = {};
    if (activeOnly) where.isActive = true;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        include: CATEGORY_INCLUDE,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.category.count({ where }),
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

  // Flat list for selects — returns all active categories with parent info
  findFlat() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: { parent: { select: { id: true, name: true } } },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });
  }

  async findById(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: CATEGORY_INCLUDE,
    });
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    return cat;
  }

  create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({ data, include: CATEGORY_INCLUDE });
  }

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({ where: { id }, data, include: CATEGORY_INCLUDE });
  }
}
