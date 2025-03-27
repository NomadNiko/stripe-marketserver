// src/stripe/webhook/webhook.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BusinessService } from '../../business/business.service';

@Injectable()
export class StripeWebhookService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeWebhookService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly businessService: BusinessService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY', { infer: true }) ??
        '',
      {
        apiVersion: '2025-02-24.acacia',
      },
    );
    this.webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  async handleWebhookEvent(signature: string, payload: any) {
    try {
      // Verify event if signature is provided
      let event: Stripe.Event;

      if (signature && this.webhookSecret) {
        event = this.stripe.webhooks.constructEvent(
          typeof payload === 'string' ? payload : JSON.stringify(payload),
          signature,
          this.webhookSecret,
        );
      } else {
        // For testing or if no signature/secret provided
        event = typeof payload === 'string' ? JSON.parse(payload) : payload;
      }

      this.logger.log(`Processing webhook event type: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'account.updated':
          return this.handleAccountUpdated(event.data.object as Stripe.Account);
        case 'account.application.authorized':
          // Fix type conversion
          try {
            const accountId =
              typeof (event.data.object as any).account === 'string'
                ? (event.data.object as any).account
                : (event.data.object as any).id;

            if (!accountId) {
              this.logger.warn('Missing account ID in authorization event');
              return { received: true, handled: false };
            }

            const authAccount = await this.stripe.accounts.retrieve(accountId);
            return this.handleAccountAuthorized(authAccount);
          } catch (error) {
            this.logger.error(`Error handling authorization: ${error.message}`);
            return { received: true, handled: false };
          }
        case 'account.application.deauthorized':
          // Fix type conversion
          try {
            const accountId =
              typeof (event.data.object as any).account === 'string'
                ? (event.data.object as any).account
                : (event.data.object as any).id;

            if (!accountId) {
              this.logger.warn('Missing account ID in deauthorization event');
              return { received: true, handled: false };
            }

            const deauthAccount =
              await this.stripe.accounts.retrieve(accountId);
            return this.handleAccountDeauthorized(deauthAccount);
          } catch (error) {
            this.logger.error(
              `Error handling deauthorization: ${error.message}`,
            );
            return { received: true, handled: false };
          }
        case 'capability.updated':
          return this.handleCapabilityUpdated(
            event.data.object as Stripe.Capability,
          );
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
          return { received: true, handled: false };
      }
    } catch (error) {
      this.logger.error(
        `Error handling webhook: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async handleAccountUpdated(account: Stripe.Account) {
    try {
      this.logger.log(`Stripe account updated: ${account.id}`);

      // Find businesses by Stripe Connect ID
      const businesses = await this.businessService.findManyWithPagination({
        filterOptions: null,
        paginationOptions: {
          page: 1,
          limit: 100,
        },
      });

      // Find business with matching stripeConnectId
      const business = businesses.find((b) => b.stripeConnectId === account.id);

      if (!business) {
        this.logger.warn(
          `No business found for Stripe account ID: ${account.id}`,
        );
        return { received: true, handled: false };
      }

      // Check if onboarding is complete
      const isComplete =
        account.details_submitted &&
        account.charges_enabled &&
        account.payouts_enabled &&
        !account.requirements?.disabled_reason &&
        (!account.requirements?.currently_due?.length ||
          account.requirements.currently_due.length === 0);

      // Update business with latest account status
      await this.businessService.updateStripeStatus(business.id, {
        stripeConnectId: account.id,
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

      return { received: true, handled: true };
    } catch (error) {
      this.logger.error(
        `Error handling account.updated webhook: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async handleAccountAuthorized(account: Stripe.Account) {
    this.logger.log(`Account authorized: ${account.id}`);
    // Update business with latest account status
    return this.handleAccountUpdated(account);
  }

  async handleAccountDeauthorized(account: Stripe.Account) {
    this.logger.log(`Account deauthorized: ${account.id}`);
    // Update business with latest account status
    return this.handleAccountUpdated(account);
  }

  async handleCapabilityUpdated(capability: Stripe.Capability) {
    this.logger.log(
      `Capability updated for account ${capability.account}: ${capability.id}`,
    );

    if (typeof capability.account === 'string') {
      // Get the full account object
      const account = await this.stripe.accounts.retrieve(capability.account);
      // Update business with latest account status
      return this.handleAccountUpdated(account);
    } else {
      this.logger.warn(
        `Invalid account reference in capability: ${capability.id}`,
      );
      return { received: true, handled: false };
    }
  }
}
