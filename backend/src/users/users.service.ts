import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findAll(query: {
    search?: string;
    roleId?: string;
    departmentId?: string;
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.usersRepository.findAll({
      ...query,
      page: query.page ?? 1,
      perPage: query.perPage ?? 20,
    });
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepository.findByEmail(dto.email.toLowerCase().trim());
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.usersRepository.create({
      name: dto.name,
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      roleId: dto.roleId,
      departmentIds: dto.departmentIds ?? [],
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findByEmail(dto.email.toLowerCase());
      if (existing) throw new ConflictException('E-mail já está em uso');
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;

    return this.usersRepository.update(id, {
      name: dto.name,
      email: dto.email?.toLowerCase().trim(),
      passwordHash,
      roleId: dto.roleId,
      isActive: dto.isActive,
      departmentIds: dto.departmentIds,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
    return this.usersRepository.update(userId, {
      name: dto.name,
      passwordHash,
    });
  }

  async previewImpact(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);
    const currentDeptIds = (user.departments as any[]).map((d: any) => d.id);
    const nextDeptIds = dto.departmentIds ?? currentDeptIds;

    const removedDeptIds = currentDeptIds.filter((d) => !nextDeptIds.includes(d));

    const [
      activeApproverAssignments,
      activeBuyerAssignments,
    ] = await Promise.all([
      this.usersRepository.countActiveApproverAssignments(id),
      this.usersRepository.countActiveBuyerAssignments(id),
    ]);

    const blockingReasons: string[] = [];
    const warnings: string[] = [];
    let pendingApprovalsAtRemovedDepartment = 0;
    let historicalPurchasesInRemovedDept = 0;

    if (removedDeptIds.length > 0) {
      const [
        pendingApprovals,
        historicalPurchases,
        approverAtRemoved,
        buyerAtRemoved,
      ] = await Promise.all([
        this.usersRepository.countPendingApprovalsAtDepartments(id, removedDeptIds),
        this.usersRepository.countHistoricalPurchasesInDepartments(id, removedDeptIds),
        this.usersRepository.countApproverAssignmentsAtDepartments(id, removedDeptIds),
        this.usersRepository.countBuyerAssignmentsAtDepartments(id, removedDeptIds),
      ]);

      pendingApprovalsAtRemovedDepartment = pendingApprovals;
      historicalPurchasesInRemovedDept = historicalPurchases;

      if (approverAtRemoved > 0) {
        blockingReasons.push(
          `O usuário segue configurado como aprovador em ${approverAtRemoved} fluxo(s) ativo(s) de departamento que será removido.`,
        );
      }
      if (pendingApprovals > 0) {
        blockingReasons.push(
          `Existem ${pendingApprovals} pedido(s) pendentes de aprovação que deixariam de poder ser tratados por este usuário.`,
        );
      }
      if (buyerAtRemoved > 0) {
        warnings.push(
          `O usuário ainda está configurado como comprador em ${buyerAtRemoved} fluxo(s) ativo(s) de departamento que será removido.`,
        );
      }
      if (historicalPurchases > 0) {
        warnings.push(
          `O usuário possui ${historicalPurchases} pedido(s) criado(s) em departamentos que serão removidos.`,
        );
      }
    }

    return {
      blockingReasons,
      warnings,
      summary: {
        removedDepartments: removedDeptIds.length,
        activeWorkflowApproverAssignments: activeApproverAssignments,
        activeWorkflowBuyerAssignments: activeBuyerAssignments,
        pendingApprovalsAtRemovedDepartment,
        historicalPurchasesInRemovedDept,
      },
    };
  }
}
