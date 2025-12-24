/**
 * MetaKocka API Interfaces
 * Based on official MetaKocka REST API documentation
 * API Base URL: https://main.metakocka.si/rest/eshop/v1/
 */

// ============================================
// Common Interfaces
// ============================================

export interface MetakockaCredentials {
  secret_key: string;
  company_id: string;
}

export interface MetakockaResponse {
  opr_code: string;
  opr_time_ms: string;
  opr_desc?: string;
}

export interface MetakockaPaginatedResponse extends MetakockaResponse {
  offset: string;
  limit: string;
}

// ============================================
// Partner Interfaces
// ============================================

export interface PartnerContact {
  name?: string;
  phone?: string;
  fax?: string;
  gsm?: string;
  email?: string;
}

export interface PartnerDeliveryAddress {
  mk_id?: string;
  address_type: 'Račun' | 'Dobava' | 'Poslovna enota';
  street: string;
  post_number: string;
  city: string;
  province?: string;
  country: string;
  payment_due_days?: string;
  language?: string;
  currency_id?: string;
  currency?: string;
}

export interface Partner {
  mk_id?: string;
  mk_address_id?: string;
  count_code?: string;
  business_entity: string;
  taxpayer?: string;
  foreign_county?: string;
  buyer?: string;
  supplier?: string;
  tax_id_number?: string;
  registration_number?: string;
  customer: string;
  street: string;
  post_number: string;
  place: string;
  province?: string;
  country: string;
  country_iso_2?: string;
  useCustomerAsContact?: string;
  partner_contact?: PartnerContact;
  partner_delivery_address?: PartnerDeliveryAddress;
}

export interface PartnerDiscount {
  categories: string | string[];
  discount_percent: string;
  override_existing: string;
}

export interface PartnerListResponse extends MetakockaResponse {
  partner_list_count: string;
  partner_list: PartnerDetails[];
}

export interface PartnerDetails extends Partner {
  partner_contact_list?: PartnerContact[];
  partner_delivery_address_list?: PartnerDeliveryAddress[];
  discounts?: PartnerDiscount[];
}

// ============================================
// Product Interfaces
// ============================================

export interface ProductPriceDef {
  amount_from?: string;
  amount_to?: string;
  discount?: string;
  tax?: string;
  tax_desc?: string;
  price?: string;
  price_with_tax?: string;
  tax_factor?: string;
  lowest_price_30_days?: string;
}

export interface ProductPricelist {
  count_code: string;
  price_def: ProductPriceDef | ProductPriceDef[];
  title?: string;
  buyer?: string;
  valid_from?: string;
  valid_to?: string;
  sales_purchase?: 'sales' | 'purchase';
  currency_code?: string;
  pricelist_type?: string;
}

export interface ProductCompound {
  mk_id?: string;
  product_mk_id: string;
  product_count_code: string;
  product_code: string;
  product_title: string;
  amount: string;
  purchase_unit_factor?: string;
  supplier_id?: string;
  n_of_workers?: string;
  row_order?: string;
  workplace_id?: string;
}

export interface ProductPartnerInfo {
  product_code: string;
  product_name: string;
  partner_id: string;
}

export interface ProductLocalization {
  language: string;
  name: string;
  name_desc?: string;
}

export interface ProductCategory {
  category: string | string[];
}

export interface AmountDetail {
  warehouse_mark: string;
  warehouse_name: string;
  serial_number?: string;
  lot_number?: string;
  exp_date?: string;
  microlocation?: string;
  amount: string;
}

export interface OrderInDelivery {
  warehouse_id: string;
  warehouse_mark: string;
  amount: string;
  delivery_date: string;
}

export interface WebShopLink {
  webshop_id: string;
  webshop_name: string;
  product_url: string;
}

export interface Product {
  mk_id?: string;
  count_code?: string;
  code?: string;
  barcode?: string;
  name: string;
  name_desc?: string;
  unit: string;
  unit2?: string;
  unit_factor?: string;
  service?: string;
  sales?: string;
  purchasing?: string;
  work?: string;
  active?: string;
  eshop_sync?: string;
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
  amount?: string;
  free_amount?: string;
  amount_detail?: AmountDetail[];
  reservation_detail?: any[];
  order_in_delivery?: OrderInDelivery[];
  web_shop_link?: WebShopLink[];
  compound_type?: 'compound' | 'norm';
  compounds?: ProductCompound[];
  category_tree_list?: any[];
}

export interface ProductListResponse extends MetakockaPaginatedResponse {
  product_list_count: string;
  product_list: Product | Product[];
}

export interface ProductAddResponse extends MetakockaResponse {
  mk_id: string;
  count_code: string;
  product_partner_info_mk_id?: string[];
}

// ============================================
// Document Interfaces
// ============================================

