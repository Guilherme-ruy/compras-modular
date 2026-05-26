import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Minha Empresa Ltda' })
  @IsString()
  @IsNotEmpty({ message: 'Nome da empresa é obrigatório' })
  companyName: string;

  @ApiProperty({ example: 'admin@empresa.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter ao menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: '11999999999', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
