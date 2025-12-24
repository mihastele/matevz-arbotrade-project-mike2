import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { MetakockaService } from '../metakocka.service';
import {
  DocumentType,
  SearchRequest,
  SearchResponse,
  SearchQueryAdvance,
  GetDocumentResponse,
} from '../interfaces';

/**
 * MetaKocka Search Service
 * 
 * Handles search API operations:
 * - search: Search documents by type with query or advance query
 * - search_tracking_code: Search by tracking code
 * 
 * API Documentation: /docs/search_concept.md, /docs/search_examples.md
 */
@Injectable()
export class MetakockaSearchService {
  private readonly logger = new Logger(MetakockaSearchService.name);

  constructor(private readonly metakockaService: MetakockaService) {}

  /**
   * Search documents
   * 
   * @param options - Search options
   * @param searchGroup - Optional search group for parallel requests
   * @returns Search response
   * 
   * @example
   * // Simple search
   * const results = await searchService.search({
   *   doc_type: 'sales_order',
   *   query: 'john',
   *   limit: 50,
   * });
   * 
   * // Advance search
   * const results = await searchService.search({
   *   doc_type: 'sales_bill_domestic',
   *   query_advance: [
   *     { type: 'doc_date_from', value: '2024-01-01+02:00' },
   *     { type: 'doc_date_to', value: '2024-12-31+02:00' },
   *     { type: 'payment_status', value: 'false' },
   *   ],
   *   result_type: 'doc',
   * });
   */
  async search(
    options: {
      doc_type: DocumentType;
      query?: string;
      query_advance?: SearchQueryAdvance[];
      offset?: number;
      limit?: number;
      result_type?: 'id' | 'doc';
      order_direction?: 'asc' | 'desc';
      // Additional options for specific document types
      show_product_detail?: boolean;
      show_tax_factor?: boolean;
      show_product_metadata?: boolean;
      show_delivery_service_events?: boolean;
      show_sticker_list?: boolean;
      show_tracking_url?: boolean;
      show_status_code?: boolean;
      return_delivery_service_events?: boolean;
      status_desc?: boolean;
    },
    searchGroup?: number,
  ): Promise<SearchResponse> {
    const payload: Record<string, any> = {
      doc_type: options.doc_type,
    };

    if (options.query) payload.query = options.query;
    if (options.query_advance) payload.query_advance = options.query_advance;
    if (options.offset !== undefined) payload.offset = options.offset.toString();
    if (options.limit !== undefined) payload.limit = options.limit.toString();
    if (options.result_type) payload.result_type = options.result_type;
    if (options.order_direction) payload.order_direction = options.order_direction;
    if (options.show_product_detail) payload.show_product_detail = 'true';
    if (options.show_tax_factor) payload.show_tax_factor = 'true';
    if (options.show_product_metadata) payload.show_product_metadata = 'true';
    if (options.show_delivery_service_events) payload.show_delivery_service_events = 'true';
    if (options.show_sticker_list) payload.show_sticker_list = 'true';
    if (options.show_tracking_url) payload.show_tracking_url = 'true';
    if (options.show_status_code) payload.show_status_code = 'true';
    if (options.return_delivery_service_events) payload.return_delivery_service_events = 'true';
    if (options.status_desc) payload.status_desc = 'true';

    return this.metakockaService.post<SearchResponse>('search', payload, searchGroup);
  }

  /**
   * Search all documents with pagination handled automatically
   * 
   * @param options - Search options (excluding offset)
   * @param maxResults - Maximum results to return (default: unlimited)
   * @returns Array of search results
   */
  async searchAll(
    options: Omit<Parameters<typeof this.search>[0], 'offset'> & { limit?: number },
    maxResults?: number,
  ): Promise<GetDocumentResponse[]> {
    const results: GetDocumentResponse[] = [];
    let offset = 0;
    const limit = options.limit || 100; // Max 100 per request

    while (true) {
      const response = await this.search({ ...options, offset, limit, result_type: 'doc' });

      if (!this.metakockaService.isSuccess(response)) {
        throw new BadRequestException(this.metakockaService.getErrorMessage(response));
      }

      const docs = response.result as GetDocumentResponse[];
      results.push(...docs);

      // Check if we've reached max results
      if (maxResults && results.length >= maxResults) {
        return results.slice(0, maxResults);
      }

      // Check if there are more results
      if (docs.length < limit || results.length >= parseInt(response.result_all_records)) {
        break;
      }

      offset += limit;
    }

    return results;
  }

  // ============================================
  // Sales Order Search Methods
  // ============================================

