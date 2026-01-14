import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Index()
  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  gtin: string; // GTIN, UPC, EAN or ISBN

  @Column({ type: 'text', nullable: true })
  shortDescription: string;

  @Index()
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @Column({ type: 'timestamp', nullable: true })
  saleStartDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  saleEndDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight: number; // in kg

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length: number; // in cm

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width: number; // in cm

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height: number; // in cm

  @Column({ default: 0 })
  stock: number;

  @Column({ default: 0 })
  lowStockThreshold: number;

  @Column({ default: true })
  trackInventory: boolean;

  @Column({ default: false })
  allowBackorder: boolean;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ default: false })
  isFeatured: boolean;

  @ManyToOne(() => Category, (category) => category.products, { nullable: true })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'product_categories',
    joinColumn: { name: 'product_id' },
    inverseJoinColumn: { name: 'category_id' },
  })
  categories: Category[];

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true })
  variants: ProductVariant[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  @Column({ nullable: true })
  brand: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes: Record<string, string>;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'simple-array', nullable: true })
  videoUrls: string[];

  @Column({ type: 'simple-array', nullable: true })
  pdfUrls: string[];

  @Column({ type: 'simple-array', nullable: true })
  previewLinks: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get currentPrice(): number | null {
    if (this.price === null || this.price === undefined) {
      return null;
    }
    const now = new Date();
    if (
      this.salePrice &&
      (!this.saleStartDate || this.saleStartDate <= now) &&
      (!this.saleEndDate || this.saleEndDate >= now)
    ) {
      return this.salePrice;
    }
    return this.price;
  }

  get inStock(): boolean {
    if (!this.trackInventory) return true;
    return this.stock > 0 || this.allowBackorder;
  }

  get isOrderable(): boolean {
    return this.price !== null && this.price !== undefined && this.inStock;
  }
}
