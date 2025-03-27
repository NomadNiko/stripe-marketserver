import {
  Controller,
  Post,
  Headers,
  Req,
  Logger,
  Injectable,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { StripeWebhookService } from './webhook/webhook.service';

interface RawBodyRequest extends Request {
  rawBody?: Buffer | string;
}

@ApiTags('Stripe')
@Controller({
  path: 'stripe',
  version: '1', // Add versioning
})
@Injectable()
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest,
  ) {
    try {
      this.logger.log('Received Stripe webhook');

      const payload = request.rawBody;
      if (!payload) {
        this.logger.warn('Missing payload in webhook request');
        return { error: 'Missing payload' };
      }

      return await this.stripeWebhookService.handleWebhookEvent(
        signature,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Error handling webhook: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
