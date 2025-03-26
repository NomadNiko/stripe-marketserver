import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessRepository } from '../business.repository';
import {
  BusinessSchemaClass,
  BusinessSchema,
} from '../../../business.schema';
import { BusinessDocumentRepository } from './repositories/business.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessSchemaClass.name, schema: BusinessSchema },
    ]),
  ],
  providers: [
    {
      provide: BusinessRepository,
      useClass: BusinessDocumentRepository,
    },
  ],
  exports: [BusinessRepository],
})
export class DocumentBusinessPersistenceModule {}
