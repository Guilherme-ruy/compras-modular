import {
  Controller, Get, Post, Put, Param, Body, Query,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto, UpdatePurchaseDto, WorkflowActionDto } from './dto/purchase.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pedidos de compra' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.purchasesService.findAll(user.id, user.roleName, {
      status,
      departmentId,
      search,
      page: page ? parseInt(page, 10) : 1,
      perPage: perPage ? parseInt(perPage, 10) : 20,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.purchasesService.findById(id, user.id, user.roleName);
  }

  @Post()
  @ApiOperation({ summary: 'Criar pedido de compra' })
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchasesService.create(user.id, user.roleName, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar pedido (apenas rascunho)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.update(id, user.id, user.roleName, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submeter pedido para aprovação' })
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.purchasesService.submit(id, user.id, user.roleName);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprovar pedido na etapa atual' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.purchasesService.approve(id, user.id, user.roleId, user.roleName, dto);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rejeitar pedido na etapa atual' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.purchasesService.reject(id, user.id, user.roleId, user.roleName, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Fechar pedido aprovado' })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.purchasesService.close(id, user.id, user.roleName, dto);
  }

  @Post(':id/post-close-documents')
  @ApiOperation({ summary: 'Anexar documentos após o fechamento' })
  uploadPostCloseDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: WorkflowActionDto,
  ) {
    return this.purchasesService.uploadPostCloseDocuments(id, user.id, user.roleName, dto);
  }
}
