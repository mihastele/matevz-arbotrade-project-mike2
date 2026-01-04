import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MetakockaService } from './metakocka.service';
import { MetakockaProductService } from './services/metakocka-product.service';
import { MetakockaDocumentService } from './services/metakocka-document.service';
import { MetakockaPartnerService } from './services/metakocka-partner.service';
import { MetakockaWarehouseService } from './services/metakocka-warehouse.service';
import { MetakockaSearchService } from './services/metakocka-search.service';
import { MetakockaReportService } from './services/metakocka-report.service';
import {
  ProductListQueryDto,
  CreateProductDto,
  UpdateProductDto,
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  SearchDocumentsDto,
  WarehouseStockQueryDto,
  ImportInventoryDto,
  GetPartnersQueryDto,
  CreatePartnerDto,
  GenerateReportDto,
  SendMessageDto,
} from './dto';
import { DocumentType } from './interfaces';

/**
 * MetaKocka API Controller
 * 
 * Provides REST endpoints for all MetaKocka API operations.
 * All endpoints require JWT authentication.
 * 
 * API Documentation: https://github.com/metakocka/metakocka_api_base
 */
@ApiTags('MetaKocka')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('metakocka')
export class MetakockaController {
  constructor(
    private readonly metakockaService: MetakockaService,
    private readonly productService: MetakockaProductService,
    private readonly documentService: MetakockaDocumentService,
    private readonly partnerService: MetakockaPartnerService,
    private readonly warehouseService: MetakockaWarehouseService,
    private readonly searchService: MetakockaSearchService,
    private readonly reportService: MetakockaReportService,
  ) {}

  // ============================================
  // Connection Test
  // ============================================

