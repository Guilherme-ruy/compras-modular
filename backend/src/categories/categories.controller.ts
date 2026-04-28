import {
  Controller, Get, Post, Put, Param, Body, Query,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias (paginado)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  findAll(
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.categoriesService.findAll({
      search,
      activeOnly: activeOnly === 'true',
      page: page ? parseInt(page, 10) : 1,
      perPage: perPage ? parseInt(perPage, 10) : 100,
    });
  }

  @Get('flat')
  @ApiOperation({ summary: 'Lista plana de categorias ativas (para selects)' })
  findFlat() {
    return this.categoriesService.findFlat();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar categoria' })
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.roleName, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, user.roleName, dto);
  }
}
