import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { tenantAls } from '../common/tenant.als';

const TENANT_MODELS = [
  'SystemSettings',
  'User',
  'Department',
  'Category',
  'Supplier',
  'Purchase',
  'ApprovalWorkflow',
  'Notification',
];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'warn', 'error']
          : ['warn', 'error'],
    } as any);

    // Prisma 5+ removeu $use, então usamos um Proxy para injetar o tenantId em tempo de execução
    return new Proxy(this, {
      get(target: any, modelName: string) {
        const isTenantModel = TENANT_MODELS.some(m => m.toLowerCase() === modelName.toLowerCase());
        if (isTenantModel) {
          const originalModel = target[modelName];
          return new Proxy(originalModel, {
            get(modelTarget: any, action: string) {
              if (typeof modelTarget[action] === 'function') {
                return (args: any) => {
                  const store = tenantAls.getStore();
                  if (!store || !store.tenantId) {
                    return modelTarget[action](args);
                  }

                  if (!args) args = {};

                  const readActions = ['findUnique', 'findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate'];
                  if (readActions.includes(action)) {
                    if (!args.where) args.where = {};
                    if (args.where.tenantId === undefined || args.where.tenantId === '') {
                      args.where.tenantId = store.tenantId;
                    }
                  }

                  const writeActions = ['create', 'createMany', 'upsert'];
                  if (writeActions.includes(action)) {
                    if (action === 'create' && args.data) {
                      args.data.tenantId = store.tenantId;
                    }
                    if (action === 'createMany' && args.data) {
                      if (Array.isArray(args.data)) {
                        args.data.forEach((d: any) => d.tenantId = store.tenantId);
                      } else {
                        args.data.tenantId = store.tenantId;
                      }
                    }
                    if (action === 'upsert') {
                      if (args.create) args.create.tenantId = store.tenantId;
                      if (args.where) args.where.tenantId = store.tenantId;
                    }
                  }

                  return modelTarget[action](args);
                };
              }
              return modelTarget[action];
            }
          });
        }
        return target[modelName];
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
