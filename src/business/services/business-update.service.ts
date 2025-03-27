// src/business/services/business-update.service.ts

import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FilesService } from '../../files/files.service';
import { FileType } from '../../files/domain/file';
import { UsersService } from '../../users/users.service';
import { Business, StripeAccountStatus } from '../domain/business';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { BusinessRepository } from '../infrastructure/persistence/business.repository';
import { NullableType } from '../../utils/types/nullable.type';

@Injectable()
export class BusinessUpdateService {
  private readonly logger = new Logger(BusinessUpdateService.name);

  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business> {
    try {
      const business = await this.businessRepository.findById(id);
      if (!business) {
        throw new NotFoundException('Business not found');
      }

      // Check if display name is being changed and if the new name is unique
      if (
        updateBusinessDto.displayName &&
        updateBusinessDto.displayName !== business.displayName
      ) {
        const existingBusiness =
          await this.businessRepository.findByDisplayName(
            updateBusinessDto.displayName,
          );
        if (existingBusiness) {
          throw new UnprocessableEntityException({
            displayName: 'displayNameAlreadyExists',
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
            logo: 'logoNotExists',
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
    } catch (error) {
      this.logger.error(
        `Error updating business: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async addOwner(id: string, ownerId: string): Promise<Business> {
    try {
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
      const updatedBusiness = await this.businessRepository.addOwner(
        id,
        ownerId,
      );
      if (!updatedBusiness) {
        throw new NotFoundException('Failed to update business');
      }

      // Add business to user's businesses if needed

      return updatedBusiness;
    } catch (error) {
      this.logger.error(
        `Error adding owner to business: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async removeOwner(id: string, ownerId: string): Promise<Business> {
    try {
      const business = await this.businessRepository.findById(id);
      if (!business) {
        throw new NotFoundException('Business not found');
      }

      // Can't remove primary owner
      if (business.primaryOwner === ownerId) {
        throw new UnprocessableEntityException({
          ownerId: 'cannotRemovePrimaryOwner',
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

      // Remove business from user's businesses if needed

      return updatedBusiness;
    } catch (error) {
      this.logger.error(
        `Error removing owner from business: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateStripeConnectId(
    businessId: string,
    stripeConnectId: string,
  ): Promise<Business> {
    try {
      this.logger.log(
        `Updating business ${businessId} with Stripe Connect ID ${stripeConnectId}`,
      );

      const updatedBusiness = await this.businessRepository.update(businessId, {
        stripeConnectId,
        updatedAt: new Date(),
      });

      if (!updatedBusiness) {
        throw new NotFoundException(`Business with ID ${businessId} not found`);
      }

      return updatedBusiness;
    } catch (error) {
      this.logger.error(
        `Error updating Stripe Connect ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateStripeAccount(
    id: string,
    stripeAccountId: string,
    statusData: StripeAccountStatus,
  ): Promise<Business> {
    try {
      const business = await this.businessRepository.findById(id);
      if (!business) {
        throw new NotFoundException(`Business with ID ${id} not found`);
      }

      const updatedBusiness = await this.businessRepository.update(id, {
        stripeAccountId,
        stripeAccountStatus: statusData,
        updatedAt: new Date(),
      });

      if (!updatedBusiness) {
        throw new NotFoundException(`Failed to update business ${id}`);
      }

      return updatedBusiness;
    } catch (error) {
      this.logger.error(
        `Error updating Stripe account: ${error.message}`,
        error.stack,
      );
      throw error;
    }
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
    try {
      this.logger.log(`Updating business ${businessId} with Stripe status`);

      const business = await this.businessRepository.findById(businessId);
      if (!business) {
        throw new NotFoundException(`Business with ID ${businessId} not found`);
      }

      // Create a proper StripeAccountStatus object
      const stripeAccountStatus: StripeAccountStatus = {
        chargesEnabled: statusData.stripeAccountStatus.chargesEnabled,
        payoutsEnabled: statusData.stripeAccountStatus.payoutsEnabled,
        detailsSubmitted: statusData.stripeAccountStatus.detailsSubmitted,
        onboardingComplete: statusData.stripeAccountStatus.onboardingComplete,
        paymentsEnabled: statusData.stripeAccountStatus.chargesEnabled,
        requirementsDisabled: false,
        currentlyDue: statusData.stripeAccountStatus.currentlyDue,
        eventuallyDue: statusData.stripeAccountStatus.eventuallyDue,
        pastDue: statusData.stripeAccountStatus.pastDue,
      };

      // Update business with Stripe status
      const updatedBusiness = await this.businessRepository.update(businessId, {
        stripeConnectId: statusData.stripeConnectId,
        stripeAccountStatus,
        // If onboarding is complete, set isStripeSetupComplete to true
        isStripeSetupComplete:
          statusData.stripeAccountStatus.onboardingComplete,
        updatedAt: new Date(),
      });

      if (!updatedBusiness) {
        throw new NotFoundException(`Failed to update business ${businessId}`);
      }

      // If onboarding is complete and business is still inactive, activate it
      if (
        statusData.stripeAccountStatus.onboardingComplete &&
        statusData.stripeAccountStatus.chargesEnabled &&
        statusData.stripeAccountStatus.payoutsEnabled &&
        !business.active
      ) {
        return this.setActive(businessId, true);
      }

      return updatedBusiness;
    } catch (error) {
      this.logger.error(
        `Error updating business Stripe status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async setActive(id: string, active: boolean): Promise<Business> {
    try {
      const updatedBusiness = await this.businessRepository.setActive(
        id,
        active,
      );
      if (!updatedBusiness) {
        throw new NotFoundException('Business not found');
      }
      return updatedBusiness;
    } catch (error) {
      this.logger.error(
        `Error setting business active status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
