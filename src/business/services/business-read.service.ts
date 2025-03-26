import { Injectable } from '@nestjs/common';
import { IPaginationOptions } from '../../utils/types/pagination-options';
import { NullableType } from '../../utils/types/nullable.type';
import { Business } from '../domain/business';
import { QueryBusinessDto } from '../dto/query-business.dto';
import { BusinessRepository } from '../infrastructure/persistence/business.repository';

@Injectable()
export class BusinessReadService {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: QueryBusinessDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Business[]> {
    return this.businessRepository.findManyWithPagination({
      filterOptions,
      paginationOptions,
    });
  }

  async findById(id: Business['id']): Promise<NullableType<Business>> {
    return this.businessRepository.findById(id);
  }

  async findByOwnerId(ownerId: string): Promise<Business[]> {
    return this.businessRepository.findByOwnerId(ownerId);
  }

  async findByDisplayName(
    displayName: string,
  ): Promise<NullableType<Business>> {
    return this.businessRepository.findByDisplayName(displayName);
  }

  async existsByDisplayName(displayName: string): Promise<boolean> {
    const business =
      await this.businessRepository.findByDisplayName(displayName);
    return !!business;
  }
}
