import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AccountSessionDto {
  @ApiProperty({
    example: 'acct_1234567890',
    description: 'Stripe account ID',
  })
  @IsString()
  @IsNotEmpty()
  accountId: string;
}

export class AccountSessionResponseDto {
  @ApiProperty({
    example: 'cs_test_a1b2c3d4e5f6g7h8i9j0',
    description: 'Stripe client secret for Connect components',
  })
  clientSecret: string;
}
