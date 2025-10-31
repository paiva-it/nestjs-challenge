import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateOrderRequestDto {
  @ApiProperty({
    description: 'ID of the record to order',
    type: String,
    example: '64a7b2f5c2a3f5e8d6e4b123',
  })
  @IsMongoId()
  @IsNotEmpty()
  recordId: string;

  @ApiProperty({
    description: 'Quantity of records to order',
    type: Number,
    example: 5,
  })
  @IsNumber()
  @Min(1)
  qty: number;
}
