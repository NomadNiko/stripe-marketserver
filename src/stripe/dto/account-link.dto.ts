import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class AccountLinkResponseDto {
  @ApiProperty({
    example: 'https://connect.stripe.com/setup/s/aBcDeFgHiJkL',
    description: 'URL to the Stripe Connect onboarding flow',
  })
  url: string;

  @ApiPropertyOptional({
    example: 1672531200,
    description: 'Timestamp for when the link expires',
  })
  expiresAt: number;
}

export class CreateAccountLinkDto {
  @ApiProperty({
    example: 'https://example.com/onboarding/refresh',
    description:
      'URL to redirect to if the link is expired, stale, or has been previously used',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false }) // Add require_tld: false option
  refreshUrl: string;

  @ApiProperty({
    example: 'https://example.com/onboarding/complete',
    description: 'URL to redirect to when the onboarding is complete',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false }) // Add require_tld: false option
  returnUrl: string;

  @ApiPropertyOptional({
    example: 'acct_123456789',
    description: 'Stripe account ID (if already created)',
  })
  @IsString()
  @IsOptional()
  accountId?: string;
}
