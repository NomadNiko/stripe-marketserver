import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleEnum } from '../roles/roles.enum';
import {
  AccountLinkResponseDto,
  CreateAccountLinkDto,
} from './dto/account-link.dto';
import { AccountStatusResponseDto } from './dto/account-status.dto';
import { StripeService } from './stripe.service';

@ApiTags('Stripe')
@Controller({
  path: 'stripe',
  version: '1',
})
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @ApiOperation({ summary: 'Create a Stripe Connect account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stripe Connect account created',
    type: String,
  })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @UseGuards(AuthGuard('jwt'))
  @Post('connect-account/:businessId')
  @HttpCode(HttpStatus.OK)
  async createConnectAccount(
    @Param('businessId') businessId: string,
    @Request() req,
  ) {
    // Check if user is an admin or owns the business
    if (
      req.user.role?.id !== RoleEnum.admin &&
      !req.user.businessIds?.includes(businessId)
    ) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message:
          'You do not have permission to create a Stripe account for this business',
      };
    }
    return this.stripeService.createConnectAccount(businessId);
  }

  @ApiOperation({ summary: 'Create a Stripe Connect account link' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stripe Connect account link created',
    type: AccountLinkResponseDto,
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('account-link')
  @HttpCode(HttpStatus.OK)
  async createAccountLink(
    @Body() dto: CreateAccountLinkDto,
    @Query('businessId') businessId: string | undefined,
    @Request() req,
  ) {
    // Check if user is an admin or owns the business
    if (
      businessId &&
      req.user.role?.id !== RoleEnum.admin &&
      !req.user.businessIds?.includes(businessId)
    ) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message:
          'You do not have permission to create an account link for this business',
      };
    }
    return this.stripeService.createAccountLink(dto, businessId);
  }

  @ApiOperation({ summary: 'Get Stripe Connect account status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stripe Connect account status',
    type: AccountStatusResponseDto,
  })
  @ApiParam({ name: 'accountId', description: 'Stripe account ID' })
  @UseGuards(AuthGuard('jwt'))
  @Get('account-status/:accountId')
  @HttpCode(HttpStatus.OK)
  async getAccountStatus(
    @Param('accountId') accountId: string,
    @Request() req,
  ) {
    // Only allow admins to check any account
    // For business users, ensure they have access to the business with this account
    if (req.user.role?.id !== RoleEnum.admin) {
      // Implementation would need to check if the user has access to the business
      // with this account ID - this requires a lookup from business to account ID
    }
    return this.stripeService.getAccountStatus(accountId);
  }

  @ApiOperation({
    summary: 'Update business with latest Stripe account status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business updated with Stripe status',
  })
  @ApiParam({ name: 'accountId', description: 'Stripe account ID' })
  @UseGuards(AuthGuard('jwt'))
  @Post('update-status/:accountId')
  @HttpCode(HttpStatus.OK)
  async updateBusinessStripeStatus(
    @Param('accountId') accountId: string,
    @Request() req,
  ) {
    // Only allow admins or owners of the business to update status
    if (req.user.role?.id !== RoleEnum.admin) {
      // Implementation would need to check if the user has access to the business
      // with this account ID - this requires a lookup from business to account ID
    }
    return this.stripeService.updateBusinessStripeStatus(accountId);
  }
}
