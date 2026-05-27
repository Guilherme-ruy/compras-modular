import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Req() req: any) {
    return this.stripeService.syncAndGetStatus(req.user.tenantId);
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
