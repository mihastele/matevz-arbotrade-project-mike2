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
   * Send SMS message(s)
   * 
   * @param messages - Array of SMS messages
   * @returns Send message response with status per message
   * 
   * @example
   * await reportService.sendSmsMessages([{
   *   eshop_sync_id: '1600374782',
   *   to_number: '041 111 222',
   *   message: 'Your order has been shipped.',
   *   sender_message_id: 'sms1',
   * }]);
   */
  async sendSmsMessages(messages: {
    eshop_sync_id: string;
    to_number: string;
    message: string;
    sender_message_id?: string;
    abandoned_cart_id?: string;
  }[]): Promise<SendMessageResponse> {
    const messageList = messages.map(msg => ({
      type: 'sms' as const,
      ...msg,
    }));
    return this.metakockaService.post<SendMessageResponse>('send_message', {
      message_list: messageList,
    });
  }

  /**
   * Send an email or SMS message (simplified method)
   * 
   * @param options - Message options
   * @returns Send message response
   * 
   * @deprecated Use sendSmsMessages for SMS. For emails, use sendDocumentEmail.
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
   * @returns Sticker response with tracking codes and URLs
   * 
   * @example
   * const sticker = await reportService.generateSticker({
   *   order_id_list: [1600370797, 1600370778],
   * });
   * // Or use customer order codes:
   * const sticker2 = await reportService.generateSticker({
   *   customer_order_list: ['PP-27578', 'PP-27579'],
   * });
   */
  async generateSticker(options: {
    order_id_list?: number[];
    customer_order_list?: string[];
  }): Promise<GenerateStickerResponse> {
    return this.metakockaService.post<GenerateStickerResponse>('generate_sticker', options);
  }

  /**
   * Mark orders as shipped
   * 
   * @param options - Shipping options
   * @returns Response
   * 
   * @example
   * await reportService.markOrdersAsShipped({
   *   sales_order_id_list: ['400000001642', '400000001643'],
   * });
   * // Or by customer order codes:
   * await reportService.markOrdersAsShipped({
   *   customer_order_list: ['CustomerOrder1', 'CustomerOrder2'],
   * });
   */
  async markOrdersAsShipped(options: {
    sales_order_id_list?: string[];
    customer_order_list?: string[];
  }): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>('mark_orders_as_shipped', options);
  }

  // ============================================
  // Complaint Management
  // ============================================

  /**
   * Create a complaint (reclamation, return, or replacement)
   * 
   * @param options - Complaint options
   * @returns Complaint response with mk_id
   */
  async createComplaint(options: {
    api_user_email: string;
    claim_type: 'reclamation' | 'return' | 'replacement';
    sales_order_customer_order?: string;
    sales_order_tracking_code?: string;
    sales_order_count_code?: string;
    datetime?: string;
    partner?: {
      iban?: string;
      swift?: string;
      bank_name?: string;
      bank_street?: string;
      bank_place?: string;
      bank_country_code?: string;
      partner_id?: string;
      partner_address_id?: string;
      post_number?: string;
      place?: string;
    };
    complaint_products: {
      code?: string;
      count_code?: string;
      mk_id?: string;
      amount: string;
      price_with_tax?: string;
      tax?: string;
      discount?: string;
      complaint_reason?: string;
      complaint_description?: string;
    }[];
    replacement_products?: {
      code?: string;
      count_code?: string;
      mk_id?: string;
      amount: string;
      price_with_tax: string;
      tax?: string;
      discount?: string;
    }[];
    claim_status?: string;
    claim_reason?: string;
    claim_description?: string;
    return_tracking_code?: string;
    attachment_list?: { file_name: string; source_url?: string; data_b64?: string }[];
  }): Promise<ComplaintResponse> {
    return this.metakockaService.post<ComplaintResponse>('create_complaint', options);
  }

  /**
   * Update a complaint
   * 
   * @param claimId - Complaint claim_id (mk_id)
   * @param claimType - Type of complaint: reclamation, return, or replacement
   * @param options - Update options
   * @returns Response
   * 
   * @example
   * await reportService.updateComplaint('1600608202', 'reclamation', {
   *   claim_status: 'completed',
   *   claim_note: 'Issue resolved',
   * });
   */
  async updateComplaint(
    claimId: string,
    claimType: 'reclamation' | 'return' | 'replacement',
    options: {
      claim_status: string;
      claim_note?: string;
    },
  ): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>('update_complaint', {
      claim_id: claimId,
      claim_type: claimType,
      ...options,
    });
  }

  /**
   * Get a complaint by ID
   * 
   * @param docId - Complaint doc_id (mk_id)
   * @param docCountCode - Alternative: complaint count code
   * @returns Complaint details
   */
  async getComplaint(options: {
    doc_id?: string;
    doc_count_code?: string;
  }): Promise<MetakockaResponse & { complaint: any }> {
    return this.metakockaService.post('get_document', { 
      doc_type: 'complaint',
      ...options,
    });
  }

  // ============================================
  // Bank and Cash Register
  // ============================================

  /**
   * Get bank statements
   * 
   * @param options - Query options
   * @returns Bank statement response with result array
   */
  async getBankStatements(options: {
    doc_date?: string;
    doc_date_from?: string;
    doc_date_to?: string;
    doc_id?: string;
    offset?: number;
    limit?: number;
  } = {}): Promise<MetakockaResponse & { result: any[]; result_count: string; offset: string; limit: string }> {
    return this.metakockaService.post('get_bank_statement', options);
  }

  /**
   * Get bank statement status - last statement state for all bank accounts
   * 
   * @returns Bank statement status showing last statement date and finished state
   */
  async getBankStatementStatus(): Promise<MetakockaResponse & { statement_list: any[] }> {
    return this.metakockaService.post('get_bank_statement_status', {});
  }

  /**
   * Get bank compensations
   * 
   * @param options - Query options
   * @returns Bank compensation response with result array
   */
  async getBankCompensations(options: {
    doc_date?: string;
    doc_date_from?: string;
    doc_date_to?: string;
    doc_id?: string;
    offset?: number;
    limit?: number;
  } = {}): Promise<MetakockaResponse & { result: any[]; result_count: string }> {
    return this.metakockaService.post('get_bank_compensation', options);
  }

  /**
   * Get cash register journal
   * 
   * @param options - Query options
   * @returns Cash register journal response
   */
  async getCashRegisterJournal(options: {
    doc_date?: string;
    doc_date_from?: string;
    doc_date_to?: string;
    doc_id?: string;
    cash_register?: string;
    offset?: number;
    limit?: number;
  } = {}): Promise<MetakockaResponse & { 
    cash_register_journal_list: any[]; 
    cash_register_journal_count: string;
    doc_id?: string;
    limit: string;
    offset: string;
  }> {
    return this.metakockaService.post('cash_register_journal', options);
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
