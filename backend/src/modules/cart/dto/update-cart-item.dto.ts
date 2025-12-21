import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity: number;
}
