import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ============================================
// Common DTOs
// ============================================

export class PartnerContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fax?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gsm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;
}

export class PartnerDto {
  @ApiProperty({ description: 'Is business entity' })
  @IsString()
  business_entity: string;

  @ApiPropertyOptional({ description: 'Is taxpayer' })
  @IsOptional()
  @IsString()
  taxpayer?: string;

  @ApiPropertyOptional({ description: 'Is from foreign country' })
  @IsOptional()
  @IsString()
  foreign_county?: string;

  @ApiPropertyOptional({ description: 'Tax ID number (e.g., SI12345678)' })
  @IsOptional()
  @IsString()
  tax_id_number?: string;

  @ApiProperty({ description: 'Customer/Company name' })
  @IsString()
  @IsNotEmpty()
  customer: string;

  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'Post/ZIP code' })
  @IsString()
  @IsNotEmpty()
  post_number: string;

  @ApiProperty({ description: 'City/Place' })
  @IsString()
  @IsNotEmpty()
  place: string;

  @ApiPropertyOptional({ description: 'Province/Region' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({ type: PartnerContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartnerContactDto)
  partner_contact?: PartnerContactDto;
}

export class DocumentProductDto {
  @ApiPropertyOptional({ description: 'MetaKocka ID' })
  @IsOptional()
  @IsString()
  mk_id?: string;

  @ApiPropertyOptional({ description: 'Product count code (internal ID)' })
  @IsOptional()
  @IsString()
  count_code?: string;

  @ApiPropertyOptional({ description: 'Product code/SKU' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Product name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  name_desc?: string;

  @ApiPropertyOptional({ description: 'Description on document' })
  @IsOptional()
  @IsString()
  doc_desc?: string;

  @ApiPropertyOptional({ description: 'Unit of measure' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ description: 'Amount/Quantity' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiPropertyOptional({ description: 'Price without tax' })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({ description: 'Price with tax' })
  @IsOptional()
  @IsString()
  price_with_tax?: string;

  @ApiPropertyOptional({ description: 'Discount (can be multiple: "10;5")' })
  @IsOptional()
  @IsString()
  discount?: string;

  @ApiProperty({ description: 'Tax code (e.g., EX4, 085, 200)' })
  @IsString()
  @IsNotEmpty()
  tax: string;

  @ApiPropertyOptional({ description: 'Tax factor (e.g., 0.22 for 22%)' })
  @IsOptional()
  @IsString()
  tax_factor?: string;

  @ApiPropertyOptional({ description: 'Serial number' })
  @IsOptional()
  @IsString()
  serial_number?: string;

  @ApiPropertyOptional({ description: 'Lot/Batch number' })
  @IsOptional()
  @IsString()
  lot_number?: string;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsOptional()
  @IsString()
  exp_date?: string;

  @ApiPropertyOptional({ description: 'Microlocation' })
  @IsOptional()
  @IsString()
  microlocation?: string;
}

export class MarkPaidDto {
  @ApiProperty({ description: 'Payment type (e.g., PayPal, Cash, Bank)' })
  @IsString()
  @IsNotEmpty()
  payment_type: string;

  @ApiProperty({ description: 'Payment date (DD.MM.YYYY)' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Cash register name' })
  @IsOptional()
  @IsString()
  cashRegister?: string;
}

// ============================================
// Product DTOs
// ============================================

export class ProductListQueryDto {
  @ApiPropertyOptional({ description: 'Product count code' })
  @IsOptional()
  @IsString()
  count_code?: string;

  @ApiPropertyOptional({ description: 'Product code/SKU' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Filter by sales flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  sales?: boolean;

  @ApiPropertyOptional({ description: 'Filter by purchasing flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  purchase?: boolean;

  @ApiPropertyOptional({ description: 'Filter by service flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  service?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Filter by work flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  work?: boolean;

  @ApiPropertyOptional({ description: 'Filter by e-shop sync flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  eshop_sync?: boolean;

  @ApiPropertyOptional({ description: 'Include warehouse stock amounts' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  return_warehause_stock?: boolean;

  @ApiPropertyOptional({ description: 'Include free amount (stock - reservations)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  return_free_amount?: boolean;

  @ApiPropertyOptional({ description: 'Include warehouse reservation details' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  return_warehouse_reservation?: boolean;

  @ApiPropertyOptional({ description: 'Include product partner info' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  return_product_partner_info?: boolean;

  @ApiPropertyOptional({ description: 'Include expected order delivery date' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  return_expect_order_delivery_date?: boolean;

  @ApiPropertyOptional({ description: 'Include pricelist data' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  return_pricelist?: boolean;

  @ApiPropertyOptional({ description: 'Include compound/norm structure' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  return_product_compound?: boolean;

  @ApiPropertyOptional({ description: 'Include category tree' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  return_category?: boolean;

  @ApiPropertyOptional({ description: 'Include web shop link data' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  return_web_shop_link?: boolean;

  @ApiPropertyOptional({ description: 'Show tax factor in pricelist' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_tax_factor?: boolean;

  @ApiPropertyOptional({ description: 'Filter by category name' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ description: 'Limit for pagination (max 1000)', default: 1000 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;
}

export class CreateMetakockaProductDto {
  @ApiPropertyOptional({ description: 'Product count code (auto-generated if empty)' })
  @IsOptional()
  @IsString()
  count_code?: string;

  @ApiPropertyOptional({ description: 'Product code/SKU' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Barcode' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  name_desc?: string;

  @ApiProperty({ description: 'Unit of measure (e.g., kos, m2, kg)' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({ description: 'Is service (default: false)' })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({ description: 'Is sales product (default: false)' })
  @IsOptional()
  @IsString()
  sales?: string;

  @ApiPropertyOptional({ description: 'Is purchasing product (default: false)' })
  @IsOptional()
  @IsString()
  purchasing?: string;

  @ApiPropertyOptional({ description: 'Height' })
  @IsOptional()
  @IsString()
  height?: string;

  @ApiPropertyOptional({ description: 'Width' })
  @IsOptional()
  @IsString()
  width?: string;

  @ApiPropertyOptional({ description: 'Depth' })
  @IsOptional()
  @IsString()
  depth?: string;

  @ApiPropertyOptional({ description: 'Weight' })
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiPropertyOptional({ description: 'Customs fee code' })
  @IsOptional()
  @IsString()
  customs_fee?: string;

  @ApiPropertyOptional({ description: 'Country of origin' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Minimal order quantity' })
  @IsOptional()
  @IsString()
  minimal_order_quantity?: string;
}

export class UpdateMetakockaProductDto extends CreateMetakockaProductDto {
  @ApiPropertyOptional({ description: 'MetaKocka ID (required if count_code not provided)' })
  @IsOptional()
  @IsString()
  mk_id?: string;

  @ApiPropertyOptional({ description: 'Is product activated' })
  @IsOptional()
  @IsString()
  activated?: string;
}

// ============================================
// Sales Order DTOs
// ============================================

export class OfferListItemDto {
  @ApiProperty({ description: 'Offer count code' })
  @IsString()
  @IsNotEmpty()
  count_code: string;
}

export class CreateSalesOrderDto {
  @ApiPropertyOptional({ description: 'Document count code' })
  @IsOptional()
  @IsString()
  count_code?: string;

  @ApiProperty({ description: 'Document date (YYYY-MM-DD+HH:MM)' })
  @IsString()
  @IsNotEmpty()
  doc_date: string;

  @ApiPropertyOptional({ description: 'Document title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ type: PartnerDto, description: 'Partner (buyer) information' })
  @ValidateNested()
  @Type(() => PartnerDto)
  partner: PartnerDto;

  @ApiPropertyOptional({ type: PartnerDto, description: 'Receiver information (if different from partner)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartnerDto)
  receiver?: PartnerDto;

  @ApiProperty({ type: [DocumentProductDto], description: 'Product list' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentProductDto)
  product_list: DocumentProductDto[];

  @ApiPropertyOptional({ type: [OfferListItemDto], description: 'Linked offers' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfferListItemDto)
  offer_list?: OfferListItemDto[];

  @ApiPropertyOptional({ description: 'Sales pricelist code' })
  @IsOptional()
  @IsString()
  sales_pricelist_code?: string;

  @ApiPropertyOptional({ description: 'Prepayment percentage' })
  @IsOptional()
  @IsString()
  prepayment_percent?: string;

  @ApiPropertyOptional({ description: 'Prepayment value' })
  @IsOptional()
  @IsString()
  prepayment_value?: string;

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsString()
  discount_percent?: string;

  @ApiPropertyOptional({ description: 'Discount value' })
  @IsOptional()
  @IsString()
  discount_value?: string;

  @ApiPropertyOptional({ description: 'Currency code (e.g., EUR, USD)' })
  @IsOptional()
  @IsString()
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Status code' })
  @IsOptional()
  @IsString()
  status_code?: string;

  @ApiPropertyOptional({ description: 'Warehouse mark' })
  @IsOptional()
  @IsString()
  warehouse?: string;

  @ApiPropertyOptional({ description: 'Delivery type' })
  @IsOptional()
  @IsString()
  delivery_type?: string;

  @ApiPropertyOptional({ description: 'Delivery deadline (YYYY-MM-DD+HH:MM)' })
  @IsOptional()
  @IsString()
  delivery_deadline?: string;

  @ApiPropertyOptional({ description: 'Priority (e.g., 1-Nizka, 2-Srednja, 3-Visoka)' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Buyer order reference' })
  @IsOptional()
  @IsString()
  buyer_order?: string;

  @ApiPropertyOptional({ description: 'Customer order reference' })
  @IsOptional()
  @IsString()
  customer_order?: string;

  @ApiPropertyOptional({ description: 'Notes (bottom of document)' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Notes header (top of document)' })
  @IsOptional()
  @IsString()
  notes_header?: string;

  @ApiPropertyOptional({ description: 'Method of payment' })
  @IsOptional()
  @IsString()
  method_of_payment?: string;

  @ApiPropertyOptional({ description: 'Profit center' })
  @IsOptional()
  @IsString()
  profit_center?: string;

  @ApiPropertyOptional({ description: 'Parcel shop ID' })
  @IsOptional()
  @IsString()
  parcel_shop_id?: string;

  @ApiPropertyOptional({ description: 'Document created email' })
  @IsOptional()
  @IsString()
  doc_created_email?: string;

  @ApiPropertyOptional({ description: 'Commercialist email' })
  @IsOptional()
  @IsString()
  commercialist_email?: string;

  @ApiPropertyOptional({ description: 'Incoterms (delivery terms)' })
  @IsOptional()
  @IsString()
  pariteta?: string;

  @ApiPropertyOptional({ description: 'Finish date (YYYY-MM-DD+HH:MM)' })
  @IsOptional()
  @IsString()
  finish_date?: string;

  @ApiPropertyOptional({ description: 'Order creation timestamp (ISO 8601)' })
  @IsOptional()
  @IsString()
  order_create_ts?: string;

  @ApiPropertyOptional({ description: 'Link to web store' })
  @IsOptional()
  @IsString()
  link_to_web_store?: string;

  @ApiPropertyOptional({ description: 'Webshop eshop sync ID' })
  @IsOptional()
  @IsString()
  webshop_eshop_sync_id?: string;

  @ApiPropertyOptional({ type: [MarkPaidDto], description: 'Payment information' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkPaidDto)
  mark_paid?: MarkPaidDto[];

  @ApiPropertyOptional({ description: 'Payment due date (YYYY-MM-DD+HH:MM)' })
  @IsOptional()
  @IsString()
  duo_payment?: string;

  @ApiPropertyOptional({ description: 'Payment due days' })
  @IsOptional()
  @IsString()
  duo_payment_days?: string;
}

export class UpdateSalesOrderDto extends CreateSalesOrderDto {
  @ApiProperty({ description: 'MetaKocka ID of the document to update' })
  @IsString()
  @IsNotEmpty()
  mk_id: string;
}

// ============================================
// Search DTOs
// ============================================

export class SearchQueryAdvanceDto {
  @ApiProperty({ description: 'Query type (e.g., doc_date_from, status_list, partner_tax_num)' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Query value' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class SearchDocumentsDto {
  @ApiProperty({
    description: 'Document type',
    enum: [
      'sales_order', 'sales_offer', 'sales_bill_domestic', 'sales_bill_foreign',
      'sales_bill_retail', 'sales_bill_prepaid', 'sales_bill_credit_note',
      'purchase_order', 'purchase_bill_domestic', 'purchase_bill_foreign',
      'warehouse_delivery_note', 'warehouse_packing_list',
      'warehouse_receiving_note', 'warehouse_acceptance_note',
      'workorder', 'transfer_order',
    ],
  })
  @IsString()
  @IsNotEmpty()
  doc_type: string;

  @ApiPropertyOptional({ description: 'Simple text query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ type: [SearchQueryAdvanceDto], description: 'Advanced query filters' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchQueryAdvanceDto)
  query_advance?: SearchQueryAdvanceDto[];

  @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ description: 'Limit for pagination (max 100)', default: 100 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Result type',
    enum: ['id', 'doc'],
    default: 'doc',
  })
  @IsOptional()
  @IsEnum(['id', 'doc'])
  result_type?: 'id' | 'doc';

  @ApiPropertyOptional({
    description: 'Order direction',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order_direction?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Show product details' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_product_detail?: boolean;

  @ApiPropertyOptional({ description: 'Show tax factor' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_tax_factor?: boolean;

  @ApiPropertyOptional({ description: 'Show delivery service events' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_delivery_service_events?: boolean;

  @ApiPropertyOptional({ description: 'Show sticker list' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_sticker_list?: boolean;

  @ApiPropertyOptional({ description: 'Show tracking URL' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_tracking_url?: boolean;

  @ApiPropertyOptional({ description: 'Show status code' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_status_code?: boolean;
}

// ============================================
// Warehouse DTOs
// ============================================

export class WarehouseStockQueryDto {
  @ApiPropertyOptional({ description: 'Warehouse IDs (comma-separated)' })
  @IsOptional()
  @IsString()
  wh_id_list?: string;

  @ApiPropertyOptional({ description: 'Product codes (comma-separated)' })
  @IsOptional()
  @IsString()
  product_code_list?: string;

  @ApiPropertyOptional({ description: 'Product MK IDs (comma-separated)' })
  @IsOptional()
  @IsString()
  product_mk_id_list?: string;

  @ApiPropertyOptional({ description: 'Filter by e-shop sync flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  eshop_sync?: boolean;

  @ApiPropertyOptional({ description: 'Include expected order delivery dates' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  return_expect_order_delivery_date?: boolean;

  @ApiPropertyOptional({ description: 'Return products currently out of stock with reservations' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  return_reservation_without_amount?: boolean;

  @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ description: 'Limit for pagination (max 1000)', default: 1000 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;
}

export class ImportInventoryItemDto {
  @ApiPropertyOptional({ description: 'Product MK ID' })
  @IsOptional()
  @IsString()
  product_mk_id?: string;

  @ApiPropertyOptional({ description: 'Product code' })
  @IsOptional()
  @IsString()
  product_code?: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsString()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ description: 'Amount' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiPropertyOptional({ description: 'Serial number' })
  @IsOptional()
  @IsString()
  serial_number?: string;

  @ApiPropertyOptional({ description: 'Lot number' })
  @IsOptional()
  @IsString()
  lot_number?: string;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsOptional()
  @IsString()
  exp_date?: string;

  @ApiPropertyOptional({ description: 'Microlocation' })
  @IsOptional()
  @IsString()
  microlocation?: string;

  @ApiPropertyOptional({ description: 'Purchase price' })
  @IsOptional()
  @IsString()
  purchase_price?: string;
}

export class ImportInventoryDto {
  @ApiProperty({ type: [ImportInventoryItemDto], description: 'Inventory items to import' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportInventoryItemDto)
  inventory_list: ImportInventoryItemDto[];

  @ApiPropertyOptional({ description: 'Replace existing inventory', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  replace_inventory?: boolean;
}

// ============================================
// Partner DTOs
// ============================================

export class GetPartnersQueryDto {
  @ApiPropertyOptional({ description: 'Partner MK ID' })
  @IsOptional()
  @IsString()
  partner_id?: string;

  @ApiPropertyOptional({ description: 'Partner name' })
  @IsOptional()
  @IsString()
  partner_name?: string;

  @ApiPropertyOptional({ description: 'Partner tax number' })
  @IsOptional()
  @IsString()
  partner_tax_number?: string;

  @ApiPropertyOptional({ description: 'Partner email' })
  @IsOptional()
  @IsString()
  partner_email?: string;

  @ApiPropertyOptional({ description: 'Partner phone number' })
  @IsOptional()
  @IsString()
  partner_phone_number?: string;

  @ApiPropertyOptional({ description: 'Include partner discounts' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_partner_discount?: boolean;
}

export class CreatePartnerDto {
  @ApiProperty({ description: 'Is business entity' })
  @IsString()
  @IsNotEmpty()
  business_entity: string;

  @ApiPropertyOptional({ description: 'Is taxpayer' })
  @IsOptional()
  @IsString()
  taxpayer?: string;

  @ApiPropertyOptional({ description: 'Is buyer' })
  @IsOptional()
  @IsString()
  buyer?: string;

  @ApiPropertyOptional({ description: 'Is supplier' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({ description: 'Is from foreign country' })
  @IsOptional()
  @IsString()
  foreign_county?: string;

  @ApiPropertyOptional({ description: 'Tax ID number' })
  @IsOptional()
  @IsString()
  tax_id_number?: string;

  @ApiPropertyOptional({ description: 'Registration number' })
  @IsOptional()
  @IsString()
  registration_number?: string;

  @ApiProperty({ description: 'Customer/Company name' })
  @IsString()
  @IsNotEmpty()
  customer: string;

  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'Post/ZIP code' })
  @IsString()
  @IsNotEmpty()
  post_number: string;

  @ApiProperty({ description: 'City/Place' })
  @IsString()
  @IsNotEmpty()
  place: string;

  @ApiPropertyOptional({ description: 'Province/Region' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional({ type: PartnerContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartnerContactDto)
  partner_contact?: PartnerContactDto;
}

// ============================================
// Report DTOs
// ============================================

export class GenerateReportDto {
  @ApiProperty({ description: 'Document type' })
  @IsString()
  @IsNotEmpty()
  doc_type: string;

  @ApiPropertyOptional({ description: 'Document MK ID' })
  @IsOptional()
  @IsString()
  mk_id?: string;

  @ApiPropertyOptional({ description: 'Document count code' })
  @IsOptional()
  @IsString()
  count_code?: string;

  @ApiPropertyOptional({ description: 'Report code' })
  @IsOptional()
  @IsString()
  report_code?: string;

  @ApiPropertyOptional({ description: 'Report format', enum: ['PDF', 'HTML'], default: 'PDF' })
  @IsOptional()
  @IsEnum(['PDF', 'HTML'])
  report_format?: 'PDF' | 'HTML';

  @ApiPropertyOptional({ description: 'Return file content', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  return_file?: boolean;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Message type', enum: ['email', 'sms'] })
  @IsEnum(['email', 'sms'])
  message_type: 'email' | 'sms';

  @ApiProperty({ description: 'Recipient (email or phone number)' })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiPropertyOptional({ description: 'Email subject (required for email)' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Related document type' })
  @IsOptional()
  @IsString()
  doc_type?: string;

  @ApiPropertyOptional({ description: 'Related document MK ID' })
  @IsOptional()
  @IsString()
  mk_id?: string;
}
