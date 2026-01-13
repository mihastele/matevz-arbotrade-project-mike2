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

// CSV V2 column mapping for new import format (v0.1.csv)
interface CsvRowV2 {
  SKU: string;
  BRAND: string;
  'IME PRODUKTA': string;
  KATEGORIJA: string;
  PODKATEGORIJA: string;
  PODPODKATEGORIJA: string;
  'KRATEK OPIS': string;
  'DOLGI OPIS': string;
  CENA: string;
  SLIKE: string;
  URL: string;
  [key: string]: string | undefined;
}

// Skyman CSV row mapping for image lookup
interface SkymanCsvRow {
  sku: string;
  image_paths: string;
  main_image_path: string;
  [key: string]: string | undefined;
}

// V3 Import result (local images)
export interface ImportResultV3 {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; name?: string }>;
  imagesImported: number;
  imagesFailed: number;
  message?: string;
}

// Image download queue item
interface ImageDownloadTask {
  productId: string;
  imageUrls: string[];
}

// V2 Import result with pending images tracking
export interface ImportResultV2 {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; name?: string }>;
  pendingImages: number;
  message?: string;
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
  ) { }

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

  // ============================================
  // CSV V2 Import (New format with 3-level categories)
  // ============================================

  // Image download queue for lazy loading
  private imageDownloadQueue: ImageDownloadTask[] = [];
  private isProcessingImages = false;
  private readonly IMAGE_DOWNLOAD_DELAY_MS = 500;

  // Category cache to avoid duplicate queries
  private categoryCache = new Map<string, Category>();

  // Parse CSV V2 content to array of objects
  private parseCSVv2(content: string): CsvRowV2[] {
    const lines = content.split('\n');
    if (lines.length < 2) {
      throw new BadRequestException('CSV file is empty or has no data rows');
    }

    // Parse header - handle quoted fields
    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine);

    const rows: CsvRowV2[] = [];
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
          const row: CsvRowV2 = {} as CsvRowV2;
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

  // Find or create category with caching for V2 format
  private async findOrCreateCategoryV2(
    categoryName: string | undefined,
    subcategoryName: string | undefined,
    subsubcategoryName: string | undefined,
  ): Promise<Category | null> {
    // Build the hierarchy parts
    const parts = [categoryName, subcategoryName, subsubcategoryName]
      .filter((p) => p && p.trim() !== '')
      .map((p) => p!.trim());

    if (parts.length === 0) return null;

    // Create a cache key for this full path
    const cacheKey = parts.join(' > ');
    if (this.categoryCache.has(cacheKey)) {
      return this.categoryCache.get(cacheKey)!;
    }

    let parent: Category | null = null;
    let category: Category | null = null;
    let currentPath = '';

    for (const name of parts) {
      currentPath += (currentPath ? ' > ' : '') + name;

      // Check cache first
      if (this.categoryCache.has(currentPath)) {
        category = this.categoryCache.get(currentPath)!;
        parent = category;
        continue;
      }

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
        // Check if slug already exists and make unique
        let slug = this.generateSlug(name);
        const existingSlug = await this.categoriesRepository.findOne({
          where: { slug },
        });
        if (existingSlug) {
          slug = `${slug}-${Date.now()}`;
        }

        // Create the category
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
        this.logger.log(`Created category: ${currentPath}`);
      }

      // Cache the category
      this.categoryCache.set(currentPath, category);
      parent = category;
    }

    return category;
  }

  // Parse image URLs from V2 format (comma-separated, may have extra spaces)
  private parseImageUrlsV2(imagesStr: string | undefined): string[] {
    if (!imagesStr) return [];

    return imagesStr
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url && url.startsWith('http'));
  }

  // Import products from CSV V2 format
  async importFromCSVv2(csvContent: string): Promise<ImportResultV2> {
    const rows = this.parseCSVv2(csvContent);
    const result: ImportResultV2 = {
      success: 0,
      failed: 0,
      errors: [],
      pendingImages: 0,
    };

    this.logger.log(`Starting V2 import of ${rows.length} products`);

    // Clear category cache for fresh import
    this.categoryCache.clear();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Account for header row and 0-index

      try {
        const productId = await this.importProductV2(row);

        // Queue images for lazy download if present
        const imageUrls = this.parseImageUrlsV2(row.SLIKE);
        if (imageUrls.length > 0) {
          this.imageDownloadQueue.push({ productId, imageUrls });
          result.pendingImages += imageUrls.length;
        }

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: error.message,
          name: row['IME PRODUKTA'],
        });
        this.logger.warn(`Failed to import row ${rowNumber}: ${error.message}`);
      }
    }

    this.logger.log(
      `V2 Import completed: ${result.success} success, ${result.failed} failed, ${result.pendingImages} images queued`,
    );

    // Start async image download process
    if (this.imageDownloadQueue.length > 0) {
      this.processImageDownloadQueue();
      result.message = `Products imported. ${result.pendingImages} images are being downloaded in the background.`;
    }

    return result;
  }

  // Import a single product from CSV V2 row
  private async importProductV2(row: CsvRowV2): Promise<string> {
    const name = row['IME PRODUKTA'];
    if (!name || name.trim() === '') {
      throw new Error('Product name (IME PRODUKTA) is required');
    }

    const price = this.parsePrice(row.CENA);
    if (price === null) {
      throw new Error('Valid price (CENA) is required');
    }

    // Check if product already exists by SKU
    let existingProduct: Product | null = null;
    if (row.SKU && row.SKU.trim()) {
      existingProduct = await this.productsRepository.findOne({
        where: { sku: row.SKU.trim() },
        relations: ['images'],
      });
    }

    // Find or create category hierarchy
    const category = await this.findOrCreateCategoryV2(
      row.KATEGORIJA,
      row.PODKATEGORIJA,
      row.PODPODKATEGORIJA,
    );

    // Generate unique slug
    let slug = this.generateSlug(name);
    if (!existingProduct) {
      const existingSlug = await this.productsRepository.findOne({
        where: { slug },
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const productData: Partial<Product> = {
      name: name.trim(),
      slug: existingProduct?.slug || slug,
      sku: row.SKU?.trim() || undefined,
      brand: row.BRAND?.trim() || undefined,
      shortDescription: row['KRATEK OPIS']?.trim() || undefined,
      description: row['DOLGI OPIS']?.trim() || undefined,
      price,
      stock: 0, // Default stock to 0, can be updated separately
      status: ProductStatus.PUBLISHED, // Publish by default in V2 import
      categoryId: category?.id || undefined,
    };

    let product: Product;

    if (existingProduct) {
      // Update existing product
      Object.assign(existingProduct, productData);
      product = await this.productsRepository.save(existingProduct);
      this.logger.debug(`Updated product: ${name} (SKU: ${row.SKU})`);
    } else {
      // Create new product
      product = this.productsRepository.create(productData);
      product = await this.productsRepository.save(product);
      this.logger.debug(`Created product: ${name} (SKU: ${row.SKU})`);
    }

    return product.id;
  }

  // Process image download queue with rate limiting
  private async processImageDownloadQueue(): Promise<void> {
    if (this.isProcessingImages) {
      return; // Already processing
    }

    this.isProcessingImages = true;
    this.logger.log(
      `Starting image download queue processing: ${this.imageDownloadQueue.length} products`,
    );

    while (this.imageDownloadQueue.length > 0) {
      const task = this.imageDownloadQueue.shift()!;

      for (let i = 0; i < task.imageUrls.length; i++) {
        const imageUrl = task.imageUrls[i];

        try {
          // Download image
          const localPath = await this.downloadImage(imageUrl);

          if (localPath) {
            // Create ProductImage record
            const productImage = this.imagesRepository.create({
              url: localPath,
              type: MediaType.IMAGE,
              productId: task.productId,
              sortOrder: i,
              isPrimary: i === 0,
            });
            await this.imagesRepository.save(productImage);
            this.logger.debug(`Downloaded image for product ${task.productId}: ${localPath}`);
          }
        } catch (error) {
          this.logger.warn(
            `Failed to download image ${imageUrl} for product ${task.productId}: ${error.message}`,
          );
        }

        // Rate limiting delay between downloads
        await this.delay(this.IMAGE_DOWNLOAD_DELAY_MS);
      }
    }

    this.isProcessingImages = false;
    this.logger.log('Image download queue processing completed');
  }

  // Download a single image and save to uploads folder
  private async downloadImage(imageUrl: string): Promise<string | null> {
    try {
      // Use native fetch (Node 18+) or fallback
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      // Determine file extension
      let extension = '.jpg';
      if (contentType.includes('png')) extension = '.png';
      else if (contentType.includes('gif')) extension = '.gif';
      else if (contentType.includes('webp')) extension = '.webp';
      else if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = '.jpg';

      // Generate unique filename
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${extension}`;
      const uploadsDir = './uploads';
      const filePath = path.join(uploadsDir, filename);

      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Save image to disk
      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

      return `/uploads/${filename}`;
    } catch (error) {
      this.logger.warn(`Image download failed for ${imageUrl}: ${error.message}`);
      return null;
    }
  }

  // Helper delay function
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Get image download queue status
  getImageDownloadStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.imageDownloadQueue.length,
      isProcessing: this.isProcessingImages,
    };
  }

  // ============================================
  // CSV V3 Import (Local images from skyman.csv matching)
  // ============================================

  /**
   * Build a memory-efficient map of SKU -> image paths from skyman.csv
   * Image paths in skyman.csv are separated by | (pipe character)
   */
  buildSkymanImageMap(skymanCsvContent: string): Map<string, string[]> {
    const imageMap = new Map<string, string[]>();
    const lines = skymanCsvContent.split('\n');

    if (lines.length < 2) {
      this.logger.warn('Skyman CSV file is empty or has no data rows');
      return imageMap;
    }

    // Parse header
    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine);

    // Find column indices
    const skuIndex = headers.findIndex(
      (h) => h.toLowerCase() === 'sku',
    );
    const imagePathsIndex = headers.findIndex(
      (h) => h.toLowerCase() === 'image_paths',
    );

    if (skuIndex === -1) {
      this.logger.warn('Skyman CSV: SKU column not found');
      return imageMap;
    }
    if (imagePathsIndex === -1) {
      this.logger.warn('Skyman CSV: image_paths column not found');
      return imageMap;
    }

    // Parse rows
    let currentLine = '';
    let inQuote = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      for (const char of line) {
        if (char === '"') {
          inQuote = !inQuote;
        }
      }

      currentLine += (currentLine ? '\n' : '') + line;

      if (!inQuote) {
        if (currentLine.trim()) {
          const values = this.parseCSVLine(currentLine);
          const sku = values[skuIndex]?.trim();
          const imagePaths = values[imagePathsIndex]?.trim();

          if (sku && imagePaths) {
            // Split by | and filter empty paths
            const paths = imagePaths
              .split('|')
              .map((p) => p.trim())
              .filter((p) => p);

            if (paths.length > 0) {
              imageMap.set(sku, paths);
            }
          }
        }
        currentLine = '';
      }
    }

    this.logger.log(
      `Built Skyman image map with ${imageMap.size} SKUs`,
    );
    return imageMap;
  }

  /**
   * Copy a local image file to the uploads folder
   * @param sourcePath Full path to the source image
   * @returns The web-accessible path (e.g., /uploads/filename.jpg) or null on failure
   */
  private copyLocalImage(sourcePath: string): string | null {
    try {
      if (!fs.existsSync(sourcePath)) {
        this.logger.warn(`Image file not found: ${sourcePath}`);
        return null;
      }

      // Get file extension
      const extension = path.extname(sourcePath) || '.jpg';

      // Generate unique filename
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${extension}`;
      const uploadsDir = './uploads';
      const destPath = path.join(uploadsDir, filename);

      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Copy the file
      fs.copyFileSync(sourcePath, destPath);

      return `/uploads/${filename}`;
    } catch (error) {
      this.logger.warn(
        `Failed to copy image ${sourcePath}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Import products from CSV V3 format with local images from skyman.csv matching
   * @param csvContent Content of slovene.csv (product data)
   * @param skymanCsvContent Content of skyman.csv (SKU to image_paths mapping)
   * @param imageBasePath Base path to images folder (e.g., 'd:/project/ignore')
   */
  async importFromCSVv3(
    csvContent: string,
    skymanCsvContent: string,
    imageBasePath: string,
  ): Promise<ImportResultV3> {
    const result: ImportResultV3 = {
      success: 0,
      failed: 0,
      errors: [],
      imagesImported: 0,
      imagesFailed: 0,
    };

    // Step 1: Build SKU -> image paths map from skyman.csv
    const imageMap = this.buildSkymanImageMap(skymanCsvContent);
    this.logger.log(
      `V3 Import: Found ${imageMap.size} products with images in skyman.csv`,
    );

    // Step 2: Parse product data from slovene.csv (same format as V2)
    const rows = this.parseCSVv2(csvContent);
    this.logger.log(`Starting V3 import of ${rows.length} products`);

    // Clear category cache for fresh import
    this.categoryCache.clear();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;
      const sku = row.SKU?.trim();

      try {
        // Import product (reuse V2 logic)
        const productId = await this.importProductV2(row);

        // Step 3: Look up images by SKU in the map
        if (sku && imageMap.has(sku)) {
          const imagePaths = imageMap.get(sku)!;

          // Delete existing images for this product
          const existingProduct = await this.productsRepository.findOne({
            where: { id: productId },
            relations: ['images'],
          });
          if (existingProduct?.images?.length) {
            await this.imagesRepository.delete({ productId });
          }

          // Copy each image from local folder
          for (let j = 0; j < imagePaths.length; j++) {
            const relativePath = imagePaths[j];
            // Build full path: imageBasePath/images/relativePath
            // relativePath is like "full/abc123.jpg", so we prepend "images/"
            const fullPath = path.join(
              imageBasePath,
              'images',
              relativePath,
            );

            const uploadedPath = this.copyLocalImage(fullPath);

            if (uploadedPath) {
              // Create ProductImage record
              const productImage = this.imagesRepository.create({
                url: uploadedPath,
                type: MediaType.IMAGE,
                productId: productId,
                sortOrder: j,
                isPrimary: j === 0, // First image is showcase/main
              });
              await this.imagesRepository.save(productImage);
              result.imagesImported++;
            } else {
              result.imagesFailed++;
            }
          }
        }

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: error.message,
          name: row['IME PRODUKTA'],
        });
        this.logger.warn(
          `Failed to import row ${rowNumber}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `V3 Import completed: ${result.success} products success, ${result.failed} failed, ${result.imagesImported} images imported, ${result.imagesFailed} images failed`,
    );

    result.message = `Imported ${result.success} products with ${result.imagesImported} images. ${result.imagesFailed} images could not be found.`;

    return result;
  }
}

