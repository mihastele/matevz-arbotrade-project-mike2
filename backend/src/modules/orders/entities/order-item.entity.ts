import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => Product, (product) => product.orderItems, { nullable: true, onDelete: 'SET NULL' })
  product: Product;

  @Column({ nullable: true })
  productId: string;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  variant: ProductVariant;

  @Column({ nullable: true })
  variantId: string;

  // Store product details at time of purchase (in case product changes/deleted)
  @Column()
  productName: string;

  @Column({ nullable: true })
  productSku: string;

  @Column({ nullable: true })
  variantName: string;

  @Column({ type: 'jsonb', nullable: true })
  variantAttributes: Record<string, string>;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
