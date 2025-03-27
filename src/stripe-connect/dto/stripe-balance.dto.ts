import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class StripeBalanceRetrievalDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  businessId: string;
}

export class StripeBalanceResponseDto {
  @ApiProperty({ example: 1000.0 })
  availableBalance: number;

  @ApiProperty({ example: 500.0 })
  pendingBalance: number;
}

export class StripeAccountStatusDto {
  @ApiProperty({ example: true })
  chargesEnabled: boolean;

  @ApiProperty({ example: true })
  payoutsEnabled: boolean;

  @ApiProperty({ example: true })
  detailsSubmitted: boolean;

  @ApiProperty({ example: true })
  onboardingComplete: boolean;

  @ApiProperty({ example: [] })
  currentlyDue: string[];

  @ApiProperty({ example: [] })
  eventuallyDue: string[];

  @ApiProperty({ example: [] })
  pastDue: string[];
}

export class UpdateBusinessStripeDto {
  @ApiProperty({ example: 'acct_1234567890' })
  @IsString()
  stripeConnectId: string;

  @ApiProperty()
  stripeAccountStatus: StripeAccountStatusDto;
}
