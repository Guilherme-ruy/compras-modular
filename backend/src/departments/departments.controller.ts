import {
  Controller, Get, Post, Put, Param, Body, Query,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar departamentos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  findAll(
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.departmentsService.findAll({
      search,
      activeOnly: activeOnly === 'true',
      page: page ? parseInt(page, 10) : 1,
      perPage: perPage ? parseInt(perPage, 10) : 50,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Buscar departamento por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentsService.findById(id);
  }

  @Post()
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Criar departamento' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Put(':id')
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Atualizar departamento' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, dto);
  }
}
