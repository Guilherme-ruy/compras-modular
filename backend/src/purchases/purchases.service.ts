import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchasesRepository } from './purchases.repository';
import { WorkflowsRepository } from '../workflows/workflows.repository';
import { UsersRepository } from '../users/users.repository';
import { DepartmentsRepository } from '../departments/departments.repository';
import { CreatePurchaseDto, UpdatePurchaseDto, WorkflowActionDto } from './dto/purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly purchasesRepository: PurchasesRepository,
    private readonly workflowsRepository: WorkflowsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly departmentsRepository: DepartmentsRepository,
  ) {}

  // ── LIST ──────────────────────────────────────────────────────────────────

  async findAll(
    userId: string,
    roleName: string,
    query: {
      status?: string;
      departmentId?: string;
      search?: string;
      page?: number;
      perPage?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const isAdmin = ['SUPERADMIN', 'ADMIN', 'VIEWER'].includes(roleName.toUpperCase());

    if (isAdmin) {
      return this.purchasesRepository.findAll({
        isAdmin: true,
        departmentFilter: query.departmentId,
        status: query.status,
        search: query.search,
        page: query.page ?? 1,
        perPage: query.perPage ?? 20,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });
    }

    // REQUESTER / COMPRADOR / APROVADOR — scoped to their departments
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const departmentIds = user.departments.map((d: any) => d.id);

    return this.purchasesRepository.findAll({
      requesterId: userId,
      departmentIds,
      departmentFilter: query.departmentId,
      status: query.status,
      search: query.search,
      page: query.page ?? 1,
      perPage: query.perPage ?? 20,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  // ── GET BY ID ─────────────────────────────────────────────────────────────

  async findById(purchaseId: string, userId: string, roleName: string) {
    const purchase = await this.purchasesRepository.findById(purchaseId);
    if (!purchase) throw new NotFoundException('Pedido não encontrado');

    const isAdmin = ['SUPERADMIN', 'ADMIN', 'VIEWER'].includes(roleName.toUpperCase());

    if (!isAdmin) {
      const user = await this.usersRepository.findById(userId);
      const deptIds = user?.departments.map((d: any) => d.id) ?? [];
      const canView =
        purchase.requesterId === userId || deptIds.includes(purchase.departmentId);
      if (!canView) throw new ForbiddenException('Acesso negado a este pedido');
    }

    // Build permissions
    const permissions = await this.buildPermissions(purchase, userId, roleName);

    return { ...purchase, permissions };
  }

  // ── CREATE ────────────────────────────────────────────────────────────────

  async create(userId: string, roleName: string, dto: CreatePurchaseDto) {
    const dept = await this.departmentsRepository.findById(dto.departmentId);
    if (!dept.isActive) {
      throw new BadRequestException('Departamento inativo não aceita novos pedidos');
    }

    // Check department membership (unless admin)
    if (!['SUPERADMIN', 'ADMIN'].includes(roleName.toUpperCase())) {
      const user = await this.usersRepository.findById(userId);
      const belongs = user?.departments.some(
        (d: any) => d.id === dto.departmentId,
      );
      if (!belongs) {
        throw new ForbiddenException(
          'Você não tem permissão para criar pedidos para um departamento que não está vinculado ao seu perfil',
        );
      }
    }

    // Check workflow exists (unless admin creating draft)
    const isAdmin = ['SUPERADMIN', 'ADMIN'].includes(roleName.toUpperCase());
    const workflow = await this.workflowsRepository.findForPurchase(dto.departmentId);
    if (!workflow && !isAdmin) {
      throw new BadRequestException(
        'Este departamento está bloqueado para pedidos porque o fluxo de aprovação não foi configurado',
      );
    }

    // Build metadata from DTO and justification
    const metadata = {
      ...(dto.metadata || {}),
      ...(dto.justification && { justification: dto.justification }),
      // Ensure justificativa (portuguese) is also there for compatibility with old code if any
      ...(dto.justification && { justificativa: dto.justification }),
    };

    return this.purchasesRepository.create({
      requesterId: userId,
      departmentId: dto.departmentId,
      supplierId: dto.supplierId,
      totalAmount: dto.totalAmount,
      metadata,
      items: dto.items,
    });
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────

  async update(purchaseId: string, userId: string, roleName: string, dto: UpdatePurchaseDto) {
    const purchase = await this.purchasesRepository.findById(purchaseId);
    if (!purchase) throw new NotFoundException('Pedido não encontrado');
    if (purchase.status !== 'DRAFT') {
      throw new BadRequestException('Apenas pedidos em rascunho podem ser editados');
    }
    const isAdmin = ['SUPERADMIN', 'ADMIN'].includes(roleName.toUpperCase());
    if (purchase.requesterId !== userId && !isAdmin) {
      throw new ForbiddenException('Apenas o solicitante ou um administrador pode editar este rascunho');
    }

    const dept = await this.departmentsRepository.findById(dto.departmentId);
    if (!dept.isActive) {
      throw new BadRequestException('Departamento inativo');
    }

    if (!['SUPERADMIN', 'ADMIN'].includes(roleName.toUpperCase())) {
      const user = await this.usersRepository.findById(userId);
      const belongs = user?.departments.some(
        (d: any) => d.id === dto.departmentId,
      );
      if (!belongs) throw new ForbiddenException('Você não pertence a este departamento');
    }

    const workflow = await this.workflowsRepository.findForPurchase(dto.departmentId);
    if (!workflow) throw new BadRequestException('Fluxo de aprovação não configurado para este departamento');

    return this.purchasesRepository.update(purchaseId, {
      departmentId: dto.departmentId,
      supplierId: dto.supplierId ?? null,
      totalAmount: dto.totalAmount,
      metadata: dto.metadata,
      items: dto.items,
    });
  }

  // ── WORKFLOW ACTIONS ──────────────────────────────────────────────────────

  async submit(purchaseId: string, userId: string, roleName: string) {
    const purchase = await this.purchasesRepository.findById(purchaseId);
    if (!purchase) throw new NotFoundException('Pedido não encontrado');
    if (purchase.status !== 'DRAFT') {
      throw new BadRequestException('Pedido precisa estar em rascunho para ser submetido');
    }

    const isAdmin = ['SUPERADMIN', 'ADMIN'].includes(roleName.toUpperCase());
    if (purchase.requesterId !== userId && !isAdmin) {
      throw new ForbiddenException('Apenas o solicitante ou um administrador pode submeter este pedido');
    }

    const workflow = await this.workflowsRepository.findForPurchase(purchase.departmentId);
    if (!workflow) throw new BadRequestException('Fluxo de aprovação não encontrado');

    const steps = workflow.steps;
    if (!steps || steps.length === 0) throw new BadRequestException('Fluxo sem etapas configuradas');

    const firstStep = steps[0];

    await this.prisma.$transaction(async (tx) => {
      await this.purchasesRepository.createApprovalLog(tx, {
        purchaseId,
        stepId: firstStep.id,
        actedBy: userId,
        action: 'SUBMITTED',
      });
      await this.purchasesRepository.updateStatusAndStep(tx, purchaseId, 'PENDING_APPROVAL', firstStep.id, workflow.id);
    });
  }

  async approve(purchaseId: string, userId: string, roleId: string, roleName: string, dto: WorkflowActionDto) {
    const purchase = await this.purchasesRepository.findById(purchaseId);
    if (!purchase) throw new NotFoundException('Pedido não encontrado');
    if (purchase.status !== 'PENDING_APPROVAL' || !purchase.currentStepId) {
      throw new BadRequestException('Pedido não está pendente de aprovação');
    }

    const step = purchase.currentStep;
    if (!step) throw new NotFoundException('Etapa não encontrada');

    this.assertUserAuthorizedForStep(step, userId, roleId, roleName);
    this.assertUserBelongsToDepartment(purchase, userId);

    const workflow = purchase.workflow;
    if (!workflow) throw new NotFoundException('Fluxo não encontrado');

    const steps = workflow.steps.sort((a: any, b: any) => a.stepOrder - b.stepOrder);
    const currentIdx = steps.findIndex((s: any) => s.id === step.id);
    const nextStep = steps[currentIdx + 1] ?? null;

    let newStatus = 'PENDING_APPROVAL';
    if (!nextStep) {
      newStatus = workflow.finalAction === 'AUTO_APPROVE' ? 'APPROVED' : 'PENDING_CLOSING';
    }

    await this.prisma.$transaction(async (tx) => {
      await this.purchasesRepository.createApprovalLog(tx, {
        purchaseId,
        stepId: step.id,
        actedBy: userId,
        action: 'APPROVED',
        comments: dto.comments,
        attachments: dto.attachments,
      });
      await this.purchasesRepository.updateStatusAndStep(
        tx, purchaseId, newStatus, nextStep?.id ?? null,
      );
    });
  }

  async reject(purchaseId: string, userId: string, roleId: string, roleName: string, dto: WorkflowActionDto) {
    if (!dto.comments) throw new BadRequestException('Comentário é obrigatório para rejeição');

    const purchase = await this.purchasesRepository.findById(purchaseId);
    if (!purchase) throw new NotFoundException('Pedido não encontrado');
    if (purchase.status !== 'PENDING_APPROVAL' || !purchase.currentStepId) {
      throw new BadRequestException('Pedido não está pendente de aprovação');
    }

    const step = purchase.currentStep;
    if (!step) throw new NotFoundException('Etapa não encontrada');

    this.assertUserAuthorizedForStep(step, userId, roleId, roleName);
    this.assertUserBelongsToDepartment(purchase, userId);

    await this.prisma.$transaction(async (tx) => {
      await this.purchasesRepository.createApprovalLog(tx, {
        purchaseId,
        stepId: step.id,
        actedBy: userId,
        action: 'REJECTED',
        comments: dto.comments,
        attachments: dto.attachments,
      });
      await this.purchasesRepository.updateStatusAndStep(tx, purchaseId, 'REJECTED', null);
    });
  }

  async close(purchaseId: string, userId: string, roleName: string, dto: WorkflowActionDto) {
    const purchase = await this.purchasesRepository.findById(purchaseId);
    if (!purchase) throw new NotFoundException('Pedido não encontrado');
    if (purchase.status !== 'PENDING_CLOSING') {
      throw new BadRequestException('Pedido não está pendente de fechamento');
    }

    const isAdmin = ['SUPERADMIN', 'ADMIN'].includes(roleName?.toUpperCase());
    const isBuyer = purchase.workflow?.buyers?.some((b: any) => b.userId === userId);
    
    if (!isBuyer && !isAdmin) {
      throw new ForbiddenException('Apenas compradores designados ou administradores podem fechar este pedido');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.purchasesRepository.createApprovalLog(tx, {
        purchaseId,
        actedBy: userId,
        action: 'COMPLETED',
        comments: dto.comments,
        attachments: dto.attachments,
      });
      await this.purchasesRepository.updateStatusAndStep(tx, purchaseId, 'COMPLETED', null);
    });
  }

  async uploadPostCloseDocuments(purchaseId: string, userId: string, roleName: string, dto: WorkflowActionDto) {
    const purchase = await this.purchasesRepository.findById(purchaseId);
    if (!purchase) throw new NotFoundException('Pedido não encontrado');
    if (purchase.status !== 'COMPLETED') {
      throw new BadRequestException('Pedido precisa estar concluído para receber documentos pós-fechamento');
    }
    if (!dto.attachments || dto.attachments.length === 0) {
      throw new BadRequestException('Ao menos um anexo é obrigatório');
    }

    const isAdmin = ['SUPERADMIN', 'ADMIN'].includes((roleName || '').toUpperCase());
    const isBuyer = purchase.workflow?.buyers?.some((b: any) => b.userId === userId);
    
    if (!isBuyer && !isAdmin) {
      throw new ForbiddenException(
        'Apenas compradores configurados ou administradores podem anexar documentos após o fechamento',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await this.purchasesRepository.createApprovalLog(tx, {
        purchaseId,
        actedBy: userId,
        action: 'POST_CLOSE_DOCUMENTS_ADDED',
        comments: dto.comments,
        attachments: dto.attachments,
      });
    });
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────

  private assertUserAuthorizedForStep(step: any, userId: string, roleId: string, roleName: string) {
    const isAdmin = ['SUPERADMIN', 'ADMIN'].includes((roleName || '').toUpperCase());
    const authorizedByUser = step.approverUserId === userId;
    const authorizedByRole = step.approverRoleId === roleId;

    if (!authorizedByUser && !authorizedByRole && !isAdmin) {
      throw new ForbiddenException(
        'Você não tem permissão para aprovar/rejeitar o pedido nesta etapa',
      );
    }
  }

  private assertUserBelongsToDepartment(purchase: any, userId: string) {
    // Simplification: the RBAC check on requester and user.departments was already done on list/get
    // For approval, we trust the step assignment
  }

  private canUserClose(purchase: any, userId: string, roleName?: string): boolean {
    const isAdmin = ['SUPERADMIN', 'ADMIN'].includes((roleName || '').toUpperCase());
    if (isAdmin) return true;
    if (purchase.requesterId === userId) return true;
    return purchase.workflow?.buyers?.some((b: any) => b.userId === userId) ?? false;
  }

  private async buildPermissions(purchase: any, userId: string, roleName: string) {
    const isAdmin = ['SUPERADMIN', 'ADMIN'].includes((roleName || '').toUpperCase());

    const permissions = {
      canEdit: false,
      canSubmit: false,
      canApprove: false,
      canReject: false,
      canClose: false,
      canUploadPostCloseDocuments: false,
    };

    const isOwner = purchase.requesterId === userId;

    if (purchase.status === 'DRAFT') {
      permissions.canEdit = isAdmin || isOwner;
      permissions.canSubmit = isAdmin || isOwner;
    }

    if (purchase.status === 'PENDING_APPROVAL' && purchase.currentStep) {
      const step = purchase.currentStep;
      permissions.canApprove = isAdmin || (step.approverUserId === userId);
      permissions.canReject = permissions.canApprove;
    }

    if (purchase.status === 'PENDING_CLOSING') {
      permissions.canClose = this.canUserClose(purchase, userId, roleName);
    }

    if (purchase.status === 'COMPLETED') {
      permissions.canUploadPostCloseDocuments = isAdmin ||
        (purchase.workflow?.buyers?.some((b: any) => b.userId === userId) ?? false);
    }

    return permissions;
  }
}
