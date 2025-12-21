import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartsRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
    private productsService: ProductsService,
  ) {}

  async getOrCreateCart(userId?: string, guestToken?: string): Promise<Cart> {
    let cart: Cart | null = null;

    if (userId) {
      cart = await this.cartsRepository.findOne({
        where: { userId },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });
    } else if (guestToken) {
      cart = await this.cartsRepository.findOne({
        where: { guestToken },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });
    }

    if (!cart) {
      cart = this.cartsRepository.create({
        userId,
        guestToken: guestToken || (userId ? undefined : uuidv4()),
        items: [],
        subtotal: 0,
      });
      cart = await this.cartsRepository.save(cart) as Cart;
    }

    return cart;
  }

  async getCart(userId?: string, guestToken?: string): Promise<Cart> {
    return this.getOrCreateCart(userId, guestToken);
  }

  async addItem(userId: string | undefined, guestToken: string | undefined, addToCartDto: AddToCartDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId, guestToken);
    const product = await this.productsService.findOne(addToCartDto.productId);

    if (!product.inStock && !product.allowBackorder) {
      throw new BadRequestException('Product is out of stock');
    }

    // Check if item already exists
    let cartItem = cart.items?.find(
      (item) => 
        item.productId === addToCartDto.productId &&
        item.variantId === addToCartDto.variantId
    );

    if (cartItem) {
      cartItem.quantity += addToCartDto.quantity;
    } else {
      const price = product.currentPrice;
      cartItem = this.cartItemsRepository.create({
        cartId: cart.id,
        productId: addToCartDto.productId,
        variantId: addToCartDto.variantId,
        quantity: addToCartDto.quantity,
        price,
      });
      cart.items = cart.items || [];
      cart.items.push(cartItem);
    }

    await this.cartItemsRepository.save(cartItem);
    await this.updateCartSubtotal(cart.id);
    
    return this.getCart(userId, guestToken);
  }

  async updateItem(
    userId: string | undefined,
    guestToken: string | undefined,
    itemId: string,
    updateDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getCart(userId, guestToken);
    const item = cart.items?.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (updateDto.quantity <= 0) {
      await this.cartItemsRepository.remove(item);
    } else {
      item.quantity = updateDto.quantity;
      await this.cartItemsRepository.save(item);
    }

    await this.updateCartSubtotal(cart.id);
    return this.getCart(userId, guestToken);
  }

  async removeItem(userId: string | undefined, guestToken: string | undefined, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId, guestToken);
    const item = cart.items?.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemsRepository.remove(item);
    await this.updateCartSubtotal(cart.id);
    
    return this.getCart(userId, guestToken);
  }

  async clearCart(userId?: string, guestToken?: string): Promise<void> {
    const cart = await this.getCart(userId, guestToken);
    if (cart.items && cart.items.length > 0) {
      await this.cartItemsRepository.remove(cart.items);
      cart.subtotal = 0;
      await this.cartsRepository.save(cart);
    }
  }

  async mergeGuestCart(userId: string, guestToken: string): Promise<Cart> {
    const guestCart = await this.cartsRepository.findOne({
      where: { guestToken },
      relations: ['items'],
    });

    if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
      return this.getOrCreateCart(userId);
    }

    const userCart = await this.getOrCreateCart(userId);

    // Merge items
    for (const guestItem of guestCart.items) {
      const existingItem = userCart.items?.find(
        (item) => item.productId === guestItem.productId && item.variantId === guestItem.variantId
      );

      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
        await this.cartItemsRepository.save(existingItem);
      } else {
        guestItem.cartId = userCart.id;
        await this.cartItemsRepository.save(guestItem);
      }
    }

    // Remove guest cart
    await this.cartsRepository.remove(guestCart);
    await this.updateCartSubtotal(userCart.id);

    return this.getCart(userId);
  }

  private async updateCartSubtotal(cartId: string): Promise<void> {
    const cart = await this.cartsRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });

    if (cart && cart.items) {
      cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      await this.cartsRepository.save(cart);
    }
  }
}
