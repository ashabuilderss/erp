import { NotFoundException } from '@nestjs/common';
import { TransitionService } from '../../../common/services/transition.service';
import { TaskCommentsService } from './task-comments.service';

describe('TaskCommentsService', () => {
  const mockTransitionService = {
    validate: jest.fn(),
    canTransition: jest.fn().mockReturnValue(true),
    execute: jest.fn(),
    getRule: jest.fn(),
  };

  const mockPrisma = () => ({
    taskComment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  });

  describe('findByAssignment', () => {
    it('scopes detail lookup to the assigned employee', async () => {
      const prisma = mockPrisma();
      prisma.taskComment.findMany.mockResolvedValue([]);
      const service = new TaskCommentsService(prisma as never, mockTransitionService as never);

      const result = await service.findByAssignment(
        'assign-1',
        'company-1',
        'employee-1',
        'EMPLOYEE',
      );

      expect(result).toEqual([]);
      expect(prisma.taskComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignmentId: 'assign-1',
            companyId: 'company-1',
          }),
        }),
      );
    });

    it('queries without OR filter when role is ADMIN', async () => {
      const prisma = mockPrisma();
      prisma.taskComment.findMany.mockResolvedValue([
        { id: 'c1' },
        { id: 'c2' },
      ]);
      const service = new TaskCommentsService(prisma as never, mockTransitionService as never);

      await service.findByAssignment(
        'assign-1',
        'company-1',
        'employee-1',
        'ADMIN',
      );

      expect(prisma.taskComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            assignmentId: 'assign-1',
            companyId: 'company-1',
            deletedAt: null,
          },
        }),
      );
    });

    it('queries with OR filter when role is EMPLOYEE', async () => {
      const prisma = mockPrisma();
      prisma.taskComment.findMany.mockResolvedValue([{ id: 'c1' }]);
      const service = new TaskCommentsService(prisma as never, mockTransitionService as never);

      await service.findByAssignment(
        'assign-1',
        'company-1',
        'employee-1',
        'EMPLOYEE',
      );

      expect(prisma.taskComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            assignmentId: 'assign-1',
            companyId: 'company-1',
            deletedAt: null,
            OR: [{ isPrivate: false }, { authorId: 'employee-1' }],
          },
        }),
      );
    });
  });

  describe('create', () => {
    it('creates with correct fields from dto, companyId, authorId', async () => {
      const prisma = mockPrisma();
      const comment = { id: 'c1', content: 'hello', isPrivate: false };
      prisma.taskComment.create.mockResolvedValue(comment);
      const service = new TaskCommentsService(prisma as never, mockTransitionService as never);

      const result = await service.create(
        { assignmentId: 'assign-1', content: 'hello' },
        'company-1',
        'author-1',
      );

      expect(result).toEqual(comment);
      expect(prisma.taskComment.create).toHaveBeenCalledWith({
        data: {
          assignmentId: 'assign-1',
          companyId: 'company-1',
          authorId: 'author-1',
          content: 'hello',
          isPrivate: false,
        },
        include: { employees: { include: { users: true } } },
      });
    });

    it('defaults isPrivate to false when not provided', async () => {
      const prisma = mockPrisma();
      prisma.taskComment.create.mockResolvedValue({ id: 'c1' });
      const service = new TaskCommentsService(prisma as never, mockTransitionService as never);

      await service.create(
        { assignmentId: 'assign-1', content: 'test' },
        'company-1',
        'author-1',
      );

      expect(prisma.taskComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPrivate: false }),
        }),
      );
    });

    it('passes isPrivate true from dto', async () => {
      const prisma = mockPrisma();
      prisma.taskComment.create.mockResolvedValue({ id: 'c1' });
      const service = new TaskCommentsService(prisma as never, mockTransitionService as never);

      await service.create(
        { assignmentId: 'assign-1', content: 'test', isPrivate: true },
        'company-1',
        'author-1',
      );

      expect(prisma.taskComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPrivate: true }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when comment not found', async () => {
      const prisma = mockPrisma();
      prisma.taskComment.findFirst.mockResolvedValue(null);
      const service = new TaskCommentsService(prisma as never, mockTransitionService as never);

      await expect(
        service.remove('c1', 'company-1', 'employee-1', 'EMPLOYEE'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when role is not ADMIN and authorId does not match', async () => {
      const prisma = mockPrisma();
      prisma.taskComment.findFirst.mockResolvedValue({
        id: 'c1',
        authorId: 'other-employee',
      });
      const service = new TaskCommentsService(prisma as never, mockTransitionService as never);

      await expect(
        service.remove('c1', 'company-1', 'employee-1', 'EMPLOYEE'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('soft-deletes when role is ADMIN regardless of authorId', async () => {
      const prisma = mockPrisma();
      prisma.taskComment.findFirst.mockResolvedValue({
        id: 'c1',
        authorId: 'other-employee',
      });
      prisma.taskComment.update.mockResolvedValue({ id: 'c1' });
      const service = new TaskCommentsService(prisma as never, mockTransitionService as never);

      await service.remove('c1', 'company-1', 'employee-1', 'ADMIN');

      expect(prisma.taskComment.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('soft-deletes when role is EMPLOYEE and authorId matches', async () => {
      const prisma = mockPrisma();
      prisma.taskComment.findFirst.mockResolvedValue({
        id: 'c1',
        authorId: 'employee-1',
      });
      prisma.taskComment.update.mockResolvedValue({ id: 'c1' });
      const service = new TaskCommentsService(prisma as never, mockTransitionService as never);

      await service.remove('c1', 'company-1', 'employee-1', 'EMPLOYEE');

      expect(prisma.taskComment.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