  @Get('test')
  @ApiOperation({ summary: 'Test MetaKocka API connection' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testConnection() {
    const isConnected = await this.metakockaService.testConnection();
    return { connected: isConnected };
  }

  // ============================================
  // Products
  // ============================================

  @Get('products')
  @ApiOperation({ summary: 'Get list of products' })
  @ApiResponse({ status: 200, description: 'Product list retrieved successfully' })
  async getProducts(@Query() query: ProductListQueryDto) {
    return this.productService.getProducts(query);
  }

  @Get('products/:identifier')
  @ApiOperation({ summary: 'Get a single product by count_code or code' })
  @ApiParam({ name: 'identifier', description: 'Product count_code or code' })
  @ApiQuery({ name: 'byCode', required: false, description: 'Search by code instead of count_code' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(
    @Param('identifier') identifier: string,
    @Query('byCode') byCode?: string,
  ) {
    const product = await this.productService.getProduct(identifier, byCode === 'true');
    if (!product) {
      return { message: 'Product not found' };
    }
    return product;
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productService.addProduct(createProductDto);
  }

  @Put('products')
  @ApiOperation({ summary: 'Update an existing product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async updateProduct(@Body() updateProductDto: UpdateProductDto) {
    return this.productService.updateProduct(updateProductDto);
  }

  @Delete('products/:mkId')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'mkId', description: 'Product MK ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async deleteProduct(@Param('mkId') mkId: string) {
    return this.productService.deleteProduct(mkId);
  }

  // ============================================
  // Sales Orders
  // ============================================

  @Post('sales-orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new sales order' })
  @ApiResponse({ status: 201, description: 'Sales order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createSalesOrder(@Body() createOrderDto: CreateSalesOrderDto) {
    return this.documentService.createSalesOrder(createOrderDto);
  }

  @Get('sales-orders/:identifier')
  @ApiOperation({ summary: 'Get a sales order by ID or count_code' })
  @ApiParam({ name: 'identifier', description: 'Document MK ID or count_code' })
  @ApiQuery({ name: 'byCountCode', required: false, description: 'Search by count_code instead of mk_id' })
  @ApiResponse({ status: 200, description: 'Sales order retrieved successfully' })
  async getSalesOrder(
    @Param('identifier') identifier: string,
    @Query('byCountCode') byCountCode?: string,
  ) {
    const options = byCountCode === 'true'
      ? { count_code: identifier }
      : { doc_id: identifier };
    return this.documentService.getSalesOrder(options);
  }

  @Put('sales-orders')
  @ApiOperation({ summary: 'Update an existing sales order' })
  @ApiResponse({ status: 200, description: 'Sales order updated successfully' })
  async updateSalesOrder(@Body() updateOrderDto: UpdateSalesOrderDto) {
    return this.documentService.updateSalesOrder(updateOrderDto);
  }

  @Delete('sales-orders/:mkId')
  @ApiOperation({ summary: 'Delete a sales order' })
  @ApiParam({ name: 'mkId', description: 'Document MK ID' })
  @ApiResponse({ status: 200, description: 'Sales order deleted successfully' })
  async deleteSalesOrder(@Param('mkId') mkId: string) {
    return this.documentService.deleteSalesOrder(mkId);
  }

  // ============================================
  // Sales Bills (Invoices)
  // ============================================

  @Post('sales-bills')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new sales bill (invoice)' })
  @ApiQuery({ name: 'type', required: false, enum: ['domestic', 'foreign', 'retail', 'credit_note'] })
  @ApiResponse({ status: 201, description: 'Sales bill created successfully' })
  async createSalesBill(
    @Body() createBillDto: any, // Similar to CreateSalesOrderDto but for bills
    @Query('type') type?: string,
  ) {
    const docType = type === 'foreign' 
      ? 'sales_bill_foreign' 
      : type === 'retail' 
        ? 'sales_bill_retail' 
        : type === 'credit_note'
          ? 'sales_bill_credit_note'
          : 'sales_bill_domestic';
    return this.documentService.createSalesBill(createBillDto, docType as any);
  }

  @Get('sales-bills/:identifier')
  @ApiOperation({ summary: 'Get a sales bill by ID' })
  @ApiParam({ name: 'identifier', description: 'Document MK ID or count_code' })
  @ApiQuery({ name: 'type', required: false, enum: ['domestic', 'foreign', 'retail', 'prepaid', 'credit_note'] })
  @ApiResponse({ status: 200, description: 'Sales bill retrieved successfully' })
  async getSalesBill(
    @Param('identifier') identifier: string,
    @Query('type') type?: string,
    @Query('byCountCode') byCountCode?: string,
  ) {
    const docType = `sales_bill_${type || 'domestic'}` as any;
    const options = byCountCode === 'true'
      ? { count_code: identifier, doc_type: docType }
      : { doc_id: identifier, doc_type: docType };
    return this.documentService.getSalesBill(options);
  }

  // ============================================
  // Warehouse Documents
  // ============================================

  @Post('warehouse-docs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a warehouse document' })
  @ApiQuery({ 
    name: 'type', 
    required: true, 
    enum: ['delivery_note', 'packing_list', 'receiving_note', 'acceptance_note'] 
  })
  @ApiResponse({ status: 201, description: 'Warehouse document created successfully' })
  async createWarehouseDocument(
    @Body() createDocDto: any,
    @Query('type') type: string,
  ) {
    const docType = `warehouse_${type}` as any;
    return this.documentService.createWarehouseDocument(createDocDto, docType);
  }

  @Get('warehouse-docs/:mkId')
  @ApiOperation({ summary: 'Get a warehouse document by ID' })
  @ApiParam({ name: 'mkId', description: 'Document MK ID' })
  @ApiQuery({ 
    name: 'type', 
    required: true, 
    enum: ['delivery_note', 'packing_list', 'receiving_note', 'acceptance_note'] 
  })
  async getWarehouseDocument(
    @Param('mkId') mkId: string,
    @Query('type') type: string,
  ) {
    const docType = `warehouse_${type}` as any;
    return this.documentService.getWarehouseDocument({ doc_id: mkId, doc_type: docType });
  }

  // ============================================
  // Warehouses & Stock
  // ============================================

  @Get('warehouses')
  @ApiOperation({ summary: 'Get list of warehouses' })
  @ApiResponse({ status: 200, description: 'Warehouse list retrieved successfully' })
  async getWarehouses() {
    return this.warehouseService.getWarehouses();
  }

  @Get('stock')
  @ApiOperation({ summary: 'Get warehouse stock' })
  @ApiResponse({ status: 200, description: 'Stock data retrieved successfully' })
  async getStock(@Query() query: WarehouseStockQueryDto) {
    const options: any = {};
    if (query.wh_id_list) options.wh_id_list = query.wh_id_list.split(',');
    if (query.product_code_list) options.product_code_list = query.product_code_list.split(',');
    if (query.product_mk_id_list) options.product_mk_id_list = query.product_mk_id_list.split(',');
    if (query.eshop_sync !== undefined) options.eshop_sync = query.eshop_sync;
    if (query.offset !== undefined) options.offset = query.offset;
    if (query.limit !== undefined) options.limit = query.limit;
    return this.warehouseService.getStock(options);
  }

  @Get('stock/:productCode')
  @ApiOperation({ summary: 'Get stock for a specific product' })
  @ApiParam({ name: 'productCode', description: 'Product code or MK ID' })
  @ApiQuery({ name: 'byMkId', required: false, description: 'Search by MK ID instead of code' })
  async getProductStock(
    @Param('productCode') productCode: string,
    @Query('byMkId') byMkId?: string,
  ) {
    return this.warehouseService.getProductStock(productCode, byMkId === 'true');
  }

  @Post('inventory/import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import inventory data' })
  @ApiResponse({ status: 200, description: 'Inventory imported successfully' })
  async importInventory(@Body() importDto: ImportInventoryDto) {
    return this.warehouseService.importInventory(
      importDto.inventory_list,
      importDto.replace_inventory,
    );
  }

  // ============================================
  // Partners
  // ============================================

  @Get('partners')
  @ApiOperation({ summary: 'Search partners' })
  @ApiResponse({ status: 200, description: 'Partner list retrieved successfully' })
  async getPartners(@Query() query: GetPartnersQueryDto) {
    return this.partnerService.getPartners(query);
  }

  @Get('partners/:partnerId')
  @ApiOperation({ summary: 'Get a single partner by ID' })
  @ApiParam({ name: 'partnerId', description: 'Partner MK ID' })
  async getPartner(@Param('partnerId') partnerId: string) {
    const partner = await this.partnerService.getPartner(partnerId);
    if (!partner) {
      return { message: 'Partner not found' };
    }
    return partner;
  }

  @Post('partners')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new partner' })
  @ApiResponse({ status: 201, description: 'Partner created successfully' })
  async createPartner(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnerService.addPartner(createPartnerDto);
  }

  @Put('partners/:partnerId')
  @ApiOperation({ summary: 'Update an existing partner' })
  @ApiParam({ name: 'partnerId', description: 'Partner MK ID' })
  async updatePartner(
    @Param('partnerId') partnerId: string,
    @Body() updatePartnerDto: Partial<CreatePartnerDto>,
  ) {
    return this.partnerService.updatePartner({ mk_id: partnerId, ...updatePartnerDto });
  }

  // ============================================
  // Search
  // ============================================

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search documents' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchDocuments(@Body() searchDto: SearchDocumentsDto) {
    return this.searchService.search({
      doc_type: searchDto.doc_type as DocumentType,
      query: searchDto.query,
      query_advance: searchDto.query_advance,
      offset: searchDto.offset,
      limit: searchDto.limit,
      result_type: searchDto.result_type,
      order_direction: searchDto.order_direction,
    });
  }

  @Get('search/sales-orders/status/:status')
  @ApiOperation({ summary: 'Search sales orders by status' })
  @ApiParam({ name: 'status', description: 'Status code(s), comma-separated' })
  async searchSalesOrdersByStatus(
    @Param('status') status: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchSalesOrdersByStatus(status, {
      dateFrom,
      dateTo,
      limit,
      resultType: 'doc',
    });
  }

  @Get('search/invoices/unpaid')
  @ApiOperation({ summary: 'Search unpaid invoices' })
  async searchUnpaidInvoices(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchInvoicesByPaymentStatus(false, {
      dateFrom,
      dateTo,
      limit,
      resultType: 'doc',
    });
  }

  @Get('search/tracking/:code')
  @ApiOperation({ summary: 'Search by tracking code' })
  @ApiParam({ name: 'code', description: 'Tracking code' })
  async searchByTrackingCode(@Param('code') code: string) {
    return this.searchService.searchByTrackingCode({ tracking_code: code });
  }

  // ============================================
  // Reports
  // ============================================

  @Post('reports/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a document report (PDF/HTML)' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  async generateReport(@Body() reportDto: GenerateReportDto) {
    return this.reportService.generateReport({
      doc_type: reportDto.doc_type as DocumentType,
      mk_id: reportDto.mk_id,
      count_code: reportDto.count_code,
      report_code: reportDto.report_code,
      report_format: reportDto.report_format,
      return_file: reportDto.return_file,
    });
  }

  @Post('reports/generate-async')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a document report asynchronously' })
  @ApiResponse({ status: 200, description: 'Async report started' })
  async generateReportAsync(@Body() reportDto: GenerateReportDto) {
    return this.reportService.generateReportAsync({
      doc_type: reportDto.doc_type as DocumentType,
      mk_id: reportDto.mk_id,
      count_code: reportDto.count_code,
      report_code: reportDto.report_code,
      report_format: reportDto.report_format,
    });
  }

  @Get('reports/async-status/:asyncId')
  @ApiOperation({ summary: 'Get async report status' })
  @ApiParam({ name: 'asyncId', description: 'Async report ID' })
  async getAsyncReportStatus(@Param('asyncId') asyncId: string) {
    return this.reportService.getAsyncReportStatus(asyncId);
  }

  // ============================================
  // Messaging
  // ============================================

  @Post('messages/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send an email or SMS message' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  async sendMessage(@Body() messageDto: SendMessageDto) {
    return this.reportService.sendMessage({
      message_type: messageDto.message_type,
      recipient: messageDto.recipient,
      subject: messageDto.subject,
      message: messageDto.message,
      doc_type: messageDto.doc_type as DocumentType,
      mk_id: messageDto.mk_id,
    });
  }

  // ============================================
  // Stickers/Labels
  // ============================================

  @Post('stickers/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate shipping sticker/label' })
  @ApiResponse({ status: 200, description: 'Sticker generated successfully' })
  async generateSticker(@Body() stickerDto: {
    sales_order_mk_id?: string;
    sales_order_count_code?: string;
    customer_order_list?: string[];
    delivery_service?: string;
  }) {
    return this.reportService.generateSticker(stickerDto);
  }

  @Post('orders/mark-shipped')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark orders as shipped' })
  @ApiResponse({ status: 200, description: 'Orders marked as shipped' })
  async markOrdersAsShipped(@Body() shippingDto: {
    sales_order_mk_id_list?: string[];
    customer_order_list?: string[];
    tracking_code?: string;
    shipped_date?: string;
  }) {
    return this.reportService.markOrdersAsShipped(shippingDto);
  }

  // ============================================
  // Complaints
  // ============================================

  @Post('complaints')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a complaint' })
  @ApiResponse({ status: 201, description: 'Complaint created successfully' })
  async createComplaint(@Body() complaintDto: any) {
    return this.reportService.createComplaint(complaintDto);
  }

  @Get('complaints/:mkId')
  @ApiOperation({ summary: 'Get a complaint by ID' })
  @ApiParam({ name: 'mkId', description: 'Complaint MK ID (doc_id)' })
  async getComplaint(@Param('mkId') mkId: string) {
    return this.reportService.getComplaint({ doc_id: mkId });
  }

  @Put('complaints/:mkId')
  @ApiOperation({ summary: 'Update a complaint' })
  @ApiParam({ name: 'mkId', description: 'Complaint MK ID (claim_id)' })
  async updateComplaint(
    @Param('mkId') mkId: string,
    @Body() updateDto: { 
      claim_type: 'reclamation' | 'return' | 'replacement'; 
      claim_status: string; 
      claim_note?: string;
    },
  ) {
    return this.reportService.updateComplaint(mkId, updateDto.claim_type, {
      claim_status: updateDto.claim_status,
      claim_note: updateDto.claim_note,
    });
  }

  // ============================================
  // Bank & Cash Register
  // ============================================

  @Get('bank/statements')
  @ApiOperation({ summary: 'Get bank statements' })
  async getBankStatements(
    @Query('docDate') docDate?: string,
    @Query('docDateFrom') docDateFrom?: string,
    @Query('docDateTo') docDateTo?: string,
    @Query('docId') docId?: string,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportService.getBankStatements({
      doc_date: docDate,
      doc_date_from: docDateFrom,
      doc_date_to: docDateTo,
      doc_id: docId,
      offset,
      limit,
    });
  }

  @Get('bank/statement-status')
  @ApiOperation({ summary: 'Get bank statement status for all accounts' })
  async getBankStatementStatus() {
    return this.reportService.getBankStatementStatus();
  }

  @Get('cash-register/journal')
  @ApiOperation({ summary: 'Get cash register journal' })
  async getCashRegisterJournal(
    @Query('docDate') docDate?: string,
    @Query('docDateFrom') docDateFrom?: string,
    @Query('docDateTo') docDateTo?: string,
    @Query('docId') docId?: string,
    @Query('cashRegister') cashRegister?: string,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportService.getCashRegisterJournal({
      doc_date: docDate,
      doc_date_from: docDateFrom,
      doc_date_to: docDateTo,
      doc_id: docId,
      cash_register: cashRegister,
      offset,
      limit,
    });
  }

  // ============================================
  // Document Status
  // ============================================

  @Put('documents/status')
  @ApiOperation({ summary: 'Change document status' })
  @ApiResponse({ status: 200, description: 'Status changed successfully' })
  async changeDocumentStatus(@Body() statusDto: {
    doc_type: string;
    mk_id?: string;
    mk_id_list?: string[];
    count_code?: string;
    new_status: string;
  }) {
    return this.documentService.changeDocumentStatus(
      statusDto.doc_type as DocumentType,
      {
        mk_id: statusDto.mk_id,
        mk_id_list: statusDto.mk_id_list,
        count_code: statusDto.count_code,
        new_status: statusDto.new_status,
      },
    );
  }

  // ============================================
  // Payments
  // ============================================

  @Post('payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add payment to document' })
  @ApiResponse({ status: 200, description: 'Payment added successfully' })
  async addPayment(@Body() paymentDto: {
    doc_type: string;
    mk_id?: string;
    count_code?: string;
    buyer_order?: string;
    payment_mode?: 'payment' | 'prepayment' | 'return';
    payment_type: string;
    cash_register?: string;
    date: string;
    price: string;
    notes?: string;
  }) {
    return this.documentService.addPayment({
      doc_type: paymentDto.doc_type as DocumentType | 'bill',
      mk_id: paymentDto.mk_id,
      count_code: paymentDto.count_code,
      buyer_order: paymentDto.buyer_order,
      payment_mode: paymentDto.payment_mode,
      payment_type: paymentDto.payment_type,
      cash_register: paymentDto.cash_register,
      date: paymentDto.date,
      price: paymentDto.price,
      notes: paymentDto.notes,
    });
  }

  // ============================================
  // Attachments
  // ============================================

  @Post('attachments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add attachment(s) to document' })
  @ApiResponse({ status: 201, description: 'Attachment(s) added successfully' })
  async addAttachment(@Body() attachmentDto: {
    doc_type: string;
    mk_id: string;
    attachment_list: Array<{
      file_name: string;
      source_url?: string;
      data_b64?: string;
    }>;
  }) {
    return this.documentService.addAttachment(
      attachmentDto.doc_type as DocumentType,
      attachmentDto.mk_id,
      attachmentDto.attachment_list,
    );
  }
}
