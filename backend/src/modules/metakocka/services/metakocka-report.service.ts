import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { MetakockaService } from '../metakocka.service';
import {
  DocumentType,
  ReportRequest,
  ReportResponse,
  ReportAsyncResponse,
  MetakockaResponse,
  SendMessageRequest,
  SendMessageResponse,
  GenerateStickerRequest,
  GenerateStickerResponse,
  ComplaintResponse,
} from '../interfaces';

/**
 * MetaKocka Report Service
 * 
 * Handles reporting, messaging, and other utility API operations:
 * - Report generation (PDF/HTML)
 * - Async report printing
 * - Email/SMS messaging
 * - Sticker/label generation
 * - Complaint management
 * - Bank statements and cash register journals
 * 
 * API Documentation: /docs/report_concept.md, /docs/report_async.md, etc.
 */
@Injectable()
export class MetakockaReportService {
  private readonly logger = new Logger(MetakockaReportService.name);

  constructor(private readonly metakockaService: MetakockaService) {}

  // ============================================
  // Report Generation
  // ============================================

  /**
   * Generate a document report (PDF/HTML)
   * 
   * @param options - Report options
   * @returns Report response with content or URL
   * 
   * @example
   * const report = await reportService.generateReport({
   *   doc_type: 'sales_bill_domestic',
   *   mk_id: '1600203257',
   *   report_format: 'PDF',
   *   return_file: 'true',
   * });
   */
  async generateReport(options: {
    doc_type: DocumentType;
    mk_id?: string;
    count_code?: string;
    report_code?: string;
    report_format?: 'PDF' | 'HTML';
    return_file?: boolean;
  }): Promise<ReportResponse> {
    const payload: Record<string, any> = {
      doc_type: options.doc_type,
    };

    if (options.mk_id) payload.mk_id = options.mk_id;
    if (options.count_code) payload.count_code = options.count_code;
    if (options.report_code) payload.report_code = options.report_code;
    if (options.report_format) payload.report_format = options.report_format;
    if (options.return_file !== undefined) payload.return_file = options.return_file.toString();

    return this.metakockaService.post<ReportResponse>('report', payload);
  }

  /**
   * Generate a report asynchronously
   * 
   * @param options - Report options
   * @returns Async response with async_id
   */
  async generateReportAsync(options: {
    doc_type: DocumentType;
    mk_id?: string;
    count_code?: string;
    report_code?: string;
    report_format?: 'PDF' | 'HTML';
  }): Promise<ReportAsyncResponse> {
    const payload: Record<string, any> = {
      doc_type: options.doc_type,
      async_call: 'true',
    };

    if (options.mk_id) payload.mk_id = options.mk_id;
    if (options.count_code) payload.count_code = options.count_code;
    if (options.report_code) payload.report_code = options.report_code;
    if (options.report_format) payload.report_format = options.report_format;

    return this.metakockaService.post<ReportAsyncResponse>('report', payload);
  }

  /**
   * Check async report status and get result
   * 
   * @param asyncId - Async report ID
   * @returns Async response with status
   */
  async getAsyncReportStatus(asyncId: string): Promise<ReportAsyncResponse & { report_content_base64?: string }> {
    return this.metakockaService.post<ReportAsyncResponse & { report_content_base64?: string }>('report_async_status', {
      async_id: asyncId,
    });
  }

  /**
   * Wait for async report to complete
   * 
   * @param asyncId - Async report ID
   * @param maxWaitMs - Maximum wait time in milliseconds (default: 60000)
   * @param pollIntervalMs - Poll interval in milliseconds (default: 2000)
   * @returns Report content base64
   */
  async waitForAsyncReport(
    asyncId: string,
    maxWaitMs = 60000,
    pollIntervalMs = 2000,
  ): Promise<string> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.getAsyncReportStatus(asyncId);

      if (status.async_status === 'finished' && status.report_content_base64) {
        return status.report_content_base64;
      }

      if (status.async_status === 'error') {
        throw new BadRequestException('Async report generation failed');
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new BadRequestException('Async report generation timed out');
  }

  // ============================================
  // Messaging
  // ============================================

  /**
   * Send an email or SMS message
   * 
   * @param options - Message options
   * @returns Send message response
   * 
   * @example
   * // Send email
   * await reportService.sendMessage({
   *   message_type: 'email',
   *   recipient: 'customer@example.com',
   *   subject: 'Your Order',
   *   message: 'Your order has been shipped.',
   * });
   * 
   * // Send SMS
   * await reportService.sendMessage({
   *   message_type: 'sms',
   *   recipient: '+38640123456',
   *   message: 'Your order has been shipped.',
   * });
   */
  async sendMessage(options: {
    message_type: 'email' | 'sms';
    recipient: string;
    subject?: string;
    message: string;
    doc_type?: DocumentType;
    mk_id?: string;
  }): Promise<SendMessageResponse> {
    return this.metakockaService.post<SendMessageResponse>('send_message', options);
  }

