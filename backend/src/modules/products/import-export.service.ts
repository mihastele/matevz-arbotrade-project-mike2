import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip = require('adm-zip');
import { Product, ProductStatus } from './entities/product.entity';
import { ProductImage, MediaType } from './entities/product-image.entity';
import { Category } from '../categories/entities/category.entity';

// CSV column mapping from WooCommerce export to our schema
interface CsvRow {
  ID?: string;
  Vrsta?: string; // Type: simple, variable, etc.
  Šifra?: string; // SKU
  'GTIN, UPC, EAN ali ISBN'?: string;
  Naziv?: string; // Name
  Objavljeno?: string; // Published (1/0)
  'Je izpostavljen?'?: string; // Is featured (1/0)
  'Vidnost v katalogu'?: string; // Catalog visibility
  'Kratek opis'?: string; // Short description
  Opis?: string; // Description
  'Začetni datum akcijske cene'?: string;
  'Končni datum akcijske cene'?: string;
  'Stanje davka'?: string;
  'Na zalogi?'?: string;
  Zaloga?: string; // Stock
  'Nizka zaloga'?: string;
  'Dovoljena naročila brez zaloge?'?: string;
  'Teža (kg)'?: string;
  'Dolžina (cm)'?: string;
  'Širina (cm)'?: string;
  'Višina (cm)'?: string;
  'Akcijska cena'?: string; // Sale price
  'Redna cena'?: string; // Regular price
  Kategorije?: string; // Categories (path format: Parent > Child)
  Slike?: string; // Images (comma-separated URLs)
  Brands?: string;
  [key: string]: string | undefined;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; name?: string }>;
}

