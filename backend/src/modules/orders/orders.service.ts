import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    private cartService: CartService,
    private productsService: ProductsService,
  ) { }

  async create(createOrderDto: CreateOrderDto, userId?: string, guestToken?: string): Promise<Order> {
    const cart = await this.cartService.getCart(userId, guestToken);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Calculate totals
    const subtotal = Number(cart.subtotal);
    const tax = subtotal * 0.22; // 22% VAT (Slovenia)
    const shippingCost = createOrderDto.shippingCost || 0;
    const discount = createOrderDto.discount || 0;
    const total = subtotal + tax + shippingCost - discount;

    // Create order
    const order = this.ordersRepository.create({
      orderNumber,
      userId,
      guestEmail: createOrderDto.guestEmail,
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      shippingAddress: createOrderDto.shippingAddress,
      billingAddress: createOrderDto.billingAddress || createOrderDto.shippingAddress,
      notes: createOrderDto.notes,
      shippingMethod: createOrderDto.shippingMethod,
    });

    const savedOrder = await this.ordersRepository.save(order) as Order;

    // Create order items
    const orderItems: OrderItem[] = [];
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

      const orderItem = this.orderItemsRepository.create({
        orderId: savedOrder.id,
        productId: product.id,
        variantId: cartItem.variantId,
        productName: product.name,
        productSku: product.sku,
        variantName: cartItem.variant?.name,
        variantAttributes: cartItem.variant?.attributes,
        quantity: cartItem.quantity,
        unitPrice: cartItem.price,
        total: cartItem.price * cartItem.quantity,
        imageUrl: primaryImage?.url,
      });

      orderItems.push(orderItem);

      // Decrement stock
      if (product.trackInventory) {
        await this.productsService.decrementStock(product.id, cartItem.quantity);
      }
    }

    await this.orderItemsRepository.save(orderItems);

    // Clear cart
    await this.cartService.clearCart(userId, guestToken);

    return this.findOne(savedOrder.id);
  }

  async findAll(userId?: string, page = 1, limit = 20) {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .orderBy('order.createdAt', 'DESC');

    if (userId) {
      queryBuilder.where('order.userId = :userId', { userId });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'items.product.images', 'user'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { orderNumber },
      relations: ['items', 'items.product', 'items.product.images'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findUserOrders(userId: string, page = 1, limit = 20) {
    return this.findAll(userId, page, limit);
  }

  async updateStatus(id: string, updateDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);

    if (updateDto.status) {
      order.status = updateDto.status;

      // Update timestamps based on status
      if (updateDto.status === OrderStatus.SHIPPED) {
        order.shippedAt = new Date();
      } else if (updateDto.status === OrderStatus.DELIVERED) {
        order.deliveredAt = new Date();
      }
    }

    if (updateDto.paymentStatus) {
      order.paymentStatus = updateDto.paymentStatus;

      if (updateDto.paymentStatus === PaymentStatus.PAID) {
        order.paidAt = new Date();
        order.status = OrderStatus.PROCESSING;
      }
    }

    if (updateDto.trackingNumber) {
      order.trackingNumber = updateDto.trackingNumber;
    }

    return this.ordersRepository.save(order);
  }

  async updatePaymentIntent(orderId: string, paymentIntentId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    order.paymentIntentId = paymentIntentId;
    return this.ordersRepository.save(order);
  }

  async markAsPaid(orderId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    order.paymentStatus = PaymentStatus.PAID;
    order.status = OrderStatus.PROCESSING;
    order.paidAt = new Date();
    return this.ordersRepository.save(order);
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}
