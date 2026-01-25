import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CreateCheckoutIntentDto } from './dto/create-checkout-intent.dto';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('create-checkout-intent')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent from cart for checkout' })
  createCheckoutIntent(
    @Body() dto: CreateCheckoutIntentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    const guestToken = req.headers['x-guest-token'] as string | undefined;

    try {
      const logMsg = `[PaymentsController] createCheckoutIntent - UserID: ${userId}, GuestToken: ${guestToken}, ReqUser: ${JSON.stringify(req.user)}\n`;
      fs.appendFileSync(path.join(process.cwd(), 'debug.txt'), logMsg);
    } catch (e) { console.error(e); }

    return this.paymentsService.createCheckoutIntent(dto, userId, guestToken);
  }

  @Post('create-payment-intent/:orderId')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for an existing order (legacy)' })
  createPaymentIntent(@Param('orderId') orderId: string) {
    return this.paymentsService.createPaymentIntent(orderId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(signature, req.rawBody!);
  }
}

