import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { MetakockaService } from '../metakocka.service';
import {
  DocumentType,
  DocumentResponse,
  GetDocumentResponse,
  SalesOrderDocument,
  SalesBillDocument,
  DocumentBase,
  DocumentProduct,
  Partner,
  MarkPaid,
  MetakockaResponse,
  ChangeDocumentStatusRequest,
  ChangeDocumentStatusResponse,
  AddAttachmentRequest,
  AddAttachmentResponse,
} from '../interfaces';

/**
 * MetaKocka Document Service
 * 
 * Handles all document-related API operations:
 * - put_document: Create documents (orders, bills, warehouse docs)
 * - get_document: Retrieve document details
 * - update_document: Update existing documents
 * - delete_document: Delete documents
 * - change_document_status: Change document status
 * 
 * Supported document types:
 * - Sales: sales_order, sales_offer, sales_bill_domestic/foreign/retail/prepaid/credit_note
 * - Purchase: purchase_order, purchase_bill_domestic/foreign/prepaid/credit_note
 * - Warehouse: warehouse_delivery_note, warehouse_packing_list, warehouse_receiving_note, warehouse_acceptance_note
 * - Other: workorder, transfer_order
 * 
 * API Documentation: /docs/documents_concept.md
 */
@Injectable()
export class MetakockaDocumentService {
  private readonly logger = new Logger(MetakockaDocumentService.name);

  constructor(private readonly metakockaService: MetakockaService) {}

  // ============================================
  // Sales Order Operations
  // ============================================

  /**
   * Create a new sales order
   * 
   * @param order - Sales order data
   * @returns Document response with mk_id and count_code
   * 
   * @example
   * const result = await documentService.createSalesOrder({
   *   doc_date: '2024-01-15+02:00',
   *   partner: {
   *     business_entity: 'true',
   *     taxpayer: 'true',
   *     foreign_county: 'false',
   *     tax_id_number: 'SI12345678',
   *     customer: 'Customer Name',
   *     street: 'Street 1',
   *     post_number: '1000',
   *     place: 'Ljubljana',
   *     country: 'Slovenia',
   *   },
   *   product_list: [
   *     { code: 'PROD1', amount: '2', price: '100', tax: 'EX4' }
   *   ],
   * });
   */
  async createSalesOrder(
    order: Omit<SalesOrderDocument, 'doc_type'>,
  ): Promise<DocumentResponse> {
    const payload = {
      ...order,
      doc_type: 'sales_order' as const,
    };

    return this.metakockaService.post<DocumentResponse>('put_document', payload);
  }

  /**
   * Get a sales order by ID
   * 
   * @param options - Query options
   * @returns Sales order document
   */
  async getSalesOrder(options: {
    doc_id?: string;
    count_code?: string;
    buyer_order?: string;
    customer_order?: string;
    show_product_detail?: boolean;
    show_tax_factor?: boolean;
    show_attachments?: boolean;
    show_delivery_service_events?: boolean;
    show_delivery_stats?: boolean;
    show_sum_credit?: boolean;
    show_split_orders?: boolean;
    show_sticker_list?: boolean;
    show_product_metadata?: boolean;
    show_tracking_url?: boolean;
    show_associated_tracking_numbers?: boolean;
    show_purchase_prices?: boolean;
    show_document_info?: boolean;
    status_desc?: boolean;
  }): Promise<GetDocumentResponse> {
    const payload: Record<string, any> = {
      doc_type: 'sales_order',
    };

    if (options.doc_id) payload.doc_id = options.doc_id;
    if (options.count_code) payload.count_code = options.count_code;
    if (options.buyer_order) payload.buyer_order = options.buyer_order;
    if (options.customer_order) payload.customer_order = options.customer_order;
    if (options.show_product_detail) payload.show_product_detail = 'true';
    if (options.show_tax_factor) payload.show_tax_factor = 'true';
    if (options.show_attachments) payload.show_attachments = 'true';
    if (options.show_delivery_service_events) payload.show_delivery_service_events = 'true';
    if (options.show_delivery_stats) payload.show_delivery_stats = 'true';
    if (options.show_sum_credit) payload.show_sum_credit = 'true';
    if (options.show_split_orders) payload.show_split_orders = 'true';
    if (options.show_sticker_list) payload.show_sticker_list = 'true';
    if (options.show_product_metadata) payload.show_product_metadata = 'true';
    if (options.show_tracking_url) payload.show_tracking_url = 'true';
    if (options.show_associated_tracking_numbers) payload.show_associated_tracking_numbers = 'true';
    if (options.show_purchase_prices) payload.show_purchase_prices = 'true';
    if (options.show_document_info) payload.show_document_info = 'true';
    if (options.status_desc) payload.status_desc = 'true';

    return this.metakockaService.post<GetDocumentResponse>('get_document', payload);
  }

