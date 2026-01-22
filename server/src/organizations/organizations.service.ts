import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrganizationDto, UpdateOrganizationDto } from './validation';
import { OrganizationRepository } from './organization.repository';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}
  async create(createOrganizationDto: CreateOrganizationDto) {
    const organization = await this.organizationRepository.createOrganization(
      createOrganizationDto,
    );
    if (!organization) {
      throw new Error('Failed to create organization');
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Organization created successfully',
      data: {
        id: organization.id,
        name: organization.name,
        ownerId: organization.ownerId,
        createdAt: organization.createdAt,
      },
    };
  }

  async findAll() {
    const organization = await this.organizationRepository.findAllOrganizations();
    if (!organization) {
      throw new Error('Failed to fetch organizations');
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Organizations retrieved successfully',
      data: organization,
    };
  }

  async findOne(id: string) {
    const organization =
      await this.organizationRepository.findOrganizationById(id);
    if (!organization) {
      throw new Error('Organization not found');
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Organization retrieved successfully',
      data: organization,
    };
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    const organization = await this.organizationRepository.updateOrganization(
      id,
      updateOrganizationDto,
    );
    if (!organization) {
      throw new Error('Failed to update organization');
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Organization updated successfully',
      data: organization,
    };
  }

  async remove(id: string) {
    const organization =
      await this.organizationRepository.deleteOrganization(id);
    if (!organization) {
      throw new Error('Failed to delete organization');
    }
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Organization deleted successfully',
      data: organization,
    };
  }
}
