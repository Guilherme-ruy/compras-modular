import {
  IsUUID, IsArray, IsString, IsOptional, IsIn, ValidateNested, IsInt, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkflowStepDto {
  @ApiProperty() @IsInt() @Min(1) stepOrder: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() approverUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() approverRoleId?: string;
}

export class CreateWorkflowDto {
  @ApiProperty() @IsUUID() departmentId: string;

  @ApiProperty({
    description: 'IDs dos compradores responsáveis',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  buyerUserIds: string[];

  @ApiProperty({ enum: ['BUYER_CLOSE', 'AUTO_APPROVE'] })
  @IsString()
  @IsIn(['BUYER_CLOSE', 'AUTO_APPROVE'])
  finalAction: string;

  @ApiProperty({ type: [WorkflowStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];
}

export class UpdateWorkflowDto extends CreateWorkflowDto {}
