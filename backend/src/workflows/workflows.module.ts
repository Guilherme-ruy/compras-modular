import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowsRepository } from './workflows.repository';
import { UsersModule } from '../users/users.module';
import { DepartmentsModule } from '../departments/departments.module';

@Module({
  imports: [UsersModule, DepartmentsModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowsRepository],
  exports: [WorkflowsRepository],
})
export class WorkflowsModule {}
