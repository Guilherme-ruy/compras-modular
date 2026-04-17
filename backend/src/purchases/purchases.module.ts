import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { PurchasesRepository } from './purchases.repository';
import { WorkflowsModule } from '../workflows/workflows.module';
import { UsersModule } from '../users/users.module';
import { DepartmentsModule } from '../departments/departments.module';

@Module({
  imports: [WorkflowsModule, UsersModule, DepartmentsModule],
  controllers: [PurchasesController],
  providers: [PurchasesService, PurchasesRepository],
})
export class PurchasesModule {}
