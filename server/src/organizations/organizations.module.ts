import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationRepository } from './organization.repository';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationRepository],
})
export class OrganizationsModule {}
