// src/business/business.service.ts

import { Injectable } from '@nestjs/common';
import { Business } from './domain/business';
import { BusinessCreateService } from './services/business-create.service';
import { BusinessReadService } from './services/business-read.service';
import { BusinessUpdateService } from './services/business-update.service';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NullableType } from '../utils/types/nullable.type';
import { CreateBusinessDto } from './dto/create-business.dto';
import { QueryBusinessDto } from './dto/query-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    private readonly businessCreateService: BusinessCreateService,
    private readonly businessReadService: BusinessReadService,
    private readonly businessUpdateService: BusinessUpdateService,
  ) {}

  async create(
    userId: string,
    createBusinessDto: CreateBusinessDto,
  ): Promise<Business> {
    return this.businessCreateService.create(userId, createBusinessDto);
  }

  async findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: QueryBusinessDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Business[]> {
    return this.businessReadService.findManyWithPagination({
      filterOptions,
      paginationOptions,
    });
  }

  async findById(id: Business['id']): Promise<NullableType<Business>> {
    return this.businessReadService.findById(id);
  }

  async findByOwnerId(ownerId: string): Promise<Business[]> {
    return this.businessReadService.findByOwnerId(ownerId);
  }

  async findByDisplayName(
    displayName: string,
  ): Promise<NullableType<Business>> {
    return this.businessReadService.findByDisplayName(displayName);
  }

  async existsByDisplayName(displayName: string): Promise<boolean> {
    return this.businessReadService.existsByDisplayName(displayName);
  }

  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business> {
    return this.businessUpdateService.update(id, updateBusinessDto);
  }

  async addOwner(id: string, ownerId: string): Promise<Business> {
    return this.businessUpdateService.addOwner(id, ownerId);
  }

  async removeOwner(id: string, ownerId: string): Promise<Business> {
    return this.businessUpdateService.removeOwner(id, ownerId);
  }

  async setActive(id: string, active: boolean): Promise<Business> {
    return this.businessUpdateService.setActive(id, active);
  }

  async updateStripeAccount(
    id: string,
    stripeAccountId: string,
    status: Business['stripeAccountStatus'],
  ): Promise<Business> {
    return this.businessUpdateService.updateStripeAccount(
      id,
      stripeAccountId,
      status || {
        onboardingComplete: false,
        paymentsEnabled: false,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        requirementsDisabled: false,
      },
    );
  }

  async updateStripeConnectId(
    businessId: string,
    stripeConnectId: string,
  ): Promise<Business> {
    return this.businessUpdateService.updateStripeConnectId(
      businessId,
      stripeConnectId,
    );
  }

  async updateStripeStatus(
    businessId: string,
    statusData: {
      stripeConnectId: string;
      stripeAccountStatus: {
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        detailsSubmitted: boolean;
        onboardingComplete: boolean;
        currentlyDue?: string[];
        eventuallyDue?: string[];
        pastDue?: string[];
      };
    },
  ): Promise<Business> {
    return this.businessUpdateService.updateStripeStatus(
      businessId,
      statusData,
    );
  }
}
