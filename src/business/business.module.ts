import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { UsersModule } from '../users/users.module';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { DocumentBusinessPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { BusinessCreateService } from './services/business-create.service';
import { BusinessReadService } from './services/business-read.service';
import { BusinessUpdateService } from './services/business-update.service';

@Module({
  imports: [DocumentBusinessPersistenceModule, UsersModule, FilesModule],
  controllers: [BusinessController],
  providers: [
    BusinessService,
    BusinessCreateService,
    BusinessReadService,
    BusinessUpdateService,
  ],
  exports: [BusinessService],
})
export class BusinessModule {}
