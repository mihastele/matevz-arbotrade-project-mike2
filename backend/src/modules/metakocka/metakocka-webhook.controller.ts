import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { MetakockaWarehouseService } from './services/metakocka-warehouse.service';
import { MetakockaProductService } from './services/metakocka-product.service';

/**
 * Webhook payload interfaces based on MetaKocka documentation
 */
export interface WebhookStockUpdatePayload {
  event: 'warehouse_product_stock_update';
  data: {
    product_mk_id: string;
    product_code: string;
    warehouse_mk_id: string;
    warehouse_name: string;
    quantity_before: string;
    quantity_after: string;
    quantity_change: string;
    timestamp: string;
  };
}

export interface WebhookDocumentPayload {
  event: 'document_created' | 'document_updated' | 'document_status_changed';
  data: {
    doc_type: string;
    mk_id: string;
    count_code: string;
    status?: string;
    previous_status?: string;
    timestamp: string;
  };
}

export interface WebhookPartnerPayload {
  event: 'partner_created' | 'partner_updated';
  data: {
    partner_mk_id: string;
    partner_name: string;
    partner_type: string;
    timestamp: string;
  };
}

export type WebhookPayload = WebhookStockUpdatePayload | WebhookDocumentPayload | WebhookPartnerPayload;

/**
 * MetaKocka Webhook Controller
 * 
 * Handles incoming webhooks from MetaKocka for real-time updates.
 * 
 * Webhook Configuration:
 * - Set up webhooks in MetaKocka: Settings → Webhooks
 * - Events: warehouse_product_stock_update, document_created, document_updated, etc.
 * - The webhook URL should be: https://your-domain.com/api/metakocka/webhook
 * 
 * Security:
 * - Webhooks are verified using HMAC-SHA256 signature
 * - The signature is sent in the X-MetaKocka-Signature header
 * - Signature = HMAC-SHA256(request_body, secret_key)
 */
@ApiTags('MetaKocka Webhooks')
@Controller('metakocka/webhook')
export class MetakockaWebhookController {
  private readonly logger = new Logger(MetakockaWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly warehouseService: MetakockaWarehouseService,
    private readonly productService: MetakockaProductService,
  ) {}

