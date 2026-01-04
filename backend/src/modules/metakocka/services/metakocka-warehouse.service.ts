import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { MetakockaService } from '../metakocka.service';
import {
  Warehouse,
  WarehouseListResponse,
  WarehouseStockResponse,
  StockItem,
  ImportInventoryRequest,
  ImportInventoryResponse,
  MetakockaResponse,
} from '../interfaces';

/**
 * MetaKocka Warehouse Service
 * 
 * Handles all warehouse-related API operations:
 * - warehouse_list: Get list of warehouses
 * - warehouse_stock: Get stock levels
 * - source_stock: Get stock for external ERP
 * - import_inventory: Import inventory data
 * - order_change_warehouse: Warehouse mapping rules
 * - order_forbidden_products: Forbidden products rules
 * 
 * API Documentation: /docs/warehouse_list.md, /docs/warehouse_stock.md, etc.
 */
@Injectable()
export class MetakockaWarehouseService {
  private readonly logger = new Logger(MetakockaWarehouseService.name);

  constructor(private readonly metakockaService: MetakockaService) {}

  /**
   * Get list of all warehouses
   * 
   * @returns Warehouse list response
   */
  async getWarehouses(): Promise<WarehouseListResponse> {
    return this.metakockaService.post<WarehouseListResponse>('json/warehouse_list', {});
  }

  /**
   * Get warehouse by mark (identifier)
   * 
   * @param mark - Warehouse mark
   * @returns Warehouse or null
   */
  async getWarehouseByMark(mark: string): Promise<Warehouse | null> {
    const response = await this.getWarehouses();

    if (!this.metakockaService.isSuccess(response)) {
      throw new BadRequestException(this.metakockaService.getErrorMessage(response));
    }

    return response.warehouse_list?.find((wh) => wh.mark === mark) || null;
  }

  /**
   * Get stock for all products across warehouses
   * 
   * @param options - Query options
   * @returns Stock list response
   * 
   * @example
   * // Get stock with reservations
   * const stock = await warehouseService.getStock({
   *   wh_id_list: ['1600000042', '1600000067'],
   *   limit: 100,
   * });
   */
  async getStock(options: {
    wh_id_list?: string[];
    product_code_list?: string[];
    product_mk_id_list?: string[];
    eshop_sync?: boolean;
    return_expect_order_delivery_date?: boolean;
    return_reservation_without_amount?: boolean;
    offset?: number;
    limit?: number;
  } = {}): Promise<WarehouseStockResponse> {
    const payload: Record<string, any> = {};

    if (options.wh_id_list) payload.wh_id_list = options.wh_id_list.join(',');
    if (options.product_code_list) payload.product_code_list = options.product_code_list.join(',');
    if (options.product_mk_id_list) payload.product_mk_id_list = options.product_mk_id_list.join(',');
    if (options.eshop_sync !== undefined) payload.eshop_sync = options.eshop_sync.toString();
    if (options.return_expect_order_delivery_date !== undefined) 
      payload.return_expect_order_delivery_date = options.return_expect_order_delivery_date.toString();
    if (options.return_reservation_without_amount !== undefined) 
      payload.return_reservation_without_amount = options.return_reservation_without_amount.toString();
    if (options.offset !== undefined) payload.offset = options.offset.toString();
    if (options.limit !== undefined) payload.limit = options.limit.toString();

    return this.metakockaService.post<WarehouseStockResponse>('json/warehouse_stock', payload);
  }

  /**
   * Get all stock with pagination handled automatically
   * 
   * @param options - Query options (excluding offset/limit)
   * @returns Array of all stock items
   */
  async getAllStock(
    options: Omit<Parameters<typeof this.getStock>[0], 'offset' | 'limit'> = {},
  ): Promise<StockItem[]> {
    const allStock: StockItem[] = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      const response = await this.getStock({ ...options, offset, limit });

      if (!this.metakockaService.isSuccess(response)) {
        throw new BadRequestException(this.metakockaService.getErrorMessage(response));
      }

      if (response.stock_list) {
        allStock.push(...response.stock_list);
      }

      if (!response.stock_list || response.stock_list.length < limit) {
        break;
      }

      offset += limit;
    }

