import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BusinessModule } from '../business/business.module';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { WebhookController } from './webhook/webhook.controller';
import { WebhookService } from './webhook/webhook.service';

@Module({
  imports: [ConfigModule, BusinessModule],
  controllers: [StripeController, WebhookController],
  providers: [StripeService, WebhookService],
  exports: [StripeService],
})
export class StripeModule {}
