import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Headers,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-guest-token', required: false })
  @ApiOperation({ summary: 'Get current cart' })
  getCart(
    @Request() req: any,
    @Headers('x-guest-token') guestToken?: string,
  ) {
    return this.cartService.getCart(req.user?.id, guestToken);
  }

  @Post('items')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-guest-token', required: false })
  @ApiOperation({ summary: 'Add item to cart' })
  addItem(
    @Request() req: any,
    @Headers('x-guest-token') guestToken: string | undefined,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addItem(req.user?.id, guestToken, addToCartDto);
  }

  @Patch('items/:itemId')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-guest-token', required: false })
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateItem(
    @Request() req: any,
    @Headers('x-guest-token') guestToken: string | undefined,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(req.user?.id, guestToken, itemId, updateDto);
  }

  @Delete('items/:itemId')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-guest-token', required: false })
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(
    @Request() req: any,
    @Headers('x-guest-token') guestToken: string | undefined,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(req.user?.id, guestToken, itemId);
  }

  @Delete()
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-guest-token', required: false })
  @ApiOperation({ summary: 'Clear cart' })
  clearCart(
    @Request() req: any,
    @Headers('x-guest-token') guestToken?: string,
  ) {
    return this.cartService.clearCart(req.user?.id, guestToken);
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-guest-token', required: true })
  @ApiOperation({ summary: 'Merge guest cart with user cart after login' })
  mergeCart(
    @Request() req: any,
    @Headers('x-guest-token') guestToken: string,
  ) {
    return this.cartService.mergeGuestCart(req.user.id, guestToken);
  }
}
