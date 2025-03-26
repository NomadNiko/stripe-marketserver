import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BusinessService } from '../../business/business.service';
import { CreateBusinessDto } from '../../business/dto/create-business.dto';
import { RoleEnum } from '../../roles/roles.enum';
import { StatusEnum } from '../../statuses/statuses.enum';
import { User } from '../../users/domain/user';
import { UsersService } from '../../users/users.service';
import { AuthProvidersEnum } from '../auth-providers.enum';

export interface BusinessRegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  business: CreateBusinessDto;
}

@Injectable()
export class BusinessRegistrationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly businessService: BusinessService,
  ) {}

  async register(dto: BusinessRegisterDto): Promise<void> {
    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailAlreadyExists',
        },
      });
    }

    // Check if business display name already exists
    const existingBusiness = await this.businessService.existsByDisplayName(
      dto.business.displayName,
    );
    if (existingBusiness) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          'business.displayName': 'displayNameAlreadyExists',
        },
      });
    }

    // Create user with business role
    const user = await this.usersService.create({
      ...dto,
      email: dto.email,
      role: {
        id: RoleEnum.business,
      },
      status: {
        id: StatusEnum.inactive,
      },
    });

    // Create business
    await this.businessService.create(user.id.toString(), dto.business);
  }
}
