import { ApiProperty } from '@nestjs/swagger';

export class AccountStatusResponseDto {
  @ApiProperty({
    example: 'acct_123456789',
    description: 'Stripe account ID',
  })
  id: string;

  @ApiProperty({
    example: true,
    description: 'Whether the account has been fully onboarded',
  })
  onboardingComplete: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether payments are enabled for the account',
  })
  paymentsEnabled: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether details have been submitted',
  })
  detailsSubmitted: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether charges are enabled',
  })
  chargesEnabled: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether payouts are enabled',
  })
  payoutsEnabled: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether requirements have been disabled',
  })
  requirementsDisabled: boolean;

  @ApiProperty({
    description: 'Current requirements that need to be resolved',
    type: [String],
    example: ['external_account'],
  })
  requirements: string[];
}
