import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantAls } from './tenant.als';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    // Não bloquear rotas relacionadas à Stripe para permitir pagamento!
    if (url.includes('/stripe/')) {
      return true;
    }

    // MODO READ-ONLY: Sempre permitir operações de leitura (GET)
    if (request.method === 'GET') {
      return true;
    }

    // Como o JwtAuthGuard executa depois dos guards globais,
    // extraimos o tenantId pelo AsyncLocalStorage (setado no TenantMiddleware)
    const store = tenantAls.getStore();
    const tenantId = store?.tenantId;

    if (!tenantId) {
      return true; // Se não tem tenant (admin global ou deslogado), deixa passar.
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) return false;

    if (tenant.subscriptionStatus === 'active') {
      return true;
    }

    if (tenant.subscriptionStatus === 'trialing') {
      const now = new Date();
      if (tenant.trialEndsAt && tenant.trialEndsAt > now) {
        return true;
      }
    }

    // Se chegou aqui, bloqueia com 402 Payment Required
    throw new HttpException(
      {
        message: 'Subscription Required',
        status: tenant.subscriptionStatus,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
