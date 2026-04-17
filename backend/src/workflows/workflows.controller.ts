import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar fluxos de aprovação' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    try {
      return this.workflowsService.findAll({
        departmentId,
        page: page ? parseInt(page, 10) : 1,
        perPage: perPage ? parseInt(perPage, 10) : 20,
        sortBy,
        sortOrder,
      });
    } catch (error) {
      console.error('WORKFLOWS_FIND_ALL_ERROR:', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter fluxo por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.findById(id);
  }

  @Post()
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Criar fluxo de aprovação' })
  create(@Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(dto);
  }

  @Put(':id')
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Atualizar fluxo (cria nova versão)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.workflowsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Remover fluxo de aprovação' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.delete(id);
  }
}
