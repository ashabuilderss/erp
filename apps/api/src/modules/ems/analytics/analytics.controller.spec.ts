import { AnalyticsController } from './analytics.controller';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('AnalyticsController employee access', () => {
  it('forces employees to their own analytics record', async () => {
    const service = { getEmployeeAnalytics: jest.fn().mockResolvedValue({}) };
    const controller = new AnalyticsController(service as never);

    // Employee accessing their own analytics should work
    await controller.getEmployeeAnalytics(
      'self-employee',
      'company-1',
      'self-employee',
      'EMPLOYEE',
    );
    expect(service.getEmployeeAnalytics).toHaveBeenCalledWith(
      'self-employee',
      'company-1',
    );
  });

  it('throws ForbiddenException when employee tries to access another employee analytics', async () => {
    const service = { getEmployeeAnalytics: jest.fn().mockResolvedValue({}) };
    const controller = new AnalyticsController(service as never);

    await expect(
      controller.getEmployeeAnalytics(
        'other-employee',
        'company-1',
        'self-employee',
        UserRole.EMPLOYEE,
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(service.getEmployeeAnalytics).not.toHaveBeenCalled();
  });

  it('allows admin to access any employee analytics', async () => {
    const service = { getEmployeeAnalytics: jest.fn().mockResolvedValue({}) };
    const controller = new AnalyticsController(service as never);

    await controller.getEmployeeAnalytics(
      'other-employee',
      'company-1',
      'admin-employee',
      UserRole.ADMIN,
    );
    expect(service.getEmployeeAnalytics).toHaveBeenCalledWith(
      'other-employee',
      'company-1',
    );
  });
});
