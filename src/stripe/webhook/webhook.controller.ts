// src/stripe/webhook/webhook.controller.ts
import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhookService } from './webhook.service';

@ApiTags('Stripe')
@Controller({
  path: 'stripe/webhook',
  version: '1',
})
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @ApiExcludeEndpoint() // Don't show in Swagger docs
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Req() request: RawBodyRequest<Request>) {
    const signature = request.headers['stripe-signature'] as string;

    if (!signature) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Missing Stripe signature',
      };
    }

    const payload = request.rawBody;

    if (!payload) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Missing payload',
      };
    }

    return this.webhookService.handleWebhook(payload, signature);
  }
}
