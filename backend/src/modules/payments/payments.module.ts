import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { CartModule } from '../cart/cart.module';
import { ConfigurationModule } from '../configuration/configuration.module';

@Module({
  imports: [ConfigModule, forwardRef(() => OrdersModule), CartModule, ConfigurationModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule { }

