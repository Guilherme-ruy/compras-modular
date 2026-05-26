import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationsQueryDto {
  @ApiPropertyOptional({ enum: ['all', 'unread', 'read'] })
  @IsOptional()
  @IsString()
  @IsIn(['all', 'unread', 'read'])
  status?: 'all' | 'unread' | 'read' = 'all';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}
