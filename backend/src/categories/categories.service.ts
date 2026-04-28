import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  findAll(query: { search?: string; activeOnly?: boolean; page?: number; perPage?: number }) {
    return this.categoriesRepository.findAll({
      search: query.search,
      activeOnly: query.activeOnly,
      page: query.page ?? 1,
      perPage: query.perPage ?? 100,
    });
  }

  findFlat() {
    return this.categoriesRepository.findFlat();
  }

  findById(id: string) {
    return this.categoriesRepository.findById(id);
  }

  create(roleName: string, dto: CreateCategoryDto) {
    if (!['SUPERADMIN', 'ADMIN'].includes(roleName.toUpperCase())) {
      throw new ForbiddenException('Apenas administradores podem gerenciar categorias');
    }
    return this.categoriesRepository.create({
      name: dto.name,
      isActive: dto.isActive ?? true,
      ...(dto.parentId ? { parent: { connect: { id: dto.parentId } } } : {}),
    });
  }

  async update(id: string, roleName: string, dto: UpdateCategoryDto) {
    if (!['SUPERADMIN', 'ADMIN'].includes(roleName.toUpperCase())) {
      throw new ForbiddenException('Apenas administradores podem gerenciar categorias');
    }
    await this.categoriesRepository.findById(id);

    return this.categoriesRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.parentId !== undefined
        ? { parent: { connect: { id: dto.parentId } } }
        : {}),
    });
  }
}
