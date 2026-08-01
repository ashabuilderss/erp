import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PropertiesService } from './properties.service';

describe('PropertiesService employee access', () => {
  const mockPrisma = () => ({
    property: { findFirst: jest.fn() },
    employee: { findFirst: jest.fn() },
  });
  const mockEmitter = () => ({ emit: jest.fn() });
  const mockTransition = {
    execute: jest
      .fn()
      .mockRejectedValue(
        new BadRequestException(
          'Employees can only update their own properties',
        ),
      ),
    validate: jest.fn(),
  } as never;
  const mockGovernanceEventPublisher = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  it('scopes detail lookup to the assigned employee', async () => {
    const prisma = {
      property: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new PropertiesService(
      prisma as never,
      { emit: jest.fn() } as never,
      mockTransition,
      mockGovernanceEventPublisher as never,
    );

    await expect(
      service.findOne('property-1', 'company-1', 'employee-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.property.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'property-1',
          companyId: 'company-1',
          deletedAt: null,
          assignedToEmployeeId: 'employee-1',
        },
      }),
    );
  });

  it('denies employee create with non-self assignment', async () => {
    const prisma = mockPrisma();
    prisma.employee.findFirst.mockResolvedValue({ id: 'other' });
    const service = new PropertiesService(
      prisma as never,
      mockEmitter() as never,
      mockTransition,
      mockGovernanceEventPublisher as never,
    );

    await expect(
      service.create(
        {
          title: 'Test',
          type: 'APARTMENT',
          status: 'AVAILABLE',
          price: 100000,
          location: 'X',
          city: 'Y',
          state: 'Z',
          assignedToEmployeeId: 'other',
        } as never,
        'company-1',
        'EMPLOYEE',
        'employee-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('denies employee update of unassigned property', async () => {
    const prisma = mockPrisma();
    prisma.property.findFirst.mockResolvedValue(null);
    const service = new PropertiesService(
      prisma as never,
      mockEmitter() as never,
      mockTransition,
      mockGovernanceEventPublisher as never,
    );

    await expect(
      service.update(
        'property-1',
        {},
        'company-1',
        'employee-1',
        'EMPLOYEE',
        'employee-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('denies employee status update of another employee property', async () => {
    const prisma = mockPrisma();
    prisma.property.findFirst.mockResolvedValue({
      id: 'property-1',
      assignedToEmployeeId: 'other-emp',
    });
    const service = new PropertiesService(
      prisma as never,
      mockEmitter() as never,
      mockTransition,
      mockGovernanceEventPublisher as never,
    );

    await expect(
      service.updateStatus(
        'property-1',
        'RESERVED',
        'company-1',
        'employee-1',
        'EMPLOYEE',
        'employee-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
