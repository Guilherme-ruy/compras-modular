import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
  private stripe: any;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2023-10-16' as any,
    });
  }

  async createCheckoutSession(tenantId: string, email: string) {
    // 1. Encontrar o Tenant no banco local
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }

    let customerId = tenant.stripeCustomerId;

    // 2. Se a empresa ainda não tiver um Customer ID na Stripe, criar um agora
    if (!customerId) {
      const existingCustomers = await this.stripe.customers.search({
        query: `email:'${email}'`,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const customer = await this.stripe.customers.create({
          name: tenant.name,
          email: email,
          metadata: {
            tenantId: tenant.id,
          },
        });
        customerId = customer.id;
      }

      // Salvar o customerId no nosso banco
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId: customerId },
      });
    } else {
      // Atualiza o email do cliente caso ele já existisse antes dessa melhoria
      await this.stripe.customers.update(customerId, { email });
    }

    // 3. Criar a sessão de checkout apontando para a URL do front-end
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        client_reference_id: tenant.id,
        line_items: [
          {
            price: process.env.STRIPE_DEFAULT_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `${process.env.FRONTEND_URL}/app?upgrade=true&success=true`,
        cancel_url: `${process.env.FRONTEND_URL}/app?upgrade=true&canceled=true`,
      });

      return { url: session.url };
    } catch (err: any) {
      this.logger.error(`Error creating checkout session: ${err.message}`);
      throw new Error(`Falha ao iniciar pagamento: ${err.message}`);
    }
  }

  async createPortalSession(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || !tenant.stripeCustomerId) {
      throw new Error('Empresa ainda não assinou nenhum plano.');
    }

    // Gerar link para o portal de autoatendimento da Stripe
    const session = await this.stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/subscription`,
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      this.logger.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      throw new Error('Webhook Error');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any;
        if (session.mode === 'subscription') {
          // O cliente pagou e assinou. Precisamos atualizar nosso banco.
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          await this.prisma.tenant.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              subscriptionStatus: 'active',
              stripeSubscriptionId: subscriptionId,
            },
          });
          this.logger.log(`✅ Tenant ativado via checkout: ${customerId}`);
        }
        break;

      case 'invoice.paid':
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          const subId = invoice.subscription as string;
          await this.prisma.tenant.updateMany({
            where: { stripeSubscriptionId: subId },
            data: { subscriptionStatus: 'active' },
          });
          this.logger.log(`💵 Fatura paga, assinatura mantida: ${subId}`);
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as any;
        if (failedInvoice.subscription) {
          const subId = failedInvoice.subscription as string;
          await this.prisma.tenant.updateMany({
            where: { stripeSubscriptionId: subId },
            data: { subscriptionStatus: 'past_due' },
          });
          this.logger.warn(`⚠️ Pagamento recusado, assinatura suspensa: ${subId}`);
        }
        break;

      case 'customer.subscription.deleted':
      case 'customer.subscription.canceled':
        const subscription = event.data.object as any;
        await this.prisma.tenant.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { subscriptionStatus: 'canceled' },
        });
        this.logger.log(`❌ Assinatura cancelada/expirada: ${subscription.id}`);
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.resumed':
        const updatedSub = event.data.object as any;
        const status = (updatedSub.status === 'active' || updatedSub.status === 'trialing') ? 'active' : 'canceled';
        await this.prisma.tenant.updateMany({
          where: { stripeSubscriptionId: updatedSub.id },
          data: { subscriptionStatus: status },
        });
        this.logger.log(`🔄 Assinatura atualizada: ${updatedSub.id} -> ${status}`);
        break;

      default:
        this.logger.warn(`🔔 Evento não tratado: ${event.type}`);
    }
  }

  async getSubscriptionRenewalDate(subscriptionId: string): Promise<Date | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return new Date(subscription.current_period_end * 1000);
    } catch (error: any) {
      this.logger.error(`Failed to fetch subscription ${subscriptionId}: ${error.message}`);
      return null;
    }
  }

  async syncAndGetStatus(tenantId: string): Promise<{
    status: string;
    trialRemainingDays: number;
    renewalDate: Date | null;
    hasStripeCustomer: boolean;
  }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant não encontrado');

    let subscriptionStatus = tenant.subscriptionStatus ?? 'inactive';
    let renewalDate: Date | null = null;

    // DB já está ativo com ID de assinatura: só busca a data de renovação
    if (subscriptionStatus === 'active' && tenant.stripeSubscriptionId) {
      renewalDate = await this.getSubscriptionRenewalDate(tenant.stripeSubscriptionId);
      return { status: 'active', trialRemainingDays: 0, renewalDate, hasStripeCustomer: true };
    }

    // Status não-ativo no banco: consulta a Stripe para garantir consistência
    if (tenant.stripeSubscriptionId) {
      try {
        const sub = await this.stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
        const stripeStatus: string = sub.status;
        // Mapeia status da Stripe para nossos valores
        const mapped =
          stripeStatus === 'active' ? 'active'
          : stripeStatus === 'trialing' ? 'trialing'
          : stripeStatus === 'canceled' ? 'canceled'
          : 'inactive';

        if (mapped !== subscriptionStatus) {
          await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { subscriptionStatus: mapped },
          });
          this.logger.log(`🔄 Status sincronizado via API: ${subscriptionStatus} → ${mapped} (tenant ${tenantId})`);
          subscriptionStatus = mapped;
        }

        if (stripeStatus === 'active') {
          renewalDate = new Date(sub.current_period_end * 1000);
        }
      } catch (err: any) {
        this.logger.error(`Falha ao consultar assinatura ${tenant.stripeSubscriptionId}: ${err.message}`);
      }
    } else if (tenant.stripeCustomerId) {
      // Sem subscription ID mas com customer ID: procura assinaturas ativas/trialing na Stripe
      try {
        const subs = await this.stripe.subscriptions.list({
          customer: tenant.stripeCustomerId,
          limit: 5,
        });

        const activeSub = subs.data.find((s: any) => s.status === 'active' || s.status === 'trialing');
        if (activeSub) {
          const mapped = activeSub.status === 'active' ? 'active' : 'trialing';
          await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { subscriptionStatus: mapped, stripeSubscriptionId: activeSub.id },
          });
          this.logger.log(`🔄 Assinatura encontrada na Stripe e sincronizada: ${activeSub.id} (${mapped})`);
          subscriptionStatus = mapped;
          if (mapped === 'active') {
            renewalDate = new Date(activeSub.current_period_end * 1000);
          }
        }
      } catch (err: any) {
        this.logger.error(`Falha ao listar assinaturas do customer ${tenant.stripeCustomerId}: ${err.message}`);
      }
    }

    let trialRemainingDays = 0;
    if (tenant.createdAt && subscriptionStatus === 'trialing') {
      const trialEnd = new Date(tenant.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      trialRemainingDays = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (trialRemainingDays < 0) trialRemainingDays = 0;
    }

    return {
      status: subscriptionStatus,
      trialRemainingDays,
      renewalDate,
      hasStripeCustomer: !!tenant.stripeCustomerId,
    };
  }
}
