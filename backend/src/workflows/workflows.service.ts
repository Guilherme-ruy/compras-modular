import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { WorkflowsRepository } from './workflows.repository';
import { UsersRepository } from '../users/users.repository';
import { DepartmentsRepository } from '../departments/departments.repository';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly workflowsRepository: WorkflowsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly departmentsRepository: DepartmentsRepository,
  ) {}

  findAll(query: {
    departmentId?: string;
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.workflowsRepository.findAll({
      departmentId: query.departmentId,
      page: query.page ?? 1,
      perPage: query.perPage ?? 20,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async findById(id: string) {
    const workflow = await this.workflowsRepository.findById(id);
    if (!workflow) throw new NotFoundException('Fluxo não encontrado');
    return workflow;
  }

  async create(dto: CreateWorkflowDto) {
    await this.validateWorkflowInput(dto, null);

    const existing = await this.workflowsRepository.findActiveByDepartment(dto.departmentId);
    if (existing) {
      throw new ConflictException('Este departamento já possui um fluxo de aprovação ativo');
    }

    return this.workflowsRepository.create({
      departmentId: dto.departmentId,
      version: 1,
      finalAction: dto.finalAction,
      buyerUserIds: dto.buyerUserIds,
      steps: dto.steps,
    });
  }

  async update(id: string, dto: UpdateWorkflowDto) {
    const existing = await this.findById(id);
    await this.validateWorkflowInput(dto, id);

    // Versioning: create new, deactivate old
    const newWorkflow = await this.workflowsRepository.create({
      departmentId: dto.departmentId,
      previousWorkflowId: existing.id,
      version: existing.version + 1,
      finalAction: dto.finalAction,
      buyerUserIds: dto.buyerUserIds,
      steps: dto.steps,
    });

    await this.workflowsRepository.deactivate(existing.id);

    return newWorkflow;
  }

  async delete(id: string) {
    await this.findById(id);
    // Note: purchases relation not loaded here; safe to delete inactive workflows only
    return this.workflowsRepository.delete(id);
  }

  private async validateWorkflowInput(dto: CreateWorkflowDto, currentWorkflowId: string | null) {
    // Validate department
    const dept = await this.departmentsRepository.findById(dto.departmentId);
    if (!dept.isActive) {
      throw new BadRequestException('Não é permitido configurar fluxo para departamento inativo');
    }

    // Validate buyers
    if (!dto.buyerUserIds || dto.buyerUserIds.length === 0) {
      throw new BadRequestException('Configure ao menos um comprador para o departamento');
    }

    const uniqueBuyers = new Set(dto.buyerUserIds);
    if (uniqueBuyers.size !== dto.buyerUserIds.length) {
      throw new BadRequestException('Não repita compradores na configuração');
    }

    for (const buyerId of dto.buyerUserIds) {
      const user = await this.usersRepository.findById(buyerId);
      if (!user) throw new NotFoundException(`Comprador ${buyerId} não encontrado`);
      if (!user.isActive) throw new BadRequestException('Não é permitido configurar comprador inativo');
      const belongsToDept = user.departments.some(
        (d: any) => d.id === dto.departmentId,
      );
      if (!belongsToDept) {
        throw new BadRequestException('Todos os compradores precisam pertencer ao departamento');
      }
      if (user.role.name.toUpperCase() !== 'COMPRADOR') {
        throw new BadRequestException('Os compradores selecionados precisam ter o cargo COMPRADOR');
      }
    }

    // Validate steps
    if (!dto.steps || dto.steps.length === 0) {
      throw new BadRequestException('Configure ao menos uma etapa de aprovação');
    }
    if (dto.steps.length > 10) {
      throw new BadRequestException('O fluxo pode ter no máximo 10 etapas');
    }

    for (let i = 0; i < dto.steps.length; i++) {
      const step = dto.steps[i];
      if (step.stepOrder !== i + 1) {
        throw new BadRequestException('As etapas precisam estar em ordem sequencial');
      }
      if (!step.approverUserId) {
        throw new BadRequestException('Cada etapa precisa ter um aprovador por usuário');
      }
      if (step.approverRoleId) {
        throw new BadRequestException('As etapas aceitam apenas aprovadores por usuário');
      }

      const approver = await this.usersRepository.findById(step.approverUserId);
      if (!approver) throw new NotFoundException(`Aprovador ${step.approverUserId} não encontrado`);
      if (!approver.isActive) throw new BadRequestException('Não é permitido configurar aprovador inativo');
      const belongsToDept = approver.departments.some(
        (d: any) => d.id === dto.departmentId,
      );
      if (!belongsToDept) {
        throw new BadRequestException('Os aprovadores precisam pertencer ao departamento');
      }
      if (approver.role.name.toUpperCase() !== 'APROVADOR') {
        throw new BadRequestException('Os aprovadores selecionados precisam ter o cargo APROVADOR');
      }
    }
  }
}
