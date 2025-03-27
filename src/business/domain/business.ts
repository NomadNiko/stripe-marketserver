import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { FileType } from '../../files/domain/file';

export class StripeAccountStatus {
  @ApiProperty({ example: true })
  onboardingComplete: boolean;

  @ApiProperty({ example: true })
  paymentsEnabled: boolean;

  @ApiProperty({ example: true })
  detailsSubmitted: boolean;

  @ApiProperty({ example: true })
  chargesEnabled: boolean;

  @ApiProperty({ example: true })
  payoutsEnabled: boolean;

  @ApiProperty({ example: false })
  requirementsDisabled: boolean;

  @ApiProperty({ type: [String] })
  currentlyDue?: string[];

  @ApiProperty({ type: [String] })
  eventuallyDue?: string[];

  @ApiProperty({ type: [String] })
  pastDue?: string[];
}

export class Business {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The unique identifier of the business',
  })
  id: string;

  @ApiProperty({
    example: 'acme-store',
    description: 'URL-friendly business name for subdomains',
  })
  displayName: string;

  @ApiProperty({
    example: 'Acme Store',
    description: 'The full business name',
  })
  businessName: string;

  @ApiProperty({
    example: 'We sell the finest products',
    description: 'A description of the business',
    required: false,
  })
  description?: string;

  @ApiProperty({
    type: () => FileType,
    description: 'The business logo',
    required: false,
  })
  logo?: FileType | null;

  @ApiProperty({
    example: 'acct_1234567890',
    description: 'The Stripe account ID',
    required: false,
  })
  @Expose({ groups: ['admin', 'business'] })
  stripeAccountId?: string;

  @ApiProperty({
    example: 'acct_1234567890',
    description: 'The Stripe Connect account ID',
    required: false,
  })
  @Expose({ groups: ['admin', 'business'] })
  stripeConnectId?: string;

  @ApiProperty({
    description: 'Stripe account status details',
    required: false,
    type: () => StripeAccountStatus,
  })
  @Expose({ groups: ['admin', 'business'] })
  stripeAccountStatus?: StripeAccountStatus;

  @ApiProperty({
    example: false,
    description: 'Whether Stripe setup is complete',
  })
  @Expose({ groups: ['admin', 'business'] })
  isStripeSetupComplete?: boolean;

  @ApiProperty({
    description: 'List of users who have access to manage this business',
    type: [String],
  })
  @Expose({ groups: ['admin', 'business'] })
  owners: string[];

  @ApiProperty({
    description: 'Primary owner/creator of the business',
    type: String,
  })
  @Expose({ groups: ['admin', 'business'] })
  primaryOwner: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Business contact phone number',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    example: 'https://acme-store.com',
    description: 'Business website URL',
    required: false,
  })
  website?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the business is active',
    default: false,
  })
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
