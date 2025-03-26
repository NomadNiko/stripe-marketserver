import { FileMapper } from '../../../../../files/infrastructure/persistence/document/mappers/file.mapper';
import { Business } from '../../../../domain/business';
import { BusinessSchemaClass } from '../../../../business.schema';

export class BusinessMapper {
  static toDomain(raw: BusinessSchemaClass): Business {
    const domainEntity = new Business();
    domainEntity.id = raw._id.toString();
    domainEntity.displayName = raw.displayName;
    domainEntity.businessName = raw.businessName;
    domainEntity.description = raw.description;
    if (raw.logo) {
      domainEntity.logo = FileMapper.toDomain(raw.logo);
    }
    domainEntity.stripeAccountId = raw.stripeAccountId;
    domainEntity.stripeAccountStatus = raw.stripeAccountStatus;
    domainEntity.owners = raw.owners;
    domainEntity.primaryOwner = raw.primaryOwner;
    domainEntity.phone = raw.phone;
    domainEntity.website = raw.website;
    domainEntity.active = raw.active;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: Business): BusinessSchemaClass {
    const persistenceSchema = new BusinessSchemaClass();
    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    persistenceSchema.displayName = domainEntity.displayName;
    persistenceSchema.businessName = domainEntity.businessName;
    persistenceSchema.description = domainEntity.description;
    if (domainEntity.logo) {
      persistenceSchema.logo = FileMapper.toPersistence(domainEntity.logo);
    }
    persistenceSchema.stripeAccountId = domainEntity.stripeAccountId;
    persistenceSchema.stripeAccountStatus =
      domainEntity.stripeAccountStatus || {
        onboardingComplete: false,
        paymentsEnabled: false,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        requirementsDisabled: false,
      };
    persistenceSchema.owners = domainEntity.owners;
    persistenceSchema.primaryOwner = domainEntity.primaryOwner;
    persistenceSchema.phone = domainEntity.phone;
    persistenceSchema.website = domainEntity.website;
    persistenceSchema.active = domainEntity.active;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    return persistenceSchema;
  }
}
