import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductsService } from './products.service';
import { ImportExportService } from './import-export.service';
import { ProductsController } from './products.controller';
import { CategoriesModule } from '../categories/categories.module';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, ProductVariant, Category]),
    CategoriesModule,
  ],
  providers: [ProductsService, ImportExportService],
  controllers: [ProductsController],
  exports: [ProductsService, ImportExportService],
})
export class ProductsModule {}
