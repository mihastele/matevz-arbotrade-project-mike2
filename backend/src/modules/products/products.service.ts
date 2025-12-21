import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private imagesRepository: Repository<ProductImage>,
    @InjectRepository(ProductVariant)
    private variantsRepository: Repository<ProductVariant>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { images, variants, ...productData } = createProductDto;

    // Generate slug from name if not provided
    if (!productData.slug) {
      productData.slug = this.generateSlug(productData.name);
    }

    const product = this.productsRepository.create(productData);
    const savedProduct = await this.productsRepository.save(product);

    // Create images
    if (images && images.length > 0) {
      const productImages = images.map((img, index) =>
        this.imagesRepository.create({
          ...img,
          productId: savedProduct.id,
          sortOrder: img.sortOrder ?? index,
          isPrimary: img.isPrimary ?? index === 0,
        }),
      );
      await this.imagesRepository.save(productImages);
    }

    // Create variants
    if (variants && variants.length > 0) {
      const productVariants = variants.map((v) =>
        this.variantsRepository.create({
          ...v,
          productId: savedProduct.id,
        }),
      );
      await this.variantsRepository.save(productVariants);
    }

    return this.findOne(savedProduct.id);
  }

  async findAll(query: QueryProductsDto) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      categoryIds,
      minPrice,
      maxPrice,
      status,
      isFeatured,
      inStock,
      brand,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Category filter
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (categoryIds && categoryIds.length > 0) {
      queryBuilder.andWhere('product.categoryId IN (:...categoryIds)', { categoryIds });
    }

    // Price filters
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    } else {
      // By default, only show published products for storefront
      queryBuilder.andWhere('product.status = :status', { status: ProductStatus.PUBLISHED });
    }

    // Featured filter
    if (isFeatured !== undefined) {
      queryBuilder.andWhere('product.isFeatured = :isFeatured', { isFeatured });
    }

    // Brand filter
    if (brand) {
      queryBuilder.andWhere('product.brand = :brand', { brand });
    }

    // In stock filter
    if (inStock !== undefined) {
      if (inStock) {
        queryBuilder.andWhere('(product.stock > 0 OR product.allowBackorder = true OR product.trackInventory = false)');
      } else {
        queryBuilder.andWhere('product.stock = 0 AND product.allowBackorder = false AND product.trackInventory = true');
      }
    }

    // Sorting
    const validSortFields = ['name', 'price', 'createdAt', 'stock'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`product.${sortField}`, sortOrder === 'ASC' ? 'ASC' : 'DESC');

    // Also sort images
    queryBuilder.addOrderBy('images.sortOrder', 'ASC');

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['images', 'category', 'variants', 'categories'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { slug },
      relations: ['images', 'category', 'variants', 'categories'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const { images, variants, ...productData } = updateProductDto;

    // Update slug if name changed
    if (productData.name && productData.name !== product.name && !productData.slug) {
      productData.slug = this.generateSlug(productData.name);
    }

    Object.assign(product, productData);
    await this.productsRepository.save(product);

    // Update images if provided
    if (images) {
      // Remove existing images
      await this.imagesRepository.delete({ productId: id });
      
      // Create new images
      const productImages = images.map((img, index) =>
        this.imagesRepository.create({
          ...img,
          productId: id,
          sortOrder: img.sortOrder ?? index,
          isPrimary: img.isPrimary ?? index === 0,
        }),
      );
      await this.imagesRepository.save(productImages);
    }

    // Update variants if provided
    if (variants) {
      // Remove existing variants
      await this.variantsRepository.delete({ productId: id });
      
      // Create new variants
      const productVariants = variants.map((v) =>
        this.variantsRepository.create({
          ...v,
          productId: id,
        }),
      );
      await this.variantsRepository.save(productVariants);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    product.stock = quantity;
    return this.productsRepository.save(product);
  }

  async decrementStock(id: string, quantity: number): Promise<void> {
    await this.productsRepository.decrement({ id }, 'stock', quantity);
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isFeatured: true, status: ProductStatus.PUBLISHED },
      relations: ['images', 'category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
    const product = await this.findOne(productId);
    
    return this.productsRepository.find({
      where: {
        categoryId: product.categoryId,
        status: ProductStatus.PUBLISHED,
      },
      relations: ['images'],
      order: { createdAt: 'DESC' },
      take: limit + 1,
    }).then((products) => products.filter((p) => p.id !== productId).slice(0, limit));
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
