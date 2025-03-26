import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BusinessRegistrationService,
  BusinessRegisterDto,
} from './services/business-registration.service';

@ApiTags('Auth')
@Controller({
  path: 'auth/business',
  version: '1',
})
export class BusinessAuthController {
  constructor(
    private readonly businessRegistrationService: BusinessRegistrationService,
  ) {}

  @ApiOperation({ summary: 'Register a new business account' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Registration successful',
  })
  @Post('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Body() registerDto: BusinessRegisterDto): Promise<void> {
    return this.businessRegistrationService.register(registerDto);
  }
}
