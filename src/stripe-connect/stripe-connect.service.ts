// src/stripe-connect/stripe-connect.service.ts

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BusinessService } from '../business/business.service';
import { StripeBalanceResponseDto } from './dto/stripe-balance.dto';
import { Business } from '../business/domain/business';

@Injectable()
export class StripeConnectService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeConnectService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly businessService: BusinessService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY', { infer: true }) ??
        '',
      { apiVersion: '2025-02-24.acacia' },
    );
  }

  async getOrCreateConnectAccount(existingAccountId?: string) {
    // First try to retrieve existing account if ID provided
    if (existingAccountId) {
      try {
        this.logger.log(
          `Retrieving existing Stripe account: ${existingAccountId}`,
        );
        const existingAccount =
          await this.stripe.accounts.retrieve(existingAccountId);

        // Update existing account with required settings
        this.logger.log(
          `Updating existing Stripe account settings: ${existingAccountId}`,
        );
        await this.stripe.accounts.update(existingAccountId, {
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          settings: {
            payouts: {
              schedule: {
                interval: 'manual',
              },
              debit_negative_balances: true,
            },
          },
        });

        return existingAccount;
      } catch (error) {
        this.logger.error(
          `Error retrieving existing Stripe account: ${error.message}`,
          error.stack,
        );
        // If retrieval fails, continue to create a new account
      }
    }

    // Create new Express account with required settings (like iXplor)
    this.logger.log('Creating new Stripe Express account');
    return this.stripe.accounts.create({
      type: 'express', // Important: Use Express account like iXplor
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'manual',
          },
          debit_negative_balances: true,
        },
      },
    });
  }

  async createAccountSession(accountId: string) {
    this.logger.log(`Creating account session for: ${accountId}`);
    // Create a more persistent session with broader component access
    return this.stripe.accountSessions.create({
      account: accountId,
      components: {
        account_onboarding: { enabled: true },
        // Enable additional components for a more complete experience
        payments: { enabled: true },
        payouts: { enabled: true },
      },
      // Expand returned objects for more detailed information
      expand: ['account'],
    });
  }

  async getAccountDetails(accountId: string) {
    this.logger.log(`Retrieving account details for: ${accountId}`);
    // Retrieve account with expanded details for better status information
    return this.stripe.accounts.retrieve(accountId, {
      expand: ['capabilities', 'requirements.alternatives', 'settings'],
    });
  }

  // Improved account status validation with null checks
  async isStripeOnboardingComplete(accountId: string): Promise<boolean> {
    const account = await this.stripe.accounts.retrieve(accountId);

    if (!account.details_submitted) {
      this.logger.debug(
        `Account ${accountId} onboarding incomplete: details not submitted`,
      );
      return false;
    }

    if (!account.charges_enabled) {
      this.logger.debug(
        `Account ${accountId} onboarding incomplete: charges not enabled`,
      );
      return false;
    }

    if (!account.payouts_enabled) {
      this.logger.debug(
        `Account ${accountId} onboarding incomplete: payouts not enabled`,
      );
      return false;
    }

    // Check if there are requirements that need attention - with proper null checks
    if (
      (account.requirements?.currently_due &&
        account.requirements.currently_due.length > 0) ||
      (account.requirements?.past_due &&
        account.requirements.past_due.length > 0)
    ) {
      this.logger.debug(
        `Account ${accountId} onboarding incomplete: requirements still pending`,
        {
          currently_due: account.requirements?.currently_due,
          past_due: account.requirements?.past_due,
        },
      );
      return false;
    }

    // Check if there's a disabled reason
    if (account.requirements?.disabled_reason) {
      this.logger.debug(
        `Account ${accountId} onboarding incomplete: account disabled`,
        {
          reason: account.requirements.disabled_reason,
        },
      );
      return false;
    }

    this.logger.log(`Account ${accountId} onboarding is complete`);
    return true;
  }

  async getAccountBalance(
    stripeAccountId: string,
  ): Promise<StripeBalanceResponseDto> {
    try {
      this.logger.log(`Retrieving balance for account: ${stripeAccountId}`);
      const balance = await this.stripe.balance.retrieve({
        stripeAccount: stripeAccountId,
      });

      // Extract available and pending balances
      const availableBalance = balance.available[0]?.amount || 0;
      const pendingBalance = balance.pending[0]?.amount || 0;

      return {
        availableBalance: availableBalance / 100, // Convert from cents to dollars
        pendingBalance: pendingBalance / 100,
      };
    } catch (error) {
      this.logger.error(
        `Error retrieving Stripe account balance: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve Stripe account balance',
      );
    }
  }

  // Directly update business with Stripe account status (like iXplor)
  async updateBusinessStripeStatus(businessId: string, accountId: string) {
    try {
      this.logger.log(
        `Updating business ${businessId} with Stripe account ${accountId} status`,
      );
      const account = await this.getAccountDetails(accountId);
      const isComplete = await this.isStripeOnboardingComplete(accountId);

      // Update business with account status directly
      return this.businessService.updateStripeStatus(businessId, {
        stripeConnectId: accountId,
        stripeAccountStatus: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          onboardingComplete: isComplete,
          currentlyDue: account.requirements?.currently_due || [],
          eventuallyDue: account.requirements?.eventually_due || [],
          pastDue: account.requirements?.past_due || [],
        },
      });
    } catch (error) {
      this.logger.error(
        `Error updating business Stripe status: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to update business status',
      );
    }
  }

  // Check onboarding status for a business
  async checkOnboardingStatus(
    businessId: string,
  ): Promise<{ isComplete: boolean }> {
    try {
      this.logger.log(`Checking onboarding status for business: ${businessId}`);
      const business = await this.businessService.findById(businessId);

      if (!business?.stripeConnectId) {
        return { isComplete: false };
      }

      const isComplete = await this.isStripeOnboardingComplete(
        business.stripeConnectId,
      );

      // Update business record if status has changed
      if (business.isStripeSetupComplete !== isComplete) {
        await this.updateBusinessStripeStatus(
          businessId,
          business.stripeConnectId,
        );
      }

      return { isComplete };
    } catch (error) {
      this.logger.error(
        `Error checking onboarding status: ${error.message}`,
        error.stack,
      );
      return { isComplete: false };
    }
  }
}
