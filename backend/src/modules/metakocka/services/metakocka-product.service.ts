import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { MetakockaService } from '../metakocka.service';
import {
  Product,
  ProductListResponse,
  ProductAddResponse,
  MetakockaResponse,
  ProductLocalization,
  ProductCategory,
  ProductPricelist,
  ProductPartnerInfo,
  ProductCompound,
} from '../interfaces';

/**
 * MetaKocka Product Service
 * 
 * Handles all product-related API operations:
 * - product_list: Get list of products with stock, prices, compounds
 * - product_add: Create new products
 * - product_update: Update existing products
 * - product_delete: Delete products
 * - product_partner_code: Manage partner-specific product codes
 * 
 * API Documentation: /docs/product_concept.md, /docs/product_list.md, etc.
 */
@Injectable()
export class MetakockaProductService {
  private readonly logger = new Logger(MetakockaProductService.name);

  constructor(private readonly metakockaService: MetakockaService) {}

  /**
   * Get list of products with optional filters
   * 
   * @param options - Query options
   * @returns Product list response
   * 
   * @example
   * // Get all sales products with stock
   * const products = await productService.getProducts({
   *   sales: true,
   *   return_warehause_stock: true,
   *   limit: 100
   * });
   */
  async getProducts(options: {
    count_code?: string;
    code?: string;
    sales?: boolean;
    purchase?: boolean;
    service?: boolean;
    work?: boolean;
    active?: boolean;
    eshop_sync?: boolean;
    return_warehause_stock?: boolean;
    return_free_amount?: boolean;
    return_warehouse_reservation?: boolean;
    return_product_partner_info?: boolean;
    return_category?: boolean;
    return_expect_order_delivery_date?: boolean;
    return_web_shop_link?: boolean;
    return_pricelist?: boolean;
    return_product_compound?: boolean;
    show_tax_factor?: boolean;
    category?: string;
    offset?: number;
    limit?: number;
  } = {}): Promise<ProductListResponse> {
    const payload: Record<string, any> = {};

    // Convert boolean values to strings as expected by API
    if (options.count_code) payload.count_code = options.count_code;
    if (options.code) payload.code = options.code;
    if (options.sales !== undefined) payload.sales = options.sales.toString();
    if (options.purchase !== undefined) payload.purchase = options.purchase.toString();
    if (options.service !== undefined) payload.service = options.service.toString();
    if (options.work !== undefined) payload.work = options.work.toString();
    if (options.active !== undefined) payload.active = options.active.toString();
    if (options.eshop_sync !== undefined) payload.eshop_sync = options.eshop_sync.toString();
    if (options.return_warehause_stock !== undefined) 
      payload.return_warehause_stock = options.return_warehause_stock.toString();
    if (options.return_free_amount !== undefined) 
      payload.return_free_amount = options.return_free_amount.toString();
    if (options.return_warehouse_reservation !== undefined) 
      payload.return_warehouse_reservation = options.return_warehouse_reservation.toString();
    if (options.return_product_partner_info !== undefined) 
      payload.return_product_partner_info = options.return_product_partner_info.toString();
    if (options.return_category !== undefined) 
      payload.return_category = options.return_category.toString();
    if (options.return_expect_order_delivery_date !== undefined) 
      payload.return_expect_order_delivery_date = options.return_expect_order_delivery_date.toString();
    if (options.return_web_shop_link !== undefined) 
      payload.return_web_shop_link = options.return_web_shop_link.toString();
    if (options.return_pricelist !== undefined) 
      payload.return_pricelist = options.return_pricelist.toString();
    if (options.return_product_compound !== undefined) 
      payload.return_product_compound = options.return_product_compound.toString();
    if (options.show_tax_factor !== undefined) 
      payload.show_tax_factor = options.show_tax_factor.toString();
    if (options.category) payload.category = options.category;
    if (options.offset !== undefined) payload.offset = options.offset.toString();
    if (options.limit !== undefined) payload.limit = options.limit.toString();

    return this.metakockaService.post<ProductListResponse>('json/product_list', payload);
  }

  /**
   * Get all products with pagination handled automatically
   * 
   * @param options - Query options (excluding offset/limit)
   * @returns Array of all products
   */
  async getAllProducts(options: Omit<Parameters<typeof this.getProducts>[0], 'offset' | 'limit'> = {}): Promise<Product[]> {
    const allProducts: Product[] = [];
    let offset = 0;
    const limit = 1000; // Max allowed by API

    while (true) {
      const response = await this.getProducts({ ...options, offset, limit });
      
      if (!this.metakockaService.isSuccess(response)) {
        throw new BadRequestException(this.metakockaService.getErrorMessage(response));
      }

      const products = Array.isArray(response.product_list) 
        ? response.product_list 
        : response.product_list ? [response.product_list] : [];
      
      allProducts.push(...products);

      if (products.length < limit) {
        break;
      }

      offset += limit;
    }

    return allProducts;
  }

