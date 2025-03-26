// src/business/services/business-update.service.ts
import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FilesService } from '../../files/files.service';
import { FileType } from '../../files/domain/file';
import { UsersService } from '../../users/users.service';
import { Business } from '../domain/business';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { BusinessRepository } from '../infrastructure/persistence/business.repository';

@Injectable()
export class BusinessUpdateService {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business> {
    const business = await this.businessRepository.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Check if display name is being changed and if the new name is unique
    if (
      updateBusinessDto.displayName &&
      updateBusinessDto.displayName !== business.displayName
    ) {
      const existingBusiness = await this.businessRepository.findByDisplayName(
        updateBusinessDto.displayName,
      );
      if (existingBusiness) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            displayName: 'displayNameAlreadyExists',
          },
        });
      }
    }

    // Verify logo exists if provided
    let logo: FileType | null | undefined = undefined;
    if (updateBusinessDto.logo?.id) {
      const fileObject = await this.filesService.findById(
        updateBusinessDto.logo.id,
      );
      if (!fileObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            logo: 'logoNotExists',
          },
        });
      }
      logo = fileObject;
    } else if (updateBusinessDto.logo === null) {
      logo = null;
    }

    const updatedBusiness = await this.businessRepository.update(id, {
      ...(updateBusinessDto.displayName && {
        displayName: updateBusinessDto.displayName,
      }),
      ...(updateBusinessDto.businessName && {
        businessName: updateBusinessDto.businessName,
      }),
      ...(updateBusinessDto.description !== undefined && {
        description: updateBusinessDto.description,
      }),
      ...(logo !== undefined && { logo }),
      ...(updateBusinessDto.phone !== undefined && {
        phone: updateBusinessDto.phone,
      }),
      ...(updateBusinessDto.website !== undefined && {
        website: updateBusinessDto.website,
      }),
    });

    if (!updatedBusiness) {
      throw new NotFoundException('Business not found');
    }
    return updatedBusiness;
  }

  async addOwner(id: string, ownerId: string): Promise<Business> {
    const business = await this.businessRepository.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Check if user exists
    const user = await this.usersService.findById(ownerId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add owner to business
    const updatedBusiness = await this.businessRepository.addOwner(id, ownerId);
    if (!updatedBusiness) {
      throw new NotFoundException('Failed to update business');
    }

    // Add business to user's businesses
    await this.updateUserWithBusinessId(ownerId, id);

    return updatedBusiness;
  }

  async removeOwner(id: string, ownerId: string): Promise<Business> {
    const business = await this.businessRepository.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Can't remove primary owner
    if (business.primaryOwner === ownerId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          ownerId: 'cannotRemovePrimaryOwner',
        },
      });
    }

    // Remove owner from business
    const updatedBusiness = await this.businessRepository.removeOwner(
      id,
      ownerId,
    );
    if (!updatedBusiness) {
      throw new NotFoundException('Failed to update business');
    }

    // Remove business from user's businesses
    await this.removeUserBusinessId(ownerId, id);

    return updatedBusiness;
  }

  async setActive(id: string, active: boolean): Promise<Business> {
    const business = await this.businessRepository.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    const updatedBusiness = await this.businessRepository.setActive(id, active);
    if (!updatedBusiness) {
      throw new NotFoundException('Failed to update business');
    }
    return updatedBusiness;
  }

  async updateStripeAccount(
    id: string,
    stripeAccountId: string,
    status?: Business['stripeAccountStatus'],
  ): Promise<Business> {
    const business = await this.businessRepository.findById(id);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Ensure status is defined
    const accountStatus = status || {
      onboardingComplete: false,
      paymentsEnabled: false,
      detailsSubmitted: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      requirementsDisabled: false,
    };

    const updatedBusiness =
      await this.businessRepository.updateStripeAccountStatus(
        id,
        stripeAccountId,
        accountStatus,
      );

    if (!updatedBusiness) {
      throw new NotFoundException('Failed to update business');
    }

    // If all requirements are met, activate the business
    if (
      accountStatus.chargesEnabled &&
      accountStatus.payoutsEnabled &&
      accountStatus.detailsSubmitted &&
      !accountStatus.requirementsDisabled
    ) {
      return this.setActive(id, true);
    }

    return updatedBusiness;
  }

  // Helper method to update user with business ID
  private async updateUserWithBusinessId(
    userId: string,
    businessId: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (user) {
      const businessIds = user.businessIds || [];
      if (!businessIds.includes(businessId)) {
        businessIds.push(businessId);
        await this.usersService.update(userId, { businessIds });
      }
    }
  }

  // Helper method to remove business ID from user
  private async removeUserBusinessId(
    userId: string,
    businessId: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (user && user.businessIds) {
      const businessIds = user.businessIds.filter((id) => id !== businessId);
      await this.usersService.update(userId, { businessIds });
    }
  }
}
