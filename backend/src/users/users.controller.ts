import {
  Controller, Get, Post, Put, Body, Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateProfileDto } from './dto/user.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Listar usuários' })
  findAll(
    @Query('search') search?: string,
    @Query('roleId') roleId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.usersService.findAll({
      search,
      roleId,
      departmentId,
      page: page ? parseInt(page, 10) : 1,
      perPage: perPage ? parseInt(perPage, 10) : 20,
      sortBy,
      sortOrder,
    });
  }

  @Post()
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Criar usuário' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Atualizar próprio perfil' })
  updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }
}
