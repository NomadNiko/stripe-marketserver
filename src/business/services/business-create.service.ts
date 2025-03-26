// src/business/services/business-create.service.ts
import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FilesService } from '../../files/files.service';
import { FileType } from '../../files/domain/file';
import { User } from '../../users/domain/user';
import { UsersService } from '../../users/users.service';
import { Business } from '../domain/business';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { BusinessRepository } from '../infrastructure/persistence/business.repository';

@Injectable()
export class BusinessCreateService {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  async create(
    userId: string,
    createBusinessDto: CreateBusinessDto,
  ): Promise<Business> {
    // Check if display name is unique
    const existingBusiness = await this.businessRepository.findByDisplayName(
      createBusinessDto.displayName,
    );
    if (existingBusiness) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          displayName: 'displayNameAlreadyExists',
        },
      });
    }

    // Verify logo exists if provided
    let logo: FileType | null | undefined = undefined;
    if (createBusinessDto.logo?.id) {
      const fileObject = await this.filesService.findById(
        createBusinessDto.logo.id,
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
    }

    // Create business
    const business = await this.businessRepository.create({
      displayName: createBusinessDto.displayName,
      businessName: createBusinessDto.businessName,
      description: createBusinessDto.description,
      logo,
      owners: [userId],
      primaryOwner: userId,
      phone: createBusinessDto.phone,
      website: createBusinessDto.website,
      active: false,
      stripeAccountStatus: {
        onboardingComplete: false,
        paymentsEnabled: false,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        requirementsDisabled: false,
      },
    });

    // Add business ID to user's businessIds array
    await this.updateUserWithBusinessId(userId, business.id);

    return business;
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
}