  /**
   * Update a sales order
   * 
   * @param order - Sales order data with mk_id
   * @returns Document response
   */
  async updateSalesOrder(
    order: Partial<SalesOrderDocument> & { mk_id: string },
  ): Promise<DocumentResponse> {
    const payload = {
      ...order,
      doc_type: 'sales_order' as const,
    };

    return this.metakockaService.post<DocumentResponse>('update_document', payload);
  }

  /**
   * Delete a sales order
   * 
   * @param mkId - Document mk_id
   * @returns Response
   */
  async deleteSalesOrder(mkId: string): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>('delete_document', {
      doc_type: 'sales_order',
      mk_id: mkId,
    });
  }

  // ============================================
  // Sales Bill Operations
  // ============================================

  /**
   * Create a new sales bill (invoice)
   * 
   * @param bill - Bill data
   * @param docType - Bill type (default: sales_bill_domestic)
   * @returns Document response
   */
  async createSalesBill(
    bill: Omit<SalesBillDocument, 'doc_type'>,
    docType: 'sales_bill_domestic' | 'sales_bill_foreign' | 'sales_bill_retail' | 'sales_bill_credit_note' = 'sales_bill_domestic',
  ): Promise<DocumentResponse> {
    const payload = {
      ...bill,
      doc_type: docType,
    };

    return this.metakockaService.post<DocumentResponse>('put_document', payload);
  }

  /**
   * Get a sales bill by ID
   * 
   * @param options - Query options
   * @returns Bill document
   */
  async getSalesBill(options: {
    doc_id?: string;
    count_code?: string;
    doc_type?: 'sales_bill_domestic' | 'sales_bill_foreign' | 'sales_bill_retail' | 'sales_bill_prepaid' | 'sales_bill_credit_note';
    show_payment_detail?: boolean;
    show_product_detail?: boolean;
    show_tax_factor?: boolean;
    show_product_compound?: boolean;
    show_sales_order_method_of_payment?: boolean;
    show_allocated_cost_list?: boolean;
    status_desc?: boolean;
  }): Promise<GetDocumentResponse> {
    const payload: Record<string, any> = {
      doc_type: options.doc_type || 'sales_bill_domestic',
    };

    if (options.doc_id) payload.doc_id = options.doc_id;
    if (options.count_code) payload.count_code = options.count_code;
    if (options.show_payment_detail) payload.show_payment_detail = 'true';
    if (options.show_product_detail) payload.show_product_detail = 'true';
    if (options.show_tax_factor) payload.show_tax_factor = 'true';
    if (options.show_product_compound) payload.show_product_compound = 'true';
    if (options.show_sales_order_method_of_payment) payload.show_sales_order_method_of_payment = 'true';
    if (options.show_allocated_cost_list) payload.show_allocated_cost_list = 'true';
    if (options.status_desc) payload.status_desc = 'true';

    return this.metakockaService.post<GetDocumentResponse>('get_document', payload);
  }

  /**
   * Update a sales bill status
   * 
   * @param mkId - Document mk_id
   * @param statusCode - New status code
   * @returns Response
   */
  async updateSalesBillStatus(
    mkId: string,
    statusCode: string,
    docType: 'sales_bill_domestic' | 'sales_bill_foreign' | 'sales_bill_retail' = 'sales_bill_domestic',
  ): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>('update_document', {
      doc_type: docType,
      mk_id: mkId,
      status_code: statusCode,
    });
  }

  // ============================================
  // Sales Offer Operations
  // ============================================

  /**
   * Create a new sales offer (quotation)
   * 
   * @param offer - Offer data
   * @returns Document response
   */
  async createSalesOffer(offer: Omit<DocumentBase, 'doc_type'>): Promise<DocumentResponse> {
    const payload = {
      ...offer,
      doc_type: 'sales_offer' as const,
    };

    return this.metakockaService.post<DocumentResponse>('put_document', payload);
  }

  /**
   * Get a sales offer by ID
   */
  async getSalesOffer(options: {
    doc_id?: string;
    count_code?: string;
  }): Promise<GetDocumentResponse> {
    return this.metakockaService.post<GetDocumentResponse>('get_document', {
      doc_type: 'sales_offer',
      ...options,
    });
  }

  // ============================================
  // Warehouse Document Operations
  // ============================================

  /**
   * Create a warehouse document
   * 
   * @param doc - Document data
   * @param docType - Warehouse document type
   * @returns Document response
   */
  async createWarehouseDocument(
    doc: Omit<DocumentBase, 'doc_type'>,
    docType: 'warehouse_delivery_note' | 'warehouse_packing_list' | 'warehouse_receiving_note' | 'warehouse_acceptance_note',
  ): Promise<DocumentResponse> {
    const payload = {
      ...doc,
      doc_type: docType,
    };

    return this.metakockaService.post<DocumentResponse>('put_document', payload);
  }

  /**
   * Get a warehouse document by ID
   */
  async getWarehouseDocument(options: {
    doc_id?: string;
    count_code?: string;
    doc_type: 'warehouse_delivery_note' | 'warehouse_packing_list' | 'warehouse_receiving_note' | 'warehouse_acceptance_note';
    show_product_compound?: boolean;
    show_allocated_cost_list?: boolean;
  }): Promise<GetDocumentResponse> {
    const payload: Record<string, any> = {
      doc_type: options.doc_type,
    };

    if (options.doc_id) payload.doc_id = options.doc_id;
    if (options.count_code) payload.count_code = options.count_code;
    if (options.show_product_compound) payload.show_product_compound = 'true';
    if (options.show_allocated_cost_list) payload.show_allocated_cost_list = 'true';

    return this.metakockaService.post<GetDocumentResponse>('get_document', payload);
  }

  /**
   * Delete a warehouse document
   */
  async deleteWarehouseDocument(
    mkId: string,
    docType: 'warehouse_delivery_note' | 'warehouse_packing_list' | 'warehouse_receiving_note' | 'warehouse_acceptance_note',
  ): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>('delete_document', {
      doc_type: docType,
      mk_id: mkId,
    });
  }

  // ============================================
  // Transfer Order Operations
  // ============================================

  /**
   * Create a transfer order
   * 
   * @param doc - Transfer order data
   * @returns Document response
   */
  async createTransferOrder(doc: {
    doc_date: string;
    warehouse_from: string;
    warehouse_to: string;
    product_list: DocumentProduct[];
    notes?: string;
    count_code?: string;
  }): Promise<DocumentResponse> {
    return this.metakockaService.post<DocumentResponse>('put_document', {
      ...doc,
      doc_type: 'transfer_order',
    });
  }

  /**
   * Get a transfer order by ID
   */
  async getTransferOrder(options: {
    doc_id?: string;
    count_code?: string;
  }): Promise<GetDocumentResponse> {
    return this.metakockaService.post<GetDocumentResponse>('get_document', {
      doc_type: 'transfer_order',
      ...options,
    });
  }

  /**
   * Update a transfer order
   */
  async updateTransferOrder(doc: {
    mk_id: string;
    wh_mark?: string;
    product_list?: DocumentProduct[];
  }): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>('update_document', {
      ...doc,
      doc_type: 'transfer_order',
    });
  }

  // ============================================
  // Purchase Order Operations
  // ============================================

  /**
   * Create a purchase order
   */
  async createPurchaseOrder(doc: Omit<DocumentBase, 'doc_type'>): Promise<DocumentResponse> {
    return this.metakockaService.post<DocumentResponse>('put_document', {
      ...doc,
      doc_type: 'purchase_order',
    });
  }

  // ============================================
  // Work Order Operations
  // ============================================

  /**
   * Create a work order
   */
  async createWorkOrder(doc: Omit<DocumentBase, 'doc_type'> & {
    planned_start_date?: string;
    planned_end_date?: string;
  }): Promise<DocumentResponse> {
    return this.metakockaService.post<DocumentResponse>('put_document', {
      ...doc,
      doc_type: 'workorder',
    });
  }

  /**
   * Get a work order by ID
   */
  async getWorkOrder(options: {
    doc_id?: string;
    count_code?: string;
  }): Promise<GetDocumentResponse> {
    return this.metakockaService.post<GetDocumentResponse>('get_document', {
      doc_type: 'workorder',
      ...options,
    });
  }

  /**
   * Update a work order
   */
  async updateWorkOrder(doc: {
    mk_id: string;
    plan_realization_list?: any[];
    material_realization_list?: any[];
  }): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>('update_document', {
      ...doc,
      doc_type: 'workorder',
    });
  }

  // ============================================
  // Document Status Operations
  // ============================================

  /**
   * Change document status
   * 
   * @param docType - Document type (sales_order, warehouse_receiving_note)
   * @param options - Status change options
   * @returns Response
   */
  async changeDocumentStatus(
    docType: DocumentType,
    options: {
      mk_id?: string;
      mk_id_list?: string[];
      count_code?: string;
      buyer_order?: string;
      new_status: string;
      api_user_email?: string;
    },
  ): Promise<ChangeDocumentStatusResponse> {
    const payload: Record<string, any> = {
      doc_type: docType,
      status_code: options.new_status,
    };

    if (options.mk_id) payload.mk_id = options.mk_id;
    if (options.mk_id_list) payload.mk_id_list = options.mk_id_list;
    if (options.count_code) payload.count_code = options.count_code;
    if (options.buyer_order) payload.buyer_order = options.buyer_order;
    if (options.api_user_email) payload.api_user_email = options.api_user_email;

    return this.metakockaService.post<ChangeDocumentStatusResponse>('change_document_status', payload);
  }

  // ============================================
  // Attachment Operations
  // ============================================

  /**
   * Add attachment(s) to a document
   * 
   * @param docType - Document type
   * @param mkId - Document mk_id
   * @param attachments - Array of attachments with file_name and source_url or data_b64
   * @returns Response
   */
  async addAttachment(
    docType: DocumentType,
    mkId: string,
    attachments: { file_name: string; source_url?: string; data_b64?: string }[],
  ): Promise<AddAttachmentResponse> {
    return this.metakockaService.post<AddAttachmentResponse>('add_attachment', {
      doc_type: docType,
      mk_id: mkId,
      attachment_list: attachments,
    });
  }

  // ============================================
  // Payment Operations
  // ============================================

  /**
   * Add payment/transaction to document
   * 
   * @param options - Payment options
   * @returns Response
   * 
   * Note: doc_type can be: bill, sales_offer, sales_order, sales_bill_domestic, 
   * sales_bill_foreign, sales_bill_retail, purchase_bill_domestic, purchase_bill_foreign
   */
  async addPayment(options: {
    doc_type: DocumentType | 'bill';
    mk_id?: string;
    count_code?: string;
    buyer_order?: string;
    payment_mode?: 'payment' | 'prepayment' | 'return';
    payment_type: string;
    cash_register?: string;
    date: string;
    price: string;
    notes?: string;
  }): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>('put_transaction', options);
  }

  // ============================================
  // Generic Document Operations
  // ============================================

  /**
   * Get any document by type and ID
   */
  async getDocument(
    docType: DocumentType,
    options: {
      doc_id?: string;
      count_code?: string;
      [key: string]: any;
    },
  ): Promise<GetDocumentResponse> {
    return this.metakockaService.post<GetDocumentResponse>('get_document', {
      doc_type: docType,
      ...options,
    });
  }

  /**
   * Create any document
   */
  async createDocument(
    docType: DocumentType,
    doc: Omit<DocumentBase, 'doc_type'>,
  ): Promise<DocumentResponse> {
    return this.metakockaService.post<DocumentResponse>('put_document', {
      ...doc,
      doc_type: docType,
    });
  }

  /**
   * Update any document
   */
  async updateDocument(
    docType: DocumentType,
    doc: { mk_id: string; [key: string]: any },
  ): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>('update_document', {
      ...doc,
      doc_type: docType,
    });
  }

  /**
   * Delete any document
   */
  async deleteDocument(docType: DocumentType, mkId: string): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>('delete_document', {
      doc_type: docType,
      mk_id: mkId,
    });
  }
}
