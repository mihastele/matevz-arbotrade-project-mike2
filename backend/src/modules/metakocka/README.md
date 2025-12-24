# MetaKocka Integration Module

This module provides a complete integration with the MetaKocka ERP system REST API.

## Installation

Install required dependencies:

```bash
cd backend
npm install @nestjs/axios axios
```

## Configuration

Add the following environment variables to your `.env` file:

```env
# MetaKocka API Configuration
METAKOCKA_SECRET_KEY=your_secret_key_here
METAKOCKA_COMPANY_ID=your_company_id_here
METAKOCKA_ENV=development  # or 'production'
```

### Getting Credentials

1. Log in to MetaKocka
2. Navigate to: **Settings** → **API/Web hooks** → **Access keys**
3. Copy the `secret_key` and `company_id`

## Module Structure

```
src/modules/metakocka/
├── metakocka.module.ts           # Module definition
├── metakocka.controller.ts       # REST API endpoints
├── metakocka-webhook.controller.ts # Webhook handlers
├── metakocka.service.ts          # Base API service
├── interfaces/
│   ├── index.ts
│   └── metakocka.interfaces.ts   # TypeScript interfaces
├── services/
│   ├── index.ts
│   ├── metakocka-product.service.ts    # Product operations
│   ├── metakocka-document.service.ts   # Document operations
│   ├── metakocka-partner.service.ts    # Partner operations
│   ├── metakocka-warehouse.service.ts  # Warehouse/stock
│   ├── metakocka-search.service.ts     # Search operations
│   └── metakocka-report.service.ts     # Reports/messaging
└── dto/
    ├── index.ts
    └── metakocka.dto.ts          # Request/Response DTOs
```

## API Endpoints

All endpoints require JWT authentication (Bearer token).

### Connection Test

```
GET /metakocka/test
```

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metakocka/products` | List products with pagination |
| GET | `/metakocka/products/:identifier` | Get product by code |
| POST | `/metakocka/products` | Create new product |
| PUT | `/metakocka/products` | Update product |
| DELETE | `/metakocka/products/:mkId` | Delete product |

### Sales Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/metakocka/sales-orders` | Create sales order |
| GET | `/metakocka/sales-orders/:identifier` | Get sales order |
| PUT | `/metakocka/sales-orders` | Update sales order |
| DELETE | `/metakocka/sales-orders/:mkId` | Delete sales order |

### Sales Bills (Invoices)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/metakocka/sales-bills?type=domestic` | Create invoice |
| GET | `/metakocka/sales-bills/:identifier?type=domestic` | Get invoice |

Types: `domestic`, `foreign`, `retail`, `prepaid`, `credit_note`

### Warehouse Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/metakocka/warehouse-docs?type=delivery_note` | Create warehouse doc |
| GET | `/metakocka/warehouse-docs/:mkId?type=delivery_note` | Get warehouse doc |

Types: `delivery_note`, `packing_list`, `receiving_note`, `acceptance_note`

### Warehouses & Stock

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metakocka/warehouses` | List warehouses |
| GET | `/metakocka/stock` | Get stock data |
| GET | `/metakocka/stock/:productCode` | Get product stock |
| POST | `/metakocka/inventory/import` | Import inventory |

### Partners

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metakocka/partners` | Search partners |
| GET | `/metakocka/partners/:partnerId` | Get partner |
| POST | `/metakocka/partners` | Create partner |
| PUT | `/metakocka/partners/:partnerId` | Update partner |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/metakocka/search` | Advanced document search |
| GET | `/metakocka/search/sales-orders/status/:status` | Search by status |
| GET | `/metakocka/search/invoices/unpaid` | Search unpaid invoices |
| GET | `/metakocka/search/tracking/:code` | Search by tracking code |

### Reports & Messaging

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/metakocka/reports/generate` | Generate PDF/HTML report |
| POST | `/metakocka/reports/generate-async` | Generate async report |
| GET | `/metakocka/reports/async-status/:asyncId` | Get async status |
| POST | `/metakocka/messages/send` | Send email/SMS |
| POST | `/metakocka/stickers/generate` | Generate shipping label |
| POST | `/metakocka/orders/mark-shipped` | Mark orders as shipped |

### Complaints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/metakocka/complaints` | Create complaint |
| GET | `/metakocka/complaints/:mkId` | Get complaint |
| PUT | `/metakocka/complaints/:mkId` | Update complaint |

### Bank & Cash Register

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metakocka/bank/statements` | Get bank statements |
| GET | `/metakocka/bank/statement-status` | Get bank account status |
| GET | `/metakocka/cash-register/journal` | Get cash register journal |

### Document Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/metakocka/documents/status` | Change document status |
| POST | `/metakocka/payments` | Add payment to document |
| POST | `/metakocka/attachments` | Add attachment |

## Webhooks

Configure webhook URL in MetaKocka: **Settings** → **API/Web hooks**

