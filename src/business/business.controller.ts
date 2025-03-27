import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleEnum } from '../roles/roles.enum';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';
import { BusinessService } from './business.service';
import { Business } from './domain/business';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { QueryBusinessDto } from './dto/query-business.dto';
import { InfinityPaginationResponse } from '../utils/dto/infinity-pagination-response.dto';

@ApiTags('Businesses')
@Controller({
  path: 'businesses',
  version: '1',
})
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @ApiOperation({ summary: 'Get all businesses with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get businesses with pagination',
    type: InfinityPaginationResponse(Business),
  })
  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryBusinessDto) {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.businessService.findManyWithPagination({
        filterOptions: query,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @ApiOperation({ summary: 'Get business by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business found',
    type: Business,
  })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['admin', 'business'],
  })
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @Request() req) {
    const business = await this.businessService.findById(id);

    // Check if the user is an admin or owns the business
    const isAdmin = String(req.user.role?.id) === String(RoleEnum.admin);
    const isOwner = business?.owners.includes(String(req.user.id));

    if (!isAdmin && !isOwner) {
      // For non-owners, remove sensitive information
      if (business) {
        const businessCopy = { ...business };
        businessCopy.stripeAccountId = undefined;
        businessCopy.stripeAccountStatus = undefined;
        businessCopy.owners = [];
        return businessCopy;
      }
    }

    return business;
  }

  @ApiOperation({ summary: 'Get businesses owned by current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of businesses',
    type: [Business],
  })
  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['business'],
  })
  @UseGuards(AuthGuard('jwt'))
  @Get('user/me')
  @HttpCode(HttpStatus.OK)
  async getMyBusinesses(@Request() req) {
    const businesses = await this.businessService.findByOwnerId(req.user.id);
    // Return standardized format matching frontend expectations
    return {
      data: businesses,
      hasNextPage: false,
    };
  }
}
