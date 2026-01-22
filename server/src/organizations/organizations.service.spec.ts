import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { OrganizationRepository } from './organization.repository';
import { CreateOrganizationDto, UpdateOrganizationDto } from './validation';
import { HttpStatus } from '@nestjs/common';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let organizationRepository: jest.Mocked<OrganizationRepository>;

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Organization',
    ownerId: 'user-123',
    createdAt: new Date('2024-01-01'),
  };

  const mockOrganizationWithDetails = {
    ...mockOrganization,
    owner: {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
    },
    members: [],
    projects: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: OrganizationRepository,
          useValue: {
            createOrganization: jest.fn(),
            findAllOrganizations: jest.fn(),
            findOrganizationById: jest.fn(),
            updateOrganization: jest.fn(),
            deleteOrganization: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    organizationRepository = module.get(OrganizationRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOrganizationDto: CreateOrganizationDto = {
      name: 'Test Organization',
      ownerId: 'user-123',
    };

    it('should successfully create an organization', async () => {
      organizationRepository.createOrganization.mockResolvedValue(
        mockOrganization,
      );

      const result = await service.create(createOrganizationDto);

      expect(organizationRepository.createOrganization).toHaveBeenCalledWith(
        createOrganizationDto,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Organization created successfully',
        data: {
          id: mockOrganization.id,
          name: mockOrganization.name,
          ownerId: mockOrganization.ownerId,
          createdAt: mockOrganization.createdAt,
        },
      });
    });

    it('should throw error if organization creation fails', async () => {
      organizationRepository.createOrganization.mockResolvedValue(null as any);

      await expect(service.create(createOrganizationDto)).rejects.toThrow(
        'Failed to create organization',
      );
      expect(organizationRepository.createOrganization).toHaveBeenCalledWith(
        createOrganizationDto,
      );
    });

    it('should handle repository errors', async () => {
      organizationRepository.createOrganization.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.create(createOrganizationDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAll', () => {
    const mockOrganizations = [
      {
        ...mockOrganization,
        owner: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        },
      },
      {
        id: 'org-456',
        name: 'Another Organization',
        ownerId: 'user-456',
        createdAt: new Date('2024-01-02'),
        owner: {
          id: 'user-456',
          username: 'anotheruser',
          email: 'another@example.com',
        },
      },
    ];

    it('should successfully find all organizations', async () => {
      organizationRepository.findAllOrganizations.mockResolvedValue(
        mockOrganizations,
      );

      const result = await service.findAll();

      expect(organizationRepository.findAllOrganizations).toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Organizations retrieved successfully',
        data: mockOrganizations,
      });
    });

    it('should throw error if fetching organizations fails', async () => {
      organizationRepository.findAllOrganizations.mockResolvedValue(null as any);

      await expect(service.findAll()).rejects.toThrow(
        'Failed to fetch organizations',
      );
    });

    it('should handle empty organization list', async () => {
      organizationRepository.findAllOrganizations.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Organizations retrieved successfully',
        data: [],
      });
    });

    it('should handle repository errors', async () => {
      organizationRepository.findAllOrganizations.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should successfully find an organization by id', async () => {
      organizationRepository.findOrganizationById.mockResolvedValue(
        mockOrganizationWithDetails,
      );

      const result = await service.findOne('org-123');

      expect(organizationRepository.findOrganizationById).toHaveBeenCalledWith(
        'org-123',
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Organization retrieved successfully',
        data: mockOrganizationWithDetails,
      });
    });

    it('should throw error if organization not found', async () => {
      organizationRepository.findOrganizationById.mockResolvedValue(null as any);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Organization not found',
      );
      expect(organizationRepository.findOrganizationById).toHaveBeenCalledWith(
        'non-existent-id',
      );
    });

    it('should handle repository errors', async () => {
      organizationRepository.findOrganizationById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findOne('org-123')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('update', () => {
    const updateOrganizationDto: UpdateOrganizationDto = {
      name: 'Updated Organization',
    };

    it('should successfully update an organization', async () => {
      const updatedOrganization = {
        ...mockOrganization,
        name: 'Updated Organization',
      };
      organizationRepository.updateOrganization.mockResolvedValue(
        updatedOrganization,
      );

      const result = await service.update('org-123', updateOrganizationDto);

      expect(organizationRepository.updateOrganization).toHaveBeenCalledWith(
        'org-123',
        updateOrganizationDto,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Organization updated successfully',
        data: updatedOrganization,
      });
    });

    it('should throw error if update fails', async () => {
      organizationRepository.updateOrganization.mockResolvedValue(null as any);

      await expect(
        service.update('org-123', updateOrganizationDto),
      ).rejects.toThrow('Failed to update organization');
      expect(organizationRepository.updateOrganization).toHaveBeenCalledWith(
        'org-123',
        updateOrganizationDto,
      );
    });

    it('should handle repository errors', async () => {
      organizationRepository.updateOrganization.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.update('org-123', updateOrganizationDto),
      ).rejects.toThrow('Database error');
    });
  });

  describe('remove', () => {
    it('should successfully delete an organization', async () => {
      const deletedOrganization = {
        id: mockOrganization.id,
        name: mockOrganization.name,
      };
      organizationRepository.deleteOrganization.mockResolvedValue(
        deletedOrganization,
      );

      const result = await service.remove('org-123');

      expect(organizationRepository.deleteOrganization).toHaveBeenCalledWith(
        'org-123',
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Organization deleted successfully',
        data: deletedOrganization,
      });
    });

    it('should throw error if deletion fails', async () => {
      organizationRepository.deleteOrganization.mockResolvedValue(null as any);

      await expect(service.remove('org-123')).rejects.toThrow(
        'Failed to delete organization',
      );
      expect(organizationRepository.deleteOrganization).toHaveBeenCalledWith(
        'org-123',
      );
    });

    it('should handle repository errors', async () => {
      organizationRepository.deleteOrganization.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.remove('org-123')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
