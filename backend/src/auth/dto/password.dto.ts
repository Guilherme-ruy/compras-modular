import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).+$/;
const PASSWORD_MSG = 'A senha deve ter pelo menos 8 caracteres, uma letra maiúscula e um número';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@empresa.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recebido por email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NovaSenha1', minLength: 8 })
  @IsString()
  @MinLength(8, { message: PASSWORD_MSG })
  @Matches(PASSWORD_RULE, { message: PASSWORD_MSG })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'SenhaAtual1' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NovaSenha1', minLength: 8 })
  @IsString()
  @MinLength(8, { message: PASSWORD_MSG })
  @Matches(PASSWORD_RULE, { message: PASSWORD_MSG })
  newPassword: string;
}
