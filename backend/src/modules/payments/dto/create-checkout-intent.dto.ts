import {
    IsString,
    IsOptional,
    IsObject,
    ValidateNested,
    IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressDto } from '../../orders/dto/create-order.dto';

export class CreateCheckoutIntentDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    guestEmail?: string;

    @ApiProperty({ type: AddressDto })
    @ValidateNested()
    @Type(() => AddressDto)
    shippingAddress: AddressDto;

    @ApiPropertyOptional({ type: AddressDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => AddressDto)
    billingAddress?: AddressDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    shippingMethod?: string;
}