  /**
   * Get a single product by count_code or code
   * 
   * @param identifier - Product count_code or code
   * @param byCode - If true, search by code instead of count_code
   */
  async getProduct(identifier: string, byCode = false): Promise<Product | null> {
    const payload = byCode ? { code: identifier } : { count_code: identifier };
    const response = await this.getProducts({
      ...payload,
      return_warehause_stock: true,
      return_pricelist: true,
    });

    if (!this.metakockaService.isSuccess(response)) {
      throw new BadRequestException(this.metakockaService.getErrorMessage(response));
    }

    const products = Array.isArray(response.product_list) 
      ? response.product_list 
      : response.product_list ? [response.product_list] : [];

    return products[0] || null;
  }

  /**
   * Add a new product
   * 
   * @param product - Product data
   * @returns Response with new product ID
   * 
   * @example
   * const result = await productService.addProduct({
   *   count_code: 'PROD001',
   *   code: 'SKU001',
   *   name: 'New Product',
   *   unit: 'kos',
   *   sales: 'true',
   * });
   */
  async addProduct(product: {
    count_code?: string;
    code?: string;
    barcode?: string;
    name: string;
    name_desc?: string;
    unit: string;
    service?: string;
    sales?: string;
    purchasing?: string;
    height?: string;
    width?: string;
    depth?: string;
    weight?: string;
    customs_fee?: string;
    country?: string;
    minimal_order_quantity?: string;
    localization?: ProductLocalization[];
    categories?: ProductCategory[];
    pricelist?: ProductPricelist[];
    product_partner_info?: ProductPartnerInfo[];
    attachment_list?: { file_name: string; source_url?: string; data_b64?: string }[];
    remove_not_send_attachments?: string;
  }): Promise<ProductAddResponse> {
    return this.metakockaService.post<ProductAddResponse>('json/product_add', product);
  }

  /**
   * Update an existing product
   * 
   * @param product - Product data with mk_id or count_code
   * @returns Response with product ID
   */
  async updateProduct(product: {
    mk_id?: string;
    count_code?: string;
    code?: string;
    barcode?: string;
    name?: string;
    name_desc?: string;
    unit?: string;
    service?: string;
    sales?: string;
    purchasing?: string;
    activated?: string;
    height?: string;
    width?: string;
    depth?: string;
    weight?: string;
    customs_fee?: string;
    country?: string;
    minimal_order_quantity?: string;
    localization?: ProductLocalization[];
    categories?: ProductCategory[];
    pricelist?: ProductPricelist[];
    product_partner_info?: ProductPartnerInfo[];
    attachment_list?: { file_name: string; source_url?: string; data_b64?: string }[];
    remove_not_send_attachments?: string;
    // Compound/norm support
    compound_type?: 'compound' | 'norm';
    compounds?: ProductCompound[];
    compounds_delete?: boolean;
    // Confirm service change
    confirm_save_change_product_service?: string;
    complete_set?: string;
  }): Promise<ProductAddResponse> {
    if (!product.mk_id && !product.count_code) {
      throw new BadRequestException('Either mk_id or count_code is required for update');
    }

    return this.metakockaService.post<ProductAddResponse>('json/product_update', product);
  }

  /**
   * Delete a product
   * 
   * @param identifier - Product mk_id or count_code
   * @param byCountCode - If true, use count_code instead of mk_id
   * @returns Response
   * 
   * Note: Cannot delete products that are used on documents
   */
  async deleteProduct(identifier: string, byCountCode = false): Promise<MetakockaResponse> {
    const payload = byCountCode 
      ? { count_code: identifier } 
      : { mk_id: identifier };

    return this.metakockaService.post<MetakockaResponse>('json/product_delete', payload);
  }

  /**
   * Add partner-specific product code
   * 
   * @param data - Partner code data
   * @returns Response with mk_id
   */
  async addProductPartnerCode(data: {
    product_mk_id?: string;
    product_count_code?: string;
    partner_id: string;
    product_code: string;
    product_name?: string;
  }): Promise<MetakockaResponse & { mk_id: string }> {
    return this.metakockaService.post<MetakockaResponse & { mk_id: string }>(
      'put_product_partner_code',
      data,
    );
  }

  /**
   * Update partner-specific product code
   * 
   * @param data - Partner code data with mk_id
   * @returns Response
   */
  async updateProductPartnerCode(data: {
    mk_id: string;
    product_code?: string;
    product_name?: string;
  }): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>(
      'update_product_partner_code',
      data,
    );
  }

  /**
   * Delete partner-specific product code(s)
   * 
   * @param productMkId - Product mk_id
   * @param partnerCodeMkIds - Array of product partner code mk_ids to delete
   * @returns Response
   */
  async deleteProductPartnerCode(
    productMkId: string, 
    partnerCodeMkIds: string[]
  ): Promise<MetakockaResponse> {
    return this.metakockaService.post<MetakockaResponse>(
      'delete_product_partner_code',
      { 
        mk_id: productMkId,
        product_partner_info: partnerCodeMkIds.map(id => ({ mk_id: id })),
      },
    );
  }
}