export type DocumentType =
  | 'warehouse_delivery_note'
  | 'warehouse_packing_list'
  | 'warehouse_receiving_note'
  | 'warehouse_acceptance_note'
  | 'sales_order'
  | 'sales_offer'
  | 'sales_bill_domestic'
  | 'sales_bill_foreign'
  | 'sales_bill_retail'
  | 'sales_bill_prepaid'
  | 'sales_bill_credit_note'
  | 'purchase_order'
  | 'purchase_bill_domestic'
  | 'purchase_bill_foreign'
  | 'purchase_bill_prepaid'
  | 'purchase_bill_credit_note'
  | 'workorder'
  | 'transfer_order';

export interface DocumentProduct {
  mk_id?: string;
  count_code?: string;
  code?: string;
  name?: string;
  name_desc?: string;
  doc_desc?: string;
  unit?: string;
  service?: string;
  sales?: string;
  purchasing?: string;
  amount: string;
  price?: string;
  price_with_tax?: string;
  discount?: string;
  tax: string;
  tax_factor?: string;
  serial_number?: string;
  lot_number?: string;
  exp_date?: string;
  microlocation?: string;
}

export interface MarkPaid {
  payment_type: string;
  date: string;
  cashRegister?: string;
}

export interface OfferListItem {
  count_code: string;
}

export interface DocLink {
  mk_id: string;
  count_code: string;
  doc_type: DocumentType;
}

export interface ExtraColumn {
  name: string;
  value: string;
}

export interface MetaData {
  key: string;
  value_string: string;
}

export interface DocumentBase {
  mk_id?: string;
  doc_type: DocumentType;
  count_code?: string;
  doc_date: string;
  title?: string;
  partner?: Partner;
  receiver?: Partner;
  product_list: DocumentProduct[];
  notes?: string;
  notes_header?: string;
  warehouse?: string;
  currency_code?: string;
  discount_percent?: string;
  discount_value?: string;
  status_code?: string;
  status_desc?: string;
}

export interface SalesOrderDocument extends DocumentBase {
  doc_type: 'sales_order';
  sales_pricelist_code?: string;
  prepayment_percent?: string;
  prepayment_value?: string;
  pariteta?: string;
  doc_created_email?: string;
  commercialist_email?: string;
  parcel_shop_id?: string;
  profit_center?: string;
  offer_list?: OfferListItem[];
  delivery_deadline?: string;
  delivery_type?: string;
  priority?: string;
  finish_date?: string;
  buyer_order?: string;
  customer_order?: string;
  method_of_payment?: string;
  mark_paid?: MarkPaid[];
  link_to_web_store?: string;
  webshop_eshop_sync_id?: string;
  order_create_ts?: string;
  duo_payment?: string;
  duo_payment_days?: string;
  shipped_date?: string;
  shipped_date_expected_seller?: string;
  tracking_code?: string;
  tracking_url?: string;
  doc_link_list?: DocLink[];
  extra_column?: ExtraColumn[];
  meta_data?: MetaData[];
}

export interface SalesBillDocument extends DocumentBase {
  service_from_date?: string;
  service_to_date: string;
  duo_payment: string;
  sales_pricelist_code?: string;
  pariteta?: string;
  doc_created_email?: string;
  offer_list?: OfferListItem[];
  buyer_order?: string;
  delivery_type?: string;
  location_of_service?: string;
  mark_paid?: MarkPaid[];
  furs_zoi?: string;
  furs_eor?: string;
  profit_center?: string;
  profit_center_desc?: string;
  publish_ts?: string;
  last_change_user?: string;
}

export interface DocumentResponse extends MetakockaResponse {
  mk_id: string;
  count_code: string;
}

export interface GetDocumentResponse extends MetakockaResponse, DocumentBase {
  sum_basic?: string;
  sum_discount?: string;
  sum_tax_085?: string;
  sum_tax_200?: string;
  sum_tax_ex1?: string;
  sum_tax_ex2?: string;
  sum_tax_ex3?: string;
  sum_tax_ex4?: string;
  sum_prepayment?: string;
  sum_all?: string;
  sum_paid?: string;
}

// ============================================
// Warehouse Interfaces
// ============================================

export interface Warehouse {
  mk_id: string;
  mark: string;
  name: string;
  address?: string;
  post_number?: string;
  city?: string;
  country?: string;
}

export interface WarehouseListResponse extends MetakockaResponse {
  warehouse_list: Warehouse[];
}

export interface StockItem {
  warehouse_id: string;
  mk_id: string;
  count_code: string;
  code?: string;
  title: string;
  amount: string;
  reserved_amount?: string;
  free_amount?: string;
  microlocation?: string;
  serial_number?: string;
  lot_number?: string;
  exp_date?: string;
  unit: string;
}

export interface WarehouseStockResponse extends MetakockaPaginatedResponse {
  stock_list: StockItem[];
  stock_list_count?: string;
}

// ============================================
// Search Interfaces
// ============================================

export interface SearchQueryAdvance {
  type: string;
  value: string;
}

export interface SearchRequest extends MetakockaCredentials {
  doc_type: DocumentType;
  query?: string;
  query_advance?: SearchQueryAdvance[];
  offset?: string;
  limit?: string;
  result_type?: 'id' | 'doc';
  order_direction?: 'asc' | 'desc';
}

