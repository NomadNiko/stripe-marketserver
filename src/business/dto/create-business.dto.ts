import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { FileDto } from '../../files/dto/file.dto';

export class CreateBusinessDto {
  @ApiProperty({
    example: 'acme-store',
    description: 'URL-friendly business name for subdomains',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message:
      'displayName must be lowercase, alphanumeric with optional hyphens',
  })
  displayName: string;

  @ApiProperty({
    example: 'Acme Store',
    description: 'The full business name',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  businessName: string;

  @ApiPropertyOptional({
    example: 'We sell the finest products',
    description: 'A description of the business',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    type: () => FileDto,
    description: 'The business logo',
  })
  @IsOptional()
  logo?: FileDto;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Business contact phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://acme-store.com',
    description: 'Business website URL',
  })
  @IsString()
  @IsOptional()
  website?: string;
}
