import {
  IsString, IsOptional, IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty() @IsString() companyName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tradeName?: string;
  @ApiProperty() @IsString() cnpj: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stateReg?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() contactName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() comContact?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() finContact?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() zipCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() street?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() number?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() neighborhood?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() bank?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() agency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() account?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pix?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() attachments?: any[];
}

export class UpdateSupplierDto extends CreateSupplierDto {}

export class UpdateSupplierStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] })
  @IsString()
  status: string;
}
