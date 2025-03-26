import { Injectable } from '@nestjs/common';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NullableType } from '../utils/types/nullable.type';
import { Business } from './domain/business';
import { CreateBusinessDto } from './dto/create-business.dto';
import { QueryBusinessDto } from './dto/query-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessCreateService } from './services/business-create.service';
import { BusinessReadService } from './services/business-read.service';
import { BusinessUpdateService } from './services/business-update.service';

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
      status,
    );
  }
}
