import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './validation';

@Injectable()
export class OrganizationRepository {
  constructor(private prisma: PrismaService) {}

  async createOrganization(data: CreateOrganizationDto) {
    const organization = await this.prisma.organization.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        createdAt: true,
      },
    });
    return organization;
  }

  async findAllOrganizations() {
    const organizations = await this.prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
    return organizations;
  }

  async findOrganizationById(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        ownerId: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async updateOrganization(id: string, data: UpdateOrganizationDto) {
    const organization = await this.prisma.organization.update({
      where: { id },
      data: {
        name: data.name,
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        createdAt: true,
      },
    });
    return organization;
  }

  async deleteOrganization(id: string) {
    const organization = await this.prisma.organization.delete({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });
    return organization;
  }

  async findOrganizationsByOwnerId(ownerId: string) {
    const organizations = await this.prisma.organization.findMany({
      where: { ownerId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        createdAt: true,
      },
    });
    return organizations;
  }
}