  /**
   * Send document via email
   * 
   * @param docType - Document type
   * @param mkId - Document mk_id
   * @param recipient - Email recipient
   * @param subject - Email subject
   * @param message - Email body
   */
  async sendDocumentEmail(
    docType: DocumentType,
    mkId: string,
    recipient: string,
    subject: string,
    message: string,
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      message_type: 'email',
      recipient,
      subject,
      message,
      doc_type: docType,
      mk_id: mkId,
    });
  }

  // ============================================
  // Sticker/Label Generation
  // ============================================

  /**
   * Generate shipping sticker/label
   * 
   * @param options - Sticker options
   * @returns Sticker response with tracking code
   * 
   * @example
   * const sticker = await reportService.generateSticker({
   *   sales_order_mk_id: '1600203487',
   *   delivery_service: 'DHL',
   * });
   */
  async generateSticker(options: {
    sales_order_mk_id?: string;
    sales_order_count_code?: string;
    customer_order_list?: string[];
    delivery_service?: string;
  }): Promise<GenerateStickerResponse> {
    return this.metakockaService.post<GenerateStickerResponse>('generate_sticker', options);
  }

  /**
   * Mark orders as shipped
   * 
   * @param options - Shipping options
   * @returns Response
   */
  async markOrdersAsShipped(options: {
    sales_order_mk_id_list?: string[];
    customer_order_list?: string[];
    tracking_code?: string;
    shipped_date?: string;
  }): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>('mark_orders_as_shipped', options);
  }

  // ============================================
  // Complaint Management
  // ============================================

  /**
   * Create a complaint
   * 
   * @param options - Complaint options
   * @returns Complaint response
   */
  async createComplaint(options: {
    sales_order_mk_id?: string;
    sales_order_count_code?: string;
    partner: {
      business_entity: string;
      taxpayer?: string;
      foreign_county?: string;
      customer: string;
      street: string;
      post_number: string;
      place: string;
      country: string;
      iban?: string;
      bank_name?: string;
      partner_contact?: {
        name?: string;
        email?: string;
        gsm?: string;
        phone?: string;
      };
    };
    product_list: {
      product_mk_id: string;
      product_code?: string;
      amount: string;
      price?: string;
      reason?: string;
      description?: string;
    }[];
    claim_status?: string;
    claim_reason?: string;
    claim_description?: string;
    return_tracking_code?: string;
  }): Promise<ComplaintResponse> {
    return this.metakockaService.post<ComplaintResponse>('create_complaint', options);
  }

  /**
   * Update a complaint
   * 
   * @param mkId - Complaint mk_id
   * @param options - Update options
   * @returns Response
   */
  async updateComplaint(
    mkId: string,
    options: {
      claim_status?: string;
      claim_reason?: string;
      claim_description?: string;
    },
  ): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>('update_complaint', {
      mk_id: mkId,
      ...options,
    });
  }

  /**
   * Get a complaint by ID
   * 
   * @param mkId - Complaint mk_id
   * @returns Complaint details
   */
  async getComplaint(mkId: string): Promise<MetakockaResponse & { complaint: any }> {
    return this.metakockaService.post('get_complaint', { mk_id: mkId });
  }

  // ============================================
  // Bank and Cash Register
  // ============================================

  /**
   * Get bank statements
   * 
   * @param options - Query options
   * @returns Bank statement response
   */
  async getBankStatements(options: {
    date_from?: string;
    date_to?: string;
    bank_account_id?: string;
  } = {}): Promise<MetakockaResponse & { bank_statement_list: any[] }> {
    return this.metakockaService.post('get_bank_statement', options);
  }

  /**
   * Get bank statement status
   * 
   * @returns Bank statement status for all bank accounts
   */
  async getBankStatementStatus(): Promise<MetakockaResponse & { bank_account_list: any[] }> {
    return this.metakockaService.post('get_bank_statement_status', {});
  }

  /**
   * Get bank compensations
   * 
   * @param options - Query options
   * @returns Bank compensation response
   */
  async getBankCompensations(options: {
    date_from?: string;
    date_to?: string;
  } = {}): Promise<MetakockaResponse & { compensation_list: any[] }> {
    return this.metakockaService.post('get_bank_compensation', options);
  }

  /**
   * Search cash register journal
   * 
   * @param options - Query options
   * @returns Cash register journal response
   */
  async getCashRegisterJournal(options: {
    cash_register_id?: string;
    date_from?: string;
    date_to?: string;
    offset?: number;
    limit?: number;
  } = {}): Promise<MetakockaResponse & { journal_list: any[] }> {
    const payload: Record<string, any> = {};

    if (options.cash_register_id) payload.cash_register_id = options.cash_register_id;
    if (options.date_from) payload.date_from = options.date_from;
    if (options.date_to) payload.date_to = options.date_to;
    if (options.offset !== undefined) payload.offset = options.offset.toString();
    if (options.limit !== undefined) payload.limit = options.limit.toString();

    return this.metakockaService.post('cash_register_journal', payload);
  }

  // ============================================
  // Delivery Service
  // ============================================

  /**
   * Get delivery service price lists
   * 
   * @param options - Query options
   * @returns Delivery service price list response
   */
  async getDeliveryServicePriceLists(options: {
    delivery_service?: string;
    country?: string;
  } = {}): Promise<MetakockaResponse & { pricelist: any[] }> {
    return this.metakockaService.post('get_delivery_service_pricelist', options);
  }

  // ============================================
  // Web Shop Terms
  // ============================================

  /**
   * Add terms of use file to web shop
   * 
   * @param options - Terms of use options
   * @returns Response
   */
  async addWebShopTermsOfUse(options: {
    webshop_id: string;
    file_name: string;
    file_content_base64: string;
    valid_from?: string;
  }): Promise<MetakockaResponse> {
    return this.metakockaService.post('add_webshop_terms_of_use', options);
  }

  // ============================================
  // File Operations
  // ============================================

  /**
   * Add a file to MetaKocka
   * 
   * @param options - File options
   * @returns Response with file ID
   */
  async addFile(options: {
    file_name: string;
    file_content_base64: string;
    file_type?: string;
  }): Promise<MetakockaResponse & { file_id: string }> {
    return this.metakockaService.post('add_file', options);
  }
}
