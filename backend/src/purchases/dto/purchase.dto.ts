import {
  IsUUID, IsNumber, IsOptional, IsArray, IsString, ValidateNested, Min, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseItemDto {
  @ApiProperty() @IsString() description: string;
  @ApiPropertyOptional() @IsOptional() @IsString() link?: string;
  @ApiProperty() @IsNumber() @Min(0) quantity: number;
  @ApiProperty() @IsNumber() @Min(0) unitPrice: number;
}

export class CreatePurchaseDto {
  @ApiProperty() @IsString() departmentId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supplierId?: string;
  @ApiProperty() @IsNumber() @Min(0) totalAmount: number;
  @ApiPropertyOptional() @IsOptional() metadata?: any;

  @ApiPropertyOptional() @IsOptional() @IsString() justification?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDraft?: boolean;

  @ApiProperty({ type: [PurchaseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}

export class UpdatePurchaseDto extends CreatePurchaseDto {}

export class WorkflowActionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() comments?: string;
  @ApiPropertyOptional() @IsOptional() attachments?: any[];
}
