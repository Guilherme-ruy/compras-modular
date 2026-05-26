import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Headers,
  RawBodyRequest,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    
    let trialRemainingDays = 0;
    if (tenant?.createdAt && tenant?.subscriptionStatus === 'trialing') {
      const trialEnd = new Date(tenant.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      trialRemainingDays = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (trialRemainingDays < 0) trialRemainingDays = 0;
    }

    let renewalDate: Date | null = null;
    if (tenant?.subscriptionStatus === 'active' && tenant?.stripeSubscriptionId) {
      renewalDate = await this.stripeService.getSubscriptionRenewalDate(tenant.stripeSubscriptionId);
    }

    return {
      status: tenant?.subscriptionStatus || 'inactive',
      hasStripeCustomer: !!tenant?.stripeCustomerId,
      trialRemainingDays,
      renewalDate
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'ADMIN', 'Administrador')
  @Post('checkout')
  async createCheckoutSession(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const email = req.user.email;
    return this.stripeService.createCheckoutSession(tenantId, email);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'ADMIN', 'Administrador')
  @Post('portal')
  async createPortalSession(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.stripeService.createPortalSession(tenantId);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
    @Res() res: any
  ) {
    if (!signature) {
      return res.status(400).send('Missing stripe-signature header');
    }

    if (!req.rawBody) {
      return res.status(400).send('Missing raw body');
    }

    try {
      await this.stripeService.handleWebhook(signature, req.rawBody);
      return res.send({ received: true });
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
}
