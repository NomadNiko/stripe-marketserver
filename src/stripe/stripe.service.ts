import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BusinessService } from '../business/business.service';
import { Business } from '../business/domain/business';
import {
  AccountLinkResponseDto,
  CreateAccountLinkDto,
} from './dto/account-link.dto';
import { AccountStatusResponseDto } from './dto/account-status.dto';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly businessService: BusinessService,
  ) {
    this.stripe = new Stripe(
      configService.get<string>('STRIPE_SECRET_KEY') || '',
      {
        apiVersion: '2025-02-24.acacia',
      },
    );
  }

  async createConnectAccount(businessId: string): Promise<string> {
    const business = await this.businessService.findById(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    // If the business already has a Stripe account, return it
    if (business.stripeAccountId) {
      return business.stripeAccountId;
    }

    try {
      const account = await this.stripe.accounts.create({
        type: 'standard',
        metadata: {
          businessId: businessId,
        },
      });

      // Update business with Stripe account ID
      await this.businessService.updateStripeAccount(businessId, account.id, {
        onboardingComplete: false,
        paymentsEnabled: false,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        requirementsDisabled: false,
      });

      return account.id;
    } catch (error) {
      this.logger.error(
        `Error creating Stripe account: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async createAccountLink(
    dto: CreateAccountLinkDto,
    businessId?: string,
  ): Promise<AccountLinkResponseDto> {
    try {
      // If accountId is not provided but businessId is, use account ID from business
      let accountId = dto.accountId;
      if (!accountId && businessId) {
        accountId = await this.createConnectAccount(businessId);
      }

      if (!accountId) {
        throw new Error('Stripe account ID is required');
      }

      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: dto.refreshUrl,
        return_url: dto.returnUrl,
        type: 'account_onboarding',
      });

      return {
        url: accountLink.url,
        expiresAt: accountLink.expires_at,
      };
    } catch (error) {
      this.logger.error(
        `Error creating account link: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getAccountStatus(accountId: string): Promise<AccountStatusResponseDto> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);

      // Extract requirements that need to be resolved
      const requirements: string[] = [];
      if (account.requirements?.currently_due) {
        requirements.push(...account.requirements.currently_due);
      }
      if (account.requirements?.eventually_due) {
        requirements.push(
          ...account.requirements.eventually_due.filter(
            (req) => !requirements.includes(req),
          ),
        );
      }

      return {
        id: account.id,
        onboardingComplete: account.details_submitted,
        paymentsEnabled: account.capabilities?.card_payments === 'active',
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirementsDisabled: !!account.requirements?.disabled_reason,
        requirements,
      };
    } catch (error) {
      this.logger.error(
        `Error retrieving account status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateBusinessStripeStatus(
    accountId: string,
  ): Promise<Business | null> {
    try {
      // Get the account status
      const status = await this.getAccountStatus(accountId);

      // Find business by Stripe account ID
      const businesses = await this.businessService.findManyWithPagination({
        filterOptions: null,
        paginationOptions: {
          page: 1,
          limit: 100, // Increase limit to find the business
        },
      });

      const business = businesses.find((b) => b.stripeAccountId === accountId);
      if (!business) {
        this.logger.warn(
          `Business not found for Stripe account ID: ${accountId}`,
        );
        return null;
      }

      // Update business with account status
      return this.businessService.updateStripeAccount(business.id, accountId, {
        onboardingComplete: status.onboardingComplete,
        paymentsEnabled: status.paymentsEnabled,
        detailsSubmitted: status.detailsSubmitted,
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
        requirementsDisabled: status.requirementsDisabled,
      });
    } catch (error) {
      this.logger.error(
        `Error updating business Stripe status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
