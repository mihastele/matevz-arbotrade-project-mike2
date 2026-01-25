import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';
import { CartService } from '../cart/cart.service';
import { CreateCheckoutIntentDto } from './dto/create-checkout-intent.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private ordersService: OrdersService,
    private cartService: CartService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
      });
    }
  }

  /**
   * Create a payment intent from the current cart.
   * This is called before order creation - order is created after payment succeeds.
   */
  async createCheckoutIntent(
    dto: CreateCheckoutIntentDto,
    userId?: string,
    guestToken?: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string; amount: number }> {
    if (!this.stripe) {
      throw new BadRequestException('Payment service not configured');
    }

    const cart = await this.cartService.getCart(userId, guestToken);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Calculate totals (same logic as order creation)
    // IMPORTANT: subtotal from TypeORM is a string (decimal column), so we must convert to number
    // otherwise + operator causes string concatenation (e.g. "100" + 22 = "10022")
    const subtotal = Number(cart.subtotal);
    const tax = subtotal * 0.22; // 22% VAT (Slovenia)
    const shippingCost = 0; // Free shipping for now
    const total = subtotal + tax + shippingCost;
    const amountInCents = Math.round(total * 100);

    // Store checkout data in metadata for order creation after payment
    const checkoutData = {
      userId: userId || '',
      guestToken: guestToken || '',
      guestEmail: dto.guestEmail || '',
      shippingAddress: JSON.stringify(dto.shippingAddress),
      billingAddress: JSON.stringify(dto.billingAddress || dto.shippingAddress),
      notes: dto.notes || '',
      shippingMethod: dto.shippingMethod || '',
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
    };

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: checkoutData,
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      amount: total,
    };
  }

  /**
   * Legacy method - create payment intent for existing order.
   * Kept for backwards compatibility.
   */
  async createPaymentIntent(orderId: string): Promise<{ clientSecret: string }> {
    if (!this.stripe) {
      throw new BadRequestException('Payment service not configured');
    }

    const order = await this.ordersService.findOne(orderId);

    if (order.paymentIntentId) {
      // Return existing payment intent
      const existingIntent = await this.stripe.paymentIntents.retrieve(order.paymentIntentId);
      return { clientSecret: existingIntent.client_secret! };
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'eur',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    // Save payment intent ID to order
    await this.ordersService.updatePaymentIntent(orderId, paymentIntent.id);

    return { clientSecret: paymentIntent.client_secret! };
  }

  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    if (!this.stripe) {
      throw new BadRequestException('Payment service not configured');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentSuccess(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentFailure(failedIntent);
        break;
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const metadata = paymentIntent.metadata;

    // Check if this is a legacy order-based payment
    if (metadata.orderId) {
      await this.ordersService.markAsPaid(metadata.orderId);
      return;
    }

    // New checkout flow - create order from cart
    if (metadata.shippingAddress) {
      try {
        const userId = metadata.userId || undefined;
        const guestToken = metadata.guestToken || undefined;

        const createOrderDto = {
          guestEmail: metadata.guestEmail || undefined,
          shippingAddress: JSON.parse(metadata.shippingAddress),
          billingAddress: JSON.parse(metadata.billingAddress),
          notes: metadata.notes || undefined,
          shippingMethod: metadata.shippingMethod || undefined,
        };

        // Create the order (this also clears the cart)
        const order = await this.ordersService.create(createOrderDto, userId, guestToken);

        // Mark as paid immediately since payment already succeeded
        await this.ordersService.markAsPaid(order.id);
        await this.ordersService.updatePaymentIntent(order.id, paymentIntent.id);

        console.log(`Order ${order.orderNumber} created and marked as paid`);
      } catch (error) {
        console.error('Failed to create order from payment:', error);
        // In production, you'd want to handle this more gracefully
        // Maybe store failed orders for manual review
      }
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const metadata = paymentIntent.metadata;

    // Clear the cart even on failure so user can try again with fresh cart
    if (metadata.userId || metadata.guestToken) {
      try {
        await this.cartService.clearCart(
          metadata.userId || undefined,
          metadata.guestToken || undefined,
        );
        console.log('Cart cleared after payment failure');
      } catch (error) {
        console.error('Failed to clear cart after payment failure:', error);
      }
    }

    console.log('Payment failed:', paymentIntent.id);
  }
}
