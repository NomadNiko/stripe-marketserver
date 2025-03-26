import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeService } from '../stripe.service';

@Injectable()
export class WebhookService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(WebhookService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly stripeService: StripeService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || '',
      {
        apiVersion: '2025-02-24.acacia',
      },
    );
    this.webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  async handleWebhook(payload: Buffer, signature: string) {
    try {
      // Verify event
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );

      // Handle different event types
      switch (event.type) {
        case 'account.updated':
          return this.handleAccountUpdated(event);
        case 'account.application.authorized':
          return this.handleAccountAuthorized(event);
        case 'account.application.deauthorized':
          return this.handleAccountDeauthorized(event);
        case 'capability.updated':
          return this.handleCapabilityUpdated(event);
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

  private async handleAccountUpdated(event: Stripe.Event) {
    const account = event.data.object as Stripe.Account;
    this.logger.log(`Account updated: ${account.id}`);
    // Update business with latest account status
    await this.stripeService.updateBusinessStripeStatus(account.id);
    return { received: true, handled: true };
  }

  private async handleAccountAuthorized(event: Stripe.Event) {
    const account = event.data.object as Stripe.Account;
    this.logger.log(`Account authorized: ${account.id}`);
    // Update business with latest account status
    await this.stripeService.updateBusinessStripeStatus(account.id);
    return { received: true, handled: true };
  }

  private async handleAccountDeauthorized(event: Stripe.Event) {
    const account = event.data.object as Stripe.Account;
    this.logger.log(`Account deauthorized: ${account.id}`);
    // Update business with latest account status
    await this.stripeService.updateBusinessStripeStatus(account.id);
    return { received: true, handled: true };
  }

  private async handleCapabilityUpdated(event: Stripe.Event) {
    const capability = event.data.object as Stripe.Capability;
    this.logger.log(
      `Capability updated for account ${capability.account}: ${capability.id}`,
    );
    // Update business with latest account status
    await this.stripeService.updateBusinessStripeStatus(
      capability.account as string,
    );
    return { received: true, handled: true };
  }
}
