import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Business } from '../../../../domain/business';
import { QueryBusinessDto } from '../../../../dto/query-business.dto';
import { BusinessRepository } from '../../business.repository';
import { BusinessSchemaClass } from '../../../../business.schema';
import { BusinessMapper } from '../mappers/business.mapper';

@Injectable()
export class BusinessDocumentRepository implements BusinessRepository {
  constructor(
    @InjectModel(BusinessSchemaClass.name)
    private readonly businessModel: Model<BusinessSchemaClass>,
  ) {}

  async create(
    data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Business> {
    const persistenceModel = BusinessMapper.toPersistence(data as Business);
    const createdBusiness = new this.businessModel(persistenceModel);
    const businessObject = await createdBusiness.save();
    return BusinessMapper.toDomain(businessObject);
  }

  async findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: QueryBusinessDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Business[]> {
    const where: any = {};

    if (filterOptions?.displayName) {
      where.displayName = { $regex: filterOptions.displayName, $options: 'i' };
    }

    if (filterOptions?.businessName) {
      where.businessName = {
        $regex: filterOptions.businessName,
        $options: 'i',
      };
    }

    if (filterOptions?.ownerId) {
      where.$or = [
        { primaryOwner: filterOptions.ownerId },
        { owners: filterOptions.ownerId },
      ];
    }

    if (filterOptions?.active !== undefined) {
      where.active = filterOptions.active;
    }

    const businessObjects = await this.businessModel
      .find(where)
      .sort({ createdAt: -1 })
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return businessObjects.map((businessObject) =>
      BusinessMapper.toDomain(businessObject),
    );
  }

  async findOne(options: Partial<Business>): Promise<NullableType<Business>> {
    const businessObject = await this.businessModel.findOne(options);
    return businessObject ? BusinessMapper.toDomain(businessObject) : null;
  }

  async findById(id: Business['id']): Promise<NullableType<Business>> {
    const businessObject = await this.businessModel.findById(id);
    return businessObject ? BusinessMapper.toDomain(businessObject) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Business[]> {
    const businessObjects = await this.businessModel.find({
      $or: [{ primaryOwner: ownerId }, { owners: ownerId }],
    });

    return businessObjects.map((businessObject) =>
      BusinessMapper.toDomain(businessObject),
    );
  }

  async findByDisplayName(
    displayName: string,
  ): Promise<NullableType<Business>> {
    const businessObject = await this.businessModel.findOne({ displayName });
    return businessObject ? BusinessMapper.toDomain(businessObject) : null;
  }

  async update(
    id: Business['id'],
    payload: Partial<Business>,
  ): Promise<NullableType<Business>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;
    delete clonedPayload.createdAt;
    delete clonedPayload.updatedAt;

    const filter = { _id: id };
    const business = await this.businessModel.findOne(filter);

    if (!business) {
      return null;
    }

    const updatedBusiness = await this.businessModel.findOneAndUpdate(
      filter,
      { $set: clonedPayload },
      { new: true },
    );

    return updatedBusiness ? BusinessMapper.toDomain(updatedBusiness) : null;
  }

  async addOwner(
    id: Business['id'],
    ownerId: string,
  ): Promise<NullableType<Business>> {
    const updatedBusiness = await this.businessModel.findOneAndUpdate(
      { _id: id, owners: { $ne: ownerId } },
      { $push: { owners: ownerId } },
      { new: true },
    );

    return updatedBusiness ? BusinessMapper.toDomain(updatedBusiness) : null;
  }

  async removeOwner(
    id: Business['id'],
    ownerId: string,
  ): Promise<NullableType<Business>> {
    const business = await this.businessModel.findById(id);

    if (!business) {
      return null;
    }

    // Don't remove primary owner
    if (business.primaryOwner === ownerId) {
      return BusinessMapper.toDomain(business);
    }

    const updatedBusiness = await this.businessModel.findOneAndUpdate(
      { _id: id },
      { $pull: { owners: ownerId } },
      { new: true },
    );

    return updatedBusiness ? BusinessMapper.toDomain(updatedBusiness) : null;
  }

  async setActive(
    id: Business['id'],
    active: boolean,
  ): Promise<NullableType<Business>> {
    const updatedBusiness = await this.businessModel.findOneAndUpdate(
      { _id: id },
      { $set: { active } },
      { new: true },
    );

    return updatedBusiness ? BusinessMapper.toDomain(updatedBusiness) : null;
  }

  async updateStripeAccountStatus(
    id: Business['id'],
    stripeAccountId: string,
    status: Business['stripeAccountStatus'],
  ): Promise<NullableType<Business>> {
    const updatedBusiness = await this.businessModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          stripeAccountId,
          stripeAccountStatus: status,
        },
      },
      { new: true },
    );

    return updatedBusiness ? BusinessMapper.toDomain(updatedBusiness) : null;
  }
}
