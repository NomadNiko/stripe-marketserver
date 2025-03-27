import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StripeConnectService } from './stripe-connect.service';
import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { BusinessService } from '../business/business.service';
import { StripeBalanceResponseDto } from './dto/stripe-balance.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Stripe Connect')
@Controller('stripe-connect')
export class StripeConnectController {
  private readonly logger = new Logger(StripeConnectController.name);

  constructor(
    private readonly stripeConnectService: StripeConnectService,
    private readonly businessService: BusinessService,
  ) {}

  @Post('account')
  @ApiOperation({ summary: 'Create or retrieve a Stripe Connect account' })
  @ApiResponse({
    status: 200,
    description: 'Returns the account ID',
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createOrGetAccount(
    @Body() body: { businessId?: string },
    @Request() req,
  ) {
    try {
      this.logger.log(
        `Create/Get account request for business: ${body.businessId}`,
      );
      let existingStripeId: string | undefined;

      if (body.businessId) {
        const businessResponse = await this.businessService.findById(
          body.businessId,
        );
        existingStripeId = businessResponse?.stripeConnectId;
      }

      const account =
        await this.stripeConnectService.getOrCreateConnectAccount(
          existingStripeId,
        );

      // If business ID provided, update it directly
      if (body.businessId && account.id) {
        await this.businessService.updateStripeConnectId(
          body.businessId,
          account.id,
        );
      }

      this.logger.log(
        `Created/Retrieved account ${account.id} for business ${body.businessId}`,
      );
      return { account: account.id };
    } catch (error) {
      this.logger.error(
        `Error with Stripe account: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('account-session')
  @ApiOperation({ summary: 'Create a Stripe Connect account session' })
  @ApiResponse({
    status: 200,
    description: 'Returns the account session client secret',
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createAccountSession(@Body() body: { accountId: string }) {
    try {
      this.logger.log(
        `Creating account session for account: ${body.accountId}`,
      );
      const accountSession =
        await this.stripeConnectService.createAccountSession(body.accountId);
      return {
        client_secret: accountSession.client_secret,
      };
    } catch (error) {
      this.logger.error(
        `Error creating Stripe account session: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('update-business/:businessId')
  @ApiOperation({ summary: 'Update business with Stripe account details' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async updateBusinessStripeStatus(
    @Param('businessId') businessId: string,
    @Body() body: { id: string },
  ) {
    try {
      this.logger.log(
        `Updating business ${businessId} with Stripe account ${body.id} status`,
      );
      return this.stripeConnectService.updateBusinessStripeStatus(
        businessId,
        body.id,
      );
    } catch (error) {
      this.logger.error(
        `Error updating business Stripe status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('status/:accountId')
  @ApiOperation({ summary: 'Get Stripe account status' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getAccountStatus(@Param('accountId') accountId: string) {
    try {
      this.logger.log(`Getting status for account: ${accountId}`);
      const account =
        await this.stripeConnectService.getAccountDetails(accountId);
      const isComplete =
        await this.stripeConnectService.isStripeOnboardingComplete(accountId);

      return {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        onboardingComplete: isComplete,
        requirements: {
          currentlyDue: account.requirements?.currently_due || [],
          eventuallyDue: account.requirements?.eventually_due || [],
          pastDue: account.requirements?.past_due || [],
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting account status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('onboarding-status/:businessId')
  @ApiOperation({ summary: 'Check if onboarding is complete for a business' })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async checkOnboardingStatus(@Param('businessId') businessId: string) {
    try {
      this.logger.log(`Checking onboarding status for business: ${businessId}`);
      return this.stripeConnectService.checkOnboardingStatus(businessId);
    } catch (error) {
      this.logger.error(
        `Error checking onboarding status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('balance/:businessId')
  @ApiOperation({ summary: 'Get Stripe account balance for a business' })
  @ApiResponse({
    status: 200,
    description: 'Returns the available and pending balance',
    type: StripeBalanceResponseDto,
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getBusinessStripeBalance(@Param('businessId') businessId: string) {
    try {
      this.logger.log(`Getting Stripe balance for business: ${businessId}`);
      const business = await this.businessService.findById(businessId);

      if (!business?.stripeConnectId) {
        return {
          availableBalance: 0,
          pendingBalance: 0,
        };
      }

      return this.stripeConnectService.getAccountBalance(
        business.stripeConnectId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting Stripe balance: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