```
POST https://your-domain.com/api/metakocka/webhook
POST https://your-domain.com/api/metakocka/webhook/stock
POST https://your-domain.com/api/metakocka/webhook/documents
```

### Security

Webhooks are verified using HMAC-SHA256 signature sent in `X-MetaKocka-Signature` header.

### Supported Events

- `warehouse_product_stock_update` - Stock level changed
- `document_created` - New document created
- `document_updated` - Document updated
- `document_status_changed` - Document status changed
- `partner_created` - New partner created
- `partner_updated` - Partner updated

## Usage Examples

### Inject Services

```typescript
import { Injectable } from '@nestjs/common';
import { 
  MetakockaProductService,
  MetakockaDocumentService,
} from './modules/metakocka/services';

@Injectable()
export class YourService {
  constructor(
    private productService: MetakockaProductService,
    private documentService: MetakockaDocumentService,
  ) {}

  async syncProducts() {
    const products = await this.productService.getAllProducts();
    // Process products...
  }

  async createOrder(orderData: any) {
    const result = await this.documentService.createSalesOrder({
      doc_type: 'sales_order',
      count_code: 'SO-001',
      doc_date: new Date().toISOString().split('T')[0],
      partner: {
        business_entity: 'false',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
      product_list: [
        {
          code: 'PROD001',
          amount: '2',
          price: '99.99',
        },
      ],
    });
    return result;
  }
}
```

### Search Documents

```typescript
// Search sales orders by status
const pendingOrders = await this.searchService.searchSalesOrdersByStatus('draft', {
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  limit: 100,
  resultType: 'doc',
});

// Search by advanced query
const results = await this.searchService.search({
  doc_type: 'sales_order',
  query: 'john@example.com',
  query_advance: "buyer_order = 'ORDER123' AND doc_date >= '2024-01-01'",
  limit: 50,
  result_type: 'doc',
});
```

### Handle Webhooks

Implement your business logic in `metakocka-webhook.controller.ts`:

```typescript
private async handleStockUpdate(payload: WebhookStockUpdatePayload): Promise<void> {
  const { data } = payload;
  
  // Update local cache
  await this.cacheService.set(
    `stock:${data.product_code}`,
    parseFloat(data.quantity_after),
  );
  
  // Check low stock threshold
  if (parseFloat(data.quantity_after) < 10) {
    await this.notificationService.sendLowStockAlert(data.product_code);
  }
  
  // Notify frontend via WebSocket
  this.websocketGateway.broadcast('stock-update', {
    productCode: data.product_code,
    quantity: data.quantity_after,
  });
}
```

## Document Types Reference

### Sales Documents
- `sales_order` - Sales Order (Prodajno naročilo)
- `sales_offer` - Sales Offer (Prodajna ponudba)
- `sales_bill_domestic` - Domestic Invoice (Domači račun)
- `sales_bill_foreign` - Foreign Invoice (Tuji račun)
- `sales_bill_retail` - Retail Invoice (Maloprodajni račun)
- `sales_bill_prepaid` - Prepaid Invoice (Predračun)
- `sales_bill_credit_note` - Credit Note (Dobropis)

### Purchase Documents
- `purchase_order` - Purchase Order (Nabavno naročilo)
- `purchase_bill_domestic` - Domestic Purchase Invoice
- `purchase_bill_foreign` - Foreign Purchase Invoice
- `purchase_bill_credit_note` - Purchase Credit Note

### Warehouse Documents
- `warehouse_delivery_note` - Delivery Note (Dobavnica)
- `warehouse_packing_list` - Packing List (Odpremnica)
- `warehouse_receiving_note` - Receiving Note (Prevzemnica)
- `warehouse_acceptance_note` - Acceptance Note (Prejemnica)
- `transfer_order` - Transfer Order (Prenosnica)

### Other Documents
- `workorder` - Work Order (Delovni nalog)

## Order Status Codes

| Code | Description |
|------|-------------|
| `draft` | Draft |
| `ready_to_ship` | Ready to ship |
| `shipped` | Shipped |
| `partially_delivered` | Partially delivered |
| `delivered` | Delivered |
| `cancelled` | Cancelled |

## Error Handling

All services throw descriptive errors. Handle them appropriately:

```typescript
try {
  const result = await this.productService.addProduct(productData);
} catch (error) {
  if (error.message.includes('Product with this code already exists')) {
    // Handle duplicate
  }
  throw error;
}
```

## Rate Limiting

MetaKocka API has rate limits. The HttpModule is configured with:
- Timeout: 30 seconds
- Max redirects: 5

For bulk operations, implement batching:

```typescript
async processProductsInBatches(products: any[], batchSize = 50) {
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    await Promise.all(batch.map(p => this.productService.addProduct(p)));
    await this.delay(1000); // Wait between batches
  }
}
```

## Official Documentation

- API Documentation: https://github.com/metakocka/metakocka_api_base
- See `metakocka/docs/` folder for detailed endpoint documentation

## Support

For MetaKocka API issues, contact: podpora@metakocka.si