  /**
   * Main webhook endpoint
   * 
   * Receives all webhook events from MetaKocka and routes them to appropriate handlers
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive MetaKocka webhooks' })
  @ApiHeader({ 
    name: 'X-MetaKocka-Signature', 
    description: 'HMAC-SHA256 signature of the request body', 
    required: true 
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature or payload' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-metakocka-signature') signature: string,
    @Body() payload: WebhookPayload,
  ) {
    // Verify webhook signature
    const isValid = this.verifySignature(req.rawBody, signature);
    if (!isValid) {
      this.logger.warn('Invalid webhook signature received');
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Received webhook event: ${payload.event}`);

    try {
      switch (payload.event) {
        case 'warehouse_product_stock_update':
          await this.handleStockUpdate(payload as WebhookStockUpdatePayload);
          break;
        case 'document_created':
        case 'document_updated':
        case 'document_status_changed':
          await this.handleDocumentEvent(payload as WebhookDocumentPayload);
          break;
        case 'partner_created':
        case 'partner_updated':
          await this.handlePartnerEvent(payload as WebhookPartnerPayload);
          break;
        default:
          this.logger.warn(`Unknown webhook event: ${(payload as any).event}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      // Don't throw - acknowledge receipt to MetaKocka
    }

    return { received: true, event: payload.event };
  }

  /**
   * Stock update webhook endpoint (dedicated)
   * 
   * Handles warehouse_product_stock_update events for real-time stock sync
   */
  @Post('stock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive stock update webhooks' })
  @ApiHeader({ 
    name: 'X-MetaKocka-Signature', 
    description: 'HMAC-SHA256 signature', 
    required: true 
  })
  @ApiResponse({ status: 200, description: 'Stock webhook processed' })
  async handleStockWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-metakocka-signature') signature: string,
    @Body() payload: WebhookStockUpdatePayload,
  ) {
    const isValid = this.verifySignature(req.rawBody, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    await this.handleStockUpdate(payload);
    return { received: true, product_code: payload.data.product_code };
  }

  /**
   * Document webhook endpoint (dedicated)
   */
  @Post('documents')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive document webhooks' })
  @ApiHeader({ 
    name: 'X-MetaKocka-Signature', 
    description: 'HMAC-SHA256 signature', 
    required: true 
  })
  @ApiResponse({ status: 200, description: 'Document webhook processed' })
  async handleDocumentWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-metakocka-signature') signature: string,
    @Body() payload: WebhookDocumentPayload,
  ) {
    const isValid = this.verifySignature(req.rawBody, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    await this.handleDocumentEvent(payload);
    return { received: true, doc_type: payload.data.doc_type, mk_id: payload.data.mk_id };
  }

  /**
   * Verify HMAC-SHA1 signature as per MetaKocka documentation
   * MetaKocka signs with HmacSHA1 and then Base64 encodes the result
   */
  private verifySignature(rawBody: Buffer | undefined, receivedSignature: string): boolean {
    if (!rawBody || !receivedSignature) {
      return false;
    }

    const clientSecret = this.configService.get<string>('METAKOCKA_WEBHOOK_SECRET');
    if (!clientSecret) {
      this.logger.error('METAKOCKA_WEBHOOK_SECRET not configured');
      return false;
    }

    // MetaKocka uses HmacSHA1 with Base64 encoding as per documentation
    const expectedSignature = crypto
      .createHmac('sha1', clientSecret)
      .update(rawBody)
      .digest('base64');

    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(receivedSignature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }

  /**
   * Handle stock update events
   */
  private async handleStockUpdate(payload: WebhookStockUpdatePayload): Promise<void> {
    const { data } = payload;
    
    this.logger.log(
      `Stock update for product ${data.product_code}: ` +
      `${data.quantity_before} → ${data.quantity_after} (${data.quantity_change}) ` +
      `in warehouse ${data.warehouse_name}`,
    );

    // TODO: Implement your business logic here
    // Examples:
    // - Update local product stock cache
    // - Notify frontend via WebSocket
    // - Check low stock thresholds
    // - Sync with external systems

    // Example: Emit event for other services to handle
    // this.eventEmitter.emit('metakocka.stock.updated', {
    //   productCode: data.product_code,
    //   productMkId: data.product_mk_id,
    //   warehouseId: data.warehouse_mk_id,
    //   warehouseName: data.warehouse_name,
    //   oldQuantity: parseFloat(data.quantity_before),
    //   newQuantity: parseFloat(data.quantity_after),
    //   change: parseFloat(data.quantity_change),
    //   timestamp: new Date(data.timestamp),
    // });
  }

  /**
   * Handle document events (created, updated, status changed)
   */
  private async handleDocumentEvent(payload: WebhookDocumentPayload): Promise<void> {
    const { event, data } = payload;

    this.logger.log(
      `Document ${event}: ${data.doc_type} ${data.count_code} (${data.mk_id})` +
      (data.status ? ` - Status: ${data.status}` : ''),
    );

    // TODO: Implement your business logic here
    // Examples:
    // - Update order status in local database
    // - Send notifications to customers
    // - Trigger fulfillment processes
    // - Sync with e-commerce platform

    switch (event) {
      case 'document_created':
        // Handle new document created in MetaKocka
        break;
      case 'document_updated':
        // Handle document updated
        break;
      case 'document_status_changed':
        // Handle status change (e.g., order shipped, invoice paid)
        if (data.doc_type === 'sales_order' && data.status === 'shipped') {
          // Notify customer, update tracking, etc.
        }
        break;
    }
  }

  /**
   * Handle partner events (created, updated)
   */
  private async handlePartnerEvent(payload: WebhookPartnerPayload): Promise<void> {
    const { event, data } = payload;

    this.logger.log(
      `Partner ${event}: ${data.partner_name} (${data.partner_mk_id})`,
    );

    // TODO: Implement your business logic here
    // Examples:
    // - Sync partner data with CRM
    // - Update customer records
    // - Trigger welcome emails for new customers
  }
}

/**
 * Webhook Event Types for reference
 * 
 * Stock Events:
 * - warehouse_product_stock_update: Fired when product stock changes
 * 
 * Document Events:
 * - document_created: New document created
 * - document_updated: Document data changed
 * - document_status_changed: Document status changed
 * 
 * Partner Events:
 * - partner_created: New partner/customer created
 * - partner_updated: Partner data changed
 * 
 * Note: Not all event types may be available - check MetaKocka documentation
 * for currently supported webhook events.
 */