  /**
   * Search sales orders by status
   * 
   * @param status - Status code(s) (comma-separated)
   * @param options - Additional options
   */
  async searchSalesOrdersByStatus(
    status: string,
    options: {
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
      resultType?: 'id' | 'doc';
    } = {},
  ): Promise<SearchResponse> {
    const queryAdvance: SearchQueryAdvance[] = [
      { type: 'status_list', value: status },
    ];

    if (options.dateFrom) {
      queryAdvance.push({ type: 'doc_date_from', value: options.dateFrom });
    }
    if (options.dateTo) {
      queryAdvance.push({ type: 'doc_date_to', value: options.dateTo });
    }

    return this.search({
      doc_type: 'sales_order',
      query_advance: queryAdvance,
      limit: options.limit,
      offset: options.offset,
      result_type: options.resultType,
    });
  }

  /**
   * Search sales orders by date range
   */
  async searchSalesOrdersByDateRange(
    dateFrom: string,
    dateTo: string,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
      resultType?: 'id' | 'doc';
    } = {},
  ): Promise<SearchResponse> {
    const queryAdvance: SearchQueryAdvance[] = [
      { type: 'doc_date_from', value: dateFrom },
      { type: 'doc_date_to', value: dateTo },
    ];

    if (options.status) {
      queryAdvance.push({ type: 'status_list', value: options.status });
    }

    return this.search({
      doc_type: 'sales_order',
      query_advance: queryAdvance,
      limit: options.limit,
      offset: options.offset,
      result_type: options.resultType,
    });
  }

  /**
   * Search sales orders by last change timestamp
   */
  async searchSalesOrdersByLastChange(
    lastChangeFrom: string,
    options: {
      lastChangeTo?: string;
      limit?: number;
      offset?: number;
      resultType?: 'id' | 'doc';
    } = {},
  ): Promise<SearchResponse> {
    const queryAdvance: SearchQueryAdvance[] = [
      { type: 'last_change_from', value: lastChangeFrom },
    ];

    if (options.lastChangeTo) {
      queryAdvance.push({ type: 'last_change_to', value: options.lastChangeTo });
    }

    return this.search({
      doc_type: 'sales_order',
      query_advance: queryAdvance,
      limit: options.limit,
      offset: options.offset,
      result_type: options.resultType,
    });
  }

  /**
   * Search sales orders by partner parameters
   */
  async searchSalesOrdersByPartner(
    partner: {
      country?: string;
      taxNumber?: string;
      name?: string;
    },
    options: {
      limit?: number;
      offset?: number;
      resultType?: 'id' | 'doc';
    } = {},
  ): Promise<SearchResponse> {
    const queryAdvance: SearchQueryAdvance[] = [];

    if (partner.country) {
      queryAdvance.push({ type: 'partner_country', value: partner.country });
    }
    if (partner.taxNumber) {
      queryAdvance.push({ type: 'partner_tax_num', value: partner.taxNumber });
    }
    if (partner.name) {
      queryAdvance.push({ type: 'partner_name', value: partner.name });
    }

    return this.search({
      doc_type: 'sales_order',
      query_advance: queryAdvance,
      limit: options.limit,
      offset: options.offset,
      result_type: options.resultType,
    });
  }

  /**
   * Search sales orders by products
   */
  async searchSalesOrdersByProducts(
    products: {
      productIds?: string[];
      productCodes?: string[];
    },
    options: {
      limit?: number;
      offset?: number;
      resultType?: 'id' | 'doc';
    } = {},
  ): Promise<SearchResponse> {
    const queryAdvance: SearchQueryAdvance[] = [];

    if (products.productIds && products.productIds.length > 0) {
      queryAdvance.push({ type: 'product_mk_id_list', value: products.productIds.join(',') });
    }
    if (products.productCodes && products.productCodes.length > 0) {
      queryAdvance.push({ type: 'product_code_list', value: products.productCodes.join(',') });
    }

    return this.search({
      doc_type: 'sales_order',
      query_advance: queryAdvance,
      limit: options.limit,
      offset: options.offset,
      result_type: options.resultType,
    });
  }

  // ============================================
  // Invoice Search Methods
  // ============================================

  /**
   * Search invoices by payment status
   */
  async searchInvoicesByPaymentStatus(
    isPaid: boolean,
    options: {
      docType?: 'sales_bill_domestic' | 'sales_bill_foreign' | 'sales_bill_retail';
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
      resultType?: 'id' | 'doc';
    } = {},
  ): Promise<SearchResponse> {
    const queryAdvance: SearchQueryAdvance[] = [
      { type: 'payment_status', value: isPaid.toString() },
    ];

    if (options.dateFrom) {
      queryAdvance.push({ type: 'doc_date_from', value: options.dateFrom });
    }
    if (options.dateTo) {
      queryAdvance.push({ type: 'doc_date_to', value: options.dateTo });
    }

    return this.search({
      doc_type: options.docType || 'sales_bill_domestic',
      query_advance: queryAdvance,
      limit: options.limit,
      offset: options.offset,
      result_type: options.resultType,
    });
  }

  /**
   * Search invoices without status
   */
  async searchInvoicesWithoutStatus(options: {
    docType?: 'sales_bill_domestic' | 'sales_bill_foreign' | 'sales_bill_retail';
    limit?: number;
    offset?: number;
    resultType?: 'id' | 'doc';
  } = {}): Promise<SearchResponse> {
    return this.search({
      doc_type: options.docType || 'sales_bill_domestic',
      query_advance: [{ type: 'status_id_list', value: '-2' }],
      limit: options.limit,
      offset: options.offset,
      result_type: options.resultType,
    });
  }

  // ============================================
  // Warehouse Document Search Methods
  // ============================================

  /**
   * Search warehouse documents
   */
  async searchWarehouseDocuments(
    docType: 'warehouse_delivery_note' | 'warehouse_packing_list' | 'warehouse_receiving_note' | 'warehouse_acceptance_note',
    options: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      showOnlyOpen?: boolean;
      writeOff?: boolean;
      limit?: number;
      offset?: number;
      resultType?: 'id' | 'doc';
    } = {},
  ): Promise<SearchResponse> {
    const queryAdvance: SearchQueryAdvance[] = [];

    if (options.status) {
      queryAdvance.push({ type: 'status', value: options.status });
    }
    if (options.dateFrom) {
      queryAdvance.push({ type: 'doc_date_from', value: options.dateFrom });
    }
    if (options.dateTo) {
      queryAdvance.push({ type: 'doc_date_to', value: options.dateTo });
    }
    if (options.showOnlyOpen) {
      queryAdvance.push({ type: 'show_only_open', value: 'true' });
    }
    if (options.writeOff !== undefined) {
      queryAdvance.push({ type: 'write_off', value: options.writeOff.toString() });
    }

    return this.search({
      doc_type: docType,
      query_advance: queryAdvance.length > 0 ? queryAdvance : undefined,
      limit: options.limit,
      offset: options.offset,
      result_type: options.resultType,
    });
  }

  // ============================================
  // Tracking and Complaint Search Methods
  // ============================================

  /**
   * Search by tracking code
   */
  async searchByTrackingCode(options: {
    tracking_code?: string;
    sticker_code?: string;
    customer_order?: string;
    product_code?: string;
    claim_status?: string;
    claim_description?: string;
    return_tracking_code?: string;
  }): Promise<SearchResponse> {
    return this.metakockaService.post<SearchResponse>('search_tracking_code', options);
  }

  /**
   * Search complaints by last change timestamp
   */
  async searchComplaintsByLastChange(
    lastChangeFrom: string,
    options: {
      lastChangeTo?: string;
      limit?: number;
      offset?: number;
      resultType?: 'id' | 'doc';
    } = {},
  ): Promise<SearchResponse> {
    const queryAdvance: SearchQueryAdvance[] = [
      { type: 'last_change_from', value: lastChangeFrom },
    ];

    if (options.lastChangeTo) {
      queryAdvance.push({ type: 'last_change_to', value: options.lastChangeTo });
    }

    return this.search({
      doc_type: 'sales_order' as DocumentType, // complaints are related to sales orders
      query_advance: [...queryAdvance, { type: 'doc_type_complaint', value: 'true' }],
      limit: options.limit,
      offset: options.offset,
      result_type: options.resultType,
    });
  }

  // ============================================
  // Transfer Order Search Methods
  // ============================================

  /**
   * Search transfer orders
   */
  async searchTransferOrders(options: {
    dateFrom?: string;
    dateTo?: string;
    warehouseFrom?: string;
    warehouseTo?: string;
    limit?: number;
    offset?: number;
    resultType?: 'id' | 'doc';
  } = {}): Promise<SearchResponse> {
    const queryAdvance: SearchQueryAdvance[] = [];

    if (options.dateFrom) {
      queryAdvance.push({ type: 'doc_date_from', value: options.dateFrom });
    }
    if (options.dateTo) {
      queryAdvance.push({ type: 'doc_date_to', value: options.dateTo });
    }
    if (options.warehouseFrom) {
      queryAdvance.push({ type: 'warehouse_from', value: options.warehouseFrom });
    }
    if (options.warehouseTo) {
      queryAdvance.push({ type: 'warehouse_to', value: options.warehouseTo });
    }

    return this.search({
      doc_type: 'transfer_order',
      query_advance: queryAdvance.length > 0 ? queryAdvance : undefined,
      limit: options.limit,
      offset: options.offset,
      result_type: options.resultType,
    });
  }
}
