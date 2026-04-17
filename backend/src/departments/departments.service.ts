import { Injectable, NotFoundException } from '@nestjs/common';
import { DepartmentsRepository } from './departments.repository';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly departmentsRepository: DepartmentsRepository) {}

  findAll(query: {
    search?: string;
    activeOnly?: boolean;
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.departmentsRepository.findAll({
      search: query.search,
      activeOnly: query.activeOnly,
      page: query.page ?? 1,
      perPage: query.perPage ?? 50,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  findById(id: string) {
    return this.departmentsRepository.findById(id);
  }

  create(dto: CreateDepartmentDto) {
    return this.departmentsRepository.create({
      name: dto.name,
      isActive: dto.isActive ?? true,
      ...(dto.parentId ? { parent: { connect: { id: dto.parentId } } } : {}),
    });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.departmentsRepository.findById(id); // throws if not found
    return this.departmentsRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.parentId !== undefined
        ? { parent: { connect: { id: dto.parentId } } }
        : {}),
    });
  }
}