export interface SearchResultItem {
  mk_id: string;
  count_code: string;
  opr_code?: string;
}

export interface SearchResponse extends MetakockaPaginatedResponse {
  result_all_records: string;
  result_count: string;
  result: SearchResultItem[] | GetDocumentResponse[];
}

// ============================================
// Report Interfaces
// ============================================

export interface ReportRequest extends MetakockaCredentials {
  report_code: string;
  mk_id?: string;
  count_code?: string;
  doc_type?: DocumentType;
  report_format?: 'PDF' | 'HTML';
  return_file?: string;
}

export interface ReportResponse extends MetakockaResponse {
  report_content_base64?: string;
  report_url?: string;
}

export interface ReportAsyncRequest extends ReportRequest {
  async_call?: string;
}

export interface ReportAsyncResponse extends MetakockaResponse {
  async_id: string;
  async_status: 'pending' | 'processing' | 'finished' | 'error';
}

// ============================================
// Webhook Interfaces
// ============================================

export interface WebhookStockUpdate {
  opr_code: string;
  opr_time_ms: string;
  stock_list_count: string;
  stock_list: StockItem[];
}

export interface WebhookHeaders {
  'x-metakocka-event': string;
  'x-metakocka-id': string;
  'x-metakocka-signature': string;
}

// ============================================
// Complaint Interfaces
// ============================================

export interface ComplaintProduct {
  product_mk_id: string;
  product_code?: string;
  amount: string;
  price?: string;
  reason?: string;
  description?: string;
}

export interface CreateComplaintRequest extends MetakockaCredentials {
  sales_order_mk_id?: string;
  sales_order_count_code?: string;
  partner: Partner;
  product_list: ComplaintProduct[];
  claim_status?: string;
  claim_reason?: string;
  claim_description?: string;
  return_tracking_code?: string;
}

export interface ComplaintResponse extends MetakockaResponse {
  mk_id: string;
  count_code: string;
}

// ============================================
// Payment Interfaces
// ============================================

export interface TransactionRequest extends MetakockaCredentials {
  mk_id?: string;
  count_code?: string;
  buyer_order?: string;
  doc_type: DocumentType;
  payment_type: string;
  payment_date: string;
  amount: string;
}

// ============================================
// Bank Interfaces
// ============================================

export interface BankStatementRequest extends MetakockaCredentials {
  date_from?: string;
  date_to?: string;
  bank_account_id?: string;
}

export interface BankStatement {
  mk_id: string;
  bank_account_id: string;
  statement_number: string;
  statement_date: string;
  opening_balance: string;
  closing_balance: string;
  items: BankStatementItem[];
}

export interface BankStatementItem {
  mk_id: string;
  date: string;
  description: string;
  debit: string;
  credit: string;
  reference: string;
}

export interface BankStatementResponse extends MetakockaResponse {
  bank_statement_list: BankStatement[];
}

// ============================================
// Message Interfaces
// ============================================

export interface SendMessageRequest extends MetakockaCredentials {
  message_type: 'email' | 'sms';
  recipient: string;
  subject?: string;
  message: string;
  doc_type?: DocumentType;
  mk_id?: string;
}

export interface SendMessageResponse extends MetakockaResponse {
  message_id: string;
}

// ============================================
// Import/Inventory Interfaces
// ============================================

export interface InventoryItem {
  product_mk_id?: string;
  product_code?: string;
  warehouse_id: string;
  amount: string;
  serial_number?: string;
  lot_number?: string;
  exp_date?: string;
  microlocation?: string;
  purchase_price?: string;
}

export interface ImportInventoryRequest extends MetakockaCredentials {
  inventory_list: InventoryItem[];
  replace_inventory?: string;
}

export interface ImportInventoryResponse extends MetakockaResponse {
  imported_count: string;
  error_list?: string[];
}

// ============================================
// Attachment Interfaces
// ============================================

export interface AddAttachmentRequest extends MetakockaCredentials {
  doc_type: DocumentType;
  mk_id: string;
  file_name: string;
  file_content_base64: string;
}

export interface AddAttachmentResponse extends MetakockaResponse {
  attachment_id: string;
}

// ============================================
// Sticker/Label Interfaces
// ============================================

export interface GenerateStickerRequest extends MetakockaCredentials {
  sales_order_mk_id?: string;
  sales_order_count_code?: string;
  customer_order_list?: string[];
  delivery_service?: string;
}

export interface GenerateStickerResponse extends MetakockaResponse {
  sticker_code: string;
  sticker_content_base64?: string;
  tracking_code?: string;
}

// ============================================
// Document Status Interfaces
// ============================================

export interface ChangeDocumentStatusRequest extends MetakockaCredentials {
  doc_type: DocumentType;
  mk_id?: string;
  mk_id_list?: string[];
  count_code?: string;
  new_status: string;
}

export interface ChangeDocumentStatusResponse extends MetakockaResponse {
  updated_count: string;
}
