import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.role.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.role.findUnique({ where: { name } });
  }
}
