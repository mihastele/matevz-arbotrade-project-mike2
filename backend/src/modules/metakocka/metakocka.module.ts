import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MetakockaService } from './metakocka.service';
import { MetakockaController } from './metakocka.controller';
import { MetakockaProductService } from './services/metakocka-product.service';
import { MetakockaDocumentService } from './services/metakocka-document.service';
import { MetakockaPartnerService } from './services/metakocka-partner.service';
import { MetakockaWarehouseService } from './services/metakocka-warehouse.service';
import { MetakockaSearchService } from './services/metakocka-search.service';
import { MetakockaReportService } from './services/metakocka-report.service';
import { MetakockaWebhookController } from './metakocka-webhook.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [MetakockaController, MetakockaWebhookController],
  providers: [
    MetakockaService,
    MetakockaProductService,
    MetakockaDocumentService,
    MetakockaPartnerService,
    MetakockaWarehouseService,
    MetakockaSearchService,
    MetakockaReportService,
  ],
  exports: [
    MetakockaService,
    MetakockaProductService,
    MetakockaDocumentService,
    MetakockaPartnerService,
    MetakockaWarehouseService,
    MetakockaSearchService,
    MetakockaReportService,
  ],
})
export class MetakockaModule {}