    return allStock;
  }

  /**
   * Get stock for a specific product
   * 
   * @param productCode - Product code or mk_id
   * @param byMkId - If true, search by mk_id instead of code
   * @returns Stock items for the product
   */
  async getProductStock(productCode: string, byMkId = false): Promise<StockItem[]> {
    const options = byMkId
      ? { product_mk_id_list: [productCode] }
      : { product_code_list: [productCode] };

    const response = await this.getStock(options);

    if (!this.metakockaService.isSuccess(response)) {
      throw new BadRequestException(this.metakockaService.getErrorMessage(response));
    }

    return response.stock_list || [];
  }

  /**
   * Get stock for external ERP systems
   * 
   * @param options - Query options
   * @returns Stock response
   */
  async getSourceStock(options: {
    warehouse_id?: string;
    offset?: number;
    limit?: number;
  } = {}): Promise<WarehouseStockResponse> {
    const payload: Record<string, any> = {};

    if (options.warehouse_id) payload.warehouse_id = options.warehouse_id;
    if (options.offset !== undefined) payload.offset = options.offset.toString();
    if (options.limit !== undefined) payload.limit = options.limit.toString();

    return this.metakockaService.post<WarehouseStockResponse>('source_stock', payload);
  }

  /**
   * Import inventory data
   * 
   * @param inventory - Inventory items to import
   * @param replaceInventory - If true, replaces existing inventory
   * @returns Import response
   * 
   * @example
   * const result = await warehouseService.importInventory([
   *   { product_code: 'PROD1', warehouse_id: '1600000042', amount: '100' },
   *   { product_code: 'PROD2', warehouse_id: '1600000042', amount: '50' },
   * ]);
   */
  async importInventory(
    inventory: {
      product_mk_id?: string;
      product_code?: string;
      warehouse_id: string;
      amount: string;
      serial_number?: string;
      lot_number?: string;
      exp_date?: string;
      microlocation?: string;
      purchase_price?: string;
    }[],
    replaceInventory = false,
  ): Promise<ImportInventoryResponse> {
    const payload: Record<string, any> = {
      inventory_list: inventory,
    };

    if (replaceInventory) {
      payload.replace_inventory = 'true';
    }

    return this.metakockaService.post<ImportInventoryResponse>('import_inventory', payload);
  }

  /**
   * Get warehouse mapping rules for orders
   * 
   * @returns Warehouse mapping rules (change_list)
   */
  async getOrderChangeWarehouse(): Promise<MetakockaResponse & { change_list: any[] }> {
    return this.metakockaService.post('get_order_change_warehouse', {});
  }

  /**
   * Replace warehouse mapping rules for orders
   * 
   * Warning: This replaces ALL rules. It is not possible to insert/update/delete specific rules.
   * We recommend to first read all rules with getOrderChangeWarehouse and then replace them.
   * 
   * @param changeList - New warehouse mapping rules
   * @returns Response
   */
  async replaceOrderChangeWarehouse(changeList: {
    from_status_list?: string;
    from_warehouse_mark_list?: string;
    from_delivery_type_list?: string;
    product_code_list?: string;
    to_warehouse_mark?: string;
    to_delivery_type?: string;
  }[]): Promise<MetakockaResponse> {
    return this.metakockaService.post('replace_order_change_warehouse', { change_list: changeList });
  }

  /**
   * Get forbidden products rules for orders
   * 
   * @returns Forbidden products rules (change_list)
   */
  async getOrderForbiddenProducts(): Promise<MetakockaResponse & { change_list: any[] }> {
    return this.metakockaService.post('get_order_forbidden_products', {});
  }

  /**
   * Replace forbidden products rules for orders
   * 
   * Warning: This replaces ALL rules. It is not possible to insert/update/delete specific rules.
   * We recommend to first read all rules with getOrderForbiddenProducts and then replace them.
   * 
   * @param changeList - New forbidden products rules
   * @returns Response
   */
  async replaceOrderForbiddenProducts(changeList: {
    forbidden_country_list?: string;
    forbidden_status_list?: string;
    product_code_list?: string;
    to_status?: string;
  }[]): Promise<MetakockaResponse> {
    return this.metakockaService.post('replace_order_forbidden_products', { change_list: changeList });
  }

  /**
   * Sync stock with local database
   * Helper method for e-commerce sync
   * 
   * @param onStockUpdate - Callback for each stock item
   * @returns Number of items processed
   */
  async syncStock(
    onStockUpdate: (item: StockItem) => Promise<void>,
  ): Promise<number> {
    const allStock = await this.getAllStock({ eshop_sync: true });
    let processed = 0;

    for (const item of allStock) {
      await onStockUpdate(item);
      processed++;
    }

    return processed;
  }

  /**
   * Check if product is in stock
   * 
   * @param productCode - Product code
   * @param requiredAmount - Required amount
   * @param warehouseId - Optional specific warehouse
   * @returns True if in stock
   */
  async isInStock(
    productCode: string,
    requiredAmount: number,
    warehouseId?: string,
  ): Promise<boolean> {
    const stockItems = await this.getProductStock(productCode);

    if (warehouseId) {
      const item = stockItems.find((s) => s.warehouse_id === warehouseId);
      const available = item?.free_amount 
        ? parseFloat(item.free_amount) 
        : parseFloat(item?.amount || '0');
      return available >= requiredAmount;
    }

    // Sum across all warehouses
    const totalAvailable = stockItems.reduce((sum, item) => {
      const available = item.free_amount 
        ? parseFloat(item.free_amount) 
        : parseFloat(item.amount || '0');
      return sum + available;
    }, 0);

    return totalAvailable >= requiredAmount;
  }
}
