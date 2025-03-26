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
    const isAdmin = req.user.role?.id === RoleEnum.admin;
    const isOwner = business?.owners.includes(req.user.id);
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

  @ApiOperation({ summary: 'Update business' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business updated',
    type: Business,
  })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['admin', 'business'],
  })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @Request() req,
  ) {
    const business = await this.businessService.findById(id);
    // Check if the user is an admin or owns the business
    const isAdmin = req.user.role?.id === RoleEnum.admin;
    const isOwner = business?.owners.includes(req.user.id);
    if (!isAdmin && !isOwner) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'You do not have permission to update this business',
      };
    }
    return this.businessService.update(id, updateBusinessDto);
  }

  @ApiOperation({ summary: 'Add owner to business' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Owner added to business',
    type: Business,
  })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['admin', 'business'],
  })
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/owners')
  @HttpCode(HttpStatus.OK)
  async addOwner(
    @Param('id') id: string,
    @Body('ownerId') ownerId: string,
    @Request() req,
  ) {
    const business = await this.businessService.findById(id);
    // Check if the user is an admin or the primary owner
    const isAdmin = req.user.role?.id === RoleEnum.admin;
    const isPrimaryOwner = business?.primaryOwner === req.user.id;
    if (!isAdmin && !isPrimaryOwner) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Only administrators or the primary owner can add owners',
      };
    }
    return this.businessService.addOwner(id, ownerId);
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
    return this.businessService.findByOwnerId(req.user.id);
  }

  @ApiOperation({ summary: 'Get business by display name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business found',
    type: Business,
  })
  @ApiParam({ name: 'displayName', description: 'Business display name' })
  @Get('by-display-name/:displayName')
  @HttpCode(HttpStatus.OK)
  async findByDisplayName(@Param('displayName') displayName: string) {
    const business = await this.businessService.findByDisplayName(displayName);
    // Remove sensitive information for public view
    if (business) {
      const businessCopy = { ...business };
      businessCopy.stripeAccountId = undefined;
      businessCopy.stripeAccountStatus = undefined;
      businessCopy.owners = [];
      return businessCopy;
    }
    return business;
  }
}