export interface ExportOptions {
  includeImages?: boolean;
  categoryIds?: string[];
}

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private imagesRepository: Repository<ProductImage>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    private dataSource: DataSource,
  ) {}

  // Parse CSV content to array of objects
  private parseCSV(content: string): CsvRow[] {
    const lines = content.split('\n');
    if (lines.length < 2) {
      throw new BadRequestException('CSV file is empty or has no data rows');
    }

    // Parse header - handle quoted fields
    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine);

    const rows: CsvRow[] = [];
    let currentLine = '';
    let inQuote = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle multi-line quoted fields
      for (const char of line) {
        if (char === '"') {
          inQuote = !inQuote;
        }
      }
      
      currentLine += (currentLine ? '\n' : '') + line;
      
      if (!inQuote) {
        if (currentLine.trim()) {
          const values = this.parseCSVLine(currentLine);
          const row: CsvRow = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          rows.push(row);
        }
        currentLine = '';
      }
    }

    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    result.push(current.trim());

    return result;
  }

  // Generate slug from name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Parse price from string (handles both dot and comma as decimal separator)
  private parsePrice(priceStr: string | undefined): number | null {
    if (!priceStr) return null;
    // Handle European format: 35,65 -> 35.65
    const cleaned = priceStr.replace(',', '.').replace(/[^\d.]/g, '');
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  // Parse stock quantity
  private parseStock(stockStr: string | undefined): number {
    if (!stockStr) return 0;
    const stock = parseInt(stockStr, 10);
    return isNaN(stock) ? 0 : stock;
  }

  // Parse boolean from various formats
  private parseBoolean(value: string | undefined): boolean {
    if (!value) return false;
    return value === '1' || value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
  }

  // Find or create category from path (e.g., "Parent > Child > Grandchild")
  private async findOrCreateCategory(categoryPath: string): Promise<Category | null> {
    if (!categoryPath || categoryPath.trim() === '') return null;

    // Split by > and trim each part
    const parts = categoryPath.split('>').map(p => p.trim()).filter(p => p);
    if (parts.length === 0) return null;

    let parent: Category | null = null;
    let category: Category | null = null;

    for (const name of parts) {
      // Look for existing category with this name and parent
      const whereClause: Record<string, unknown> = { name };
      if (parent?.id) {
        whereClause.parentId = parent.id;
      } else {
        whereClause.parentId = null;
      }

      category = await this.categoriesRepository.findOne({
        where: whereClause as any,
      });

      if (!category) {
        // Create the category
        const slug = this.generateSlug(name);
        const categoryData: Partial<Category> = {
          name,
          slug,
          isActive: true,
        };
        if (parent && parent.id) {
          categoryData.parentId = parent.id;
        }
        const newCategory = this.categoriesRepository.create(categoryData);
        category = await this.categoriesRepository.save(newCategory);
        this.logger.log(`Created category: ${name}`);
      }

      parent = category;
    }

    return category;
  }

  // Parse images from comma-separated URLs
  private parseImages(imagesStr: string | undefined, imageMap?: Map<string, string>): Array<{
    url: string;
    type: MediaType;
  }> {
    if (!imagesStr) return [];

    const images: Array<{ url: string; type: MediaType }> = [];
    const urls = imagesStr.split(',').map(url => url.trim()).filter(url => url);

    for (const url of urls) {
      // Check if we have a local image mapping (from ZIP import)
      const localPath = imageMap?.get(this.extractFilename(url));
      const finalUrl = localPath || url;

      images.push({
        url: finalUrl,
        type: MediaType.IMAGE,
      });
    }

    return images;
  }

  // Extract filename from URL
  private extractFilename(url: string): string {
    try {
      const urlObj = new URL(url);
      return path.basename(urlObj.pathname);
    } catch {
      return path.basename(url);
    }
  }

  // Parse video URLs from oembed metadata columns
  private parseVideoUrls(row: CsvRow): string[] {
    const videos: string[] = [];
    
    // Look for oembed columns that contain video embeds (YouTube, Vimeo, etc.)
    for (const [key, value] of Object.entries(row)) {
      if (key.startsWith('Meta: _oembed_') && value && !key.includes('time')) {
        // Check if it's an iframe embed (video)
        if (value.includes('<iframe') && (value.includes('youtube') || value.includes('vimeo'))) {
          // Extract src from iframe
          const srcMatch = value.match(/src=["']([^"']+)["']/);
          if (srcMatch && srcMatch[1]) {
            videos.push(srcMatch[1]);
          }
        }
      }
    }

    return videos;
  }

  // Import products from CSV
  async importFromCSV(
    csvContent: string,
    imageMap?: Map<string, string>,
  ): Promise<ImportResult> {
    const rows = this.parseCSV(csvContent);
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    this.logger.log(`Starting import of ${rows.length} products`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Account for header row and 0-index

      try {
        await this.importProduct(row, imageMap);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: error.message,
          name: row.Naziv,
        });
        this.logger.warn(`Failed to import row ${rowNumber}: ${error.message}`);
      }
    }

    this.logger.log(`Import completed: ${result.success} success, ${result.failed} failed`);
    return result;
  }

  // Import a single product from CSV row
  private async importProduct(row: CsvRow, imageMap?: Map<string, string>): Promise<Product> {
    const name = row.Naziv;
    if (!name) {
      throw new Error('Product name is required');
    }

    const price = this.parsePrice(row['Redna cena']);
    if (price === null) {
      throw new Error('Valid price is required');
    }

    // Check if product already exists by SKU
    let existingProduct: Product | null = null;
    if (row.Šifra) {
      existingProduct = await this.productsRepository.findOne({
        where: { sku: row.Šifra },
        relations: ['images'],
      });
    }

    // Find or create category
    let category: Category | null = null;
    if (row.Kategorije) {
      // Take the first category if multiple are provided
      const firstCategory = row.Kategorije.split(',')[0];
      category = await this.findOrCreateCategory(firstCategory);
    }

    // Parse images
    const images = this.parseImages(row.Slike, imageMap);

    // Parse video URLs from oembed metadata
    const videoUrls = this.parseVideoUrls(row);

    const productData: Partial<Product> = {
      name,
      slug: this.generateSlug(name),
      sku: row.Šifra || undefined,
      gtin: row['GTIN, UPC, EAN ali ISBN'] || undefined,
      shortDescription: row['Kratek opis'] || undefined,
      description: row.Opis || undefined,
      price,
      salePrice: this.parsePrice(row['Akcijska cena']) || undefined,
      weight: this.parsePrice(row['Teža (kg)']) || undefined,
      length: this.parsePrice(row['Dolžina (cm)']) || undefined,
      width: this.parsePrice(row['Širina (cm)']) || undefined,
      height: this.parsePrice(row['Višina (cm)']) || undefined,
      stock: this.parseStock(row.Zaloga),
      lowStockThreshold: this.parseStock(row['Nizka zaloga']),
      allowBackorder: row['Dovoljena naročila brez zaloge?'] === 'notify' || 
                      this.parseBoolean(row['Dovoljena naročila brez zaloge?']),
      status: this.parseBoolean(row.Objavljeno) ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
      isFeatured: this.parseBoolean(row['Je izpostavljen?']),
      categoryId: category?.id || undefined,
      brand: row.Brands || undefined,
      videoUrls: videoUrls.length > 0 ? videoUrls : undefined,
    };

    let product: Product;

    if (existingProduct) {
      // Update existing product
      Object.assign(existingProduct, productData);
      product = await this.productsRepository.save(existingProduct);

      // Update images if provided
      if (images.length > 0) {
        await this.imagesRepository.delete({ productId: product.id });
      }
    } else {
      // Create new product
      product = this.productsRepository.create(productData);
      product = await this.productsRepository.save(product);
    }

    // Create product images
    if (images.length > 0) {
      const productImages = images.map((img, index) =>
        this.imagesRepository.create({
          ...img,
          productId: product.id,
          sortOrder: index,
          isPrimary: index === 0,
        }),
      );
      await this.imagesRepository.save(productImages);
    }

    return product;
  }

  // Export products to CSV
  async exportToCSV(options?: ExportOptions): Promise<string> {
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category');

    if (options?.categoryIds && options.categoryIds.length > 0) {
      queryBuilder.andWhere('product.categoryId IN (:...categoryIds)', {
        categoryIds: options.categoryIds,
      });
    }

    queryBuilder.orderBy('product.createdAt', 'DESC');

    const products = await queryBuilder.getMany();

    // CSV headers matching our import format
    const headers = [
      'ID',
      'Šifra',
      'GTIN, UPC, EAN ali ISBN',
      'Naziv',
      'Objavljeno',
      'Je izpostavljen?',
      'Kratek opis',
      'Opis',
      'Zaloga',
      'Nizka zaloga',
      'Dovoljena naročila brez zaloge?',
      'Teža (kg)',
      'Dolžina (cm)',
      'Širina (cm)',
      'Višina (cm)',
      'Akcijska cena',
      'Redna cena',
      'Kategorije',
      'Slike',
      'Brands',
      'Video URLs',
    ];

    const rows: string[][] = [headers];

    for (const product of products) {
      const categoryPath = product.category ? await this.getCategoryPath(product.category) : '';
      const images = options?.includeImages !== false
        ? product.images?.map(img => img.url).join(', ')
        : '';

      rows.push([
        product.id,
        product.sku || '',
        product.gtin || '',
        product.name,
        product.status === ProductStatus.PUBLISHED ? '1' : '0',
        product.isFeatured ? '1' : '0',
        product.shortDescription || '',
        product.description || '',
        String(product.stock),
        String(product.lowStockThreshold),
        product.allowBackorder ? '1' : '0',
        product.weight?.toString() || '',
        product.length?.toString() || '',
        product.width?.toString() || '',
        product.height?.toString() || '',
        product.salePrice?.toString().replace('.', ',') || '',
        product.price.toString().replace('.', ','),
        categoryPath,
        images,
        product.brand || '',
        product.videoUrls?.join(', ') || '',
      ]);
    }

    // Convert to CSV string
    return rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = String(cell).replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
          return `"${escaped}"`;
        }
        return escaped;
      }).join(',')
    ).join('\n');
  }

  // Get full category path (Parent > Child > Grandchild)
  private async getCategoryPath(category: Category): Promise<string> {
    const path: string[] = [category.name];
    let current = category;

    while (current.parentId) {
      const parent = await this.categoriesRepository.findOne({
        where: { id: current.parentId },
      });
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }

    return path.join(' > ');
  }

  // Import from ZIP file containing images/ folder and products.csv
  async importFromZIP(zipPath: string, extractPath: string): Promise<ImportResult> {
    const zip = new AdmZip(zipPath);

    // Extract ZIP contents
    zip.extractAllTo(extractPath, true);

    // Find products.csv
    const csvPath = path.join(extractPath, 'products.csv');
    if (!fs.existsSync(csvPath)) {
      throw new BadRequestException('ZIP file must contain products.csv');
    }

    // Build image map from images/ folder
    const imageMap = new Map<string, string>();
    const imagesPath = path.join(extractPath, 'images');
    
    if (fs.existsSync(imagesPath)) {
      const imageFiles = fs.readdirSync(imagesPath);
      for (const file of imageFiles) {
        // Copy image to uploads folder and map filename to new path
        const srcPath = path.join(imagesPath, file);
        const destFilename = `${Date.now()}-${file}`;
        const destPath = path.join('./uploads', destFilename);
        
        fs.copyFileSync(srcPath, destPath);
        imageMap.set(file, `/uploads/${destFilename}`);
      }
      this.logger.log(`Mapped ${imageMap.size} images from ZIP`);
    }

    // Read and import CSV
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const result = await this.importFromCSV(csvContent, imageMap);

    // Clean up extracted files
    fs.rmSync(extractPath, { recursive: true, force: true });

    return result;
  }
}
