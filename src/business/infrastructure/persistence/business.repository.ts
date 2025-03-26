import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { NullableType } from '../../../utils/types/nullable.type';
import { Business } from '../../domain/business';
import { QueryBusinessDto } from '../../dto/query-business.dto';

export abstract class BusinessRepository {
  abstract create(
    data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Business>;

  abstract findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: QueryBusinessDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Business[]>;

  abstract findOne(options: Partial<Business>): Promise<NullableType<Business>>;

  abstract findById(id: Business['id']): Promise<NullableType<Business>>;

  abstract findByOwnerId(ownerId: string): Promise<Business[]>;

  abstract findByDisplayName(
    displayName: string,
  ): Promise<NullableType<Business>>;

  abstract update(
    id: Business['id'],
    payload: Partial<Business>,
  ): Promise<NullableType<Business>>;

  abstract addOwner(
    id: Business['id'],
    ownerId: string,
  ): Promise<NullableType<Business>>;

  abstract removeOwner(
    id: Business['id'],
    ownerId: string,
  ): Promise<NullableType<Business>>;

  abstract setActive(
    id: Business['id'],
    active: boolean,
  ): Promise<NullableType<Business>>;

  abstract updateStripeAccountStatus(
    id: Business['id'],
    stripeAccountId: string,
    status: Business['stripeAccountStatus'],
  ): Promise<NullableType<Business>>;
}
