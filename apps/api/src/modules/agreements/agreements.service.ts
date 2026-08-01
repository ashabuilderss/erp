import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import {
  CreateAgreementDto,
  UpdateAgreementDto,
  QueryAgreementDto,
} from './dto/create-agreement.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgreementsService {
  constructor(
    private prisma: PrismaService,
    private transitionService: TransitionService,
  ) {}

  async findAll(companyId: string, query: QueryAgreementDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AgreementWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        title: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.agreement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: { select: { approvals: true } },
        },
      }),
      this.prisma.agreement.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateAgreementDto, createdById: string, companyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const agreement = await tx.agreement.create({
        data: {
          title: dto.title,
          type: dto.type,
          content: dto.content,
          attachments: dto.attachments ?? Prisma.JsonNull,
          companyId,
          createdById,
          status: 'DRAFT',
        },
      });

      if (dto.approvalSteps && dto.approvalSteps.length > 0) {
        await tx.agreementApproval.createMany({
          data: dto.approvalSteps.map((step) => ({
            companyId,
            agreementId: agreement.id,
            approverId: step.approverId,
            step: step.step,
            status: 'PENDING',
          })),
        });
      }

      return this.findOne(agreement.id, companyId);
    });
  }

  async findOne(id: string, companyId: string) {
    const agreement = await this.prisma.agreement.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        approvals: {
          orderBy: { step: 'asc' },
          include: {
            approver: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!agreement) throw new NotFoundException('Agreement not found');
    return agreement;
  }

  async update(id: string, dto: UpdateAgreementDto, companyId: string) {
    const existing = await this.prisma.agreement.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Agreement not found');

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Can only edit agreements in DRAFT status');
    }

    return this.prisma.agreement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.attachments !== undefined && { attachments: dto.attachments }),
      },
    });
  }

  async remove(id: string, companyId: string) {
    const existing = await this.prisma.agreement.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Agreement not found');

    return this.prisma.agreement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async submit(id: string, companyId: string) {
    const agreement = await this.prisma.agreement.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { approvals: true },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');

    if (agreement.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT agreements can be submitted');
    }

    if (!agreement.approvals || agreement.approvals.length === 0) {
      throw new BadRequestException(
        'Cannot submit an agreement without approval steps. Add approval steps first.',
      );
    }

    this.transitionService.validate('Agreement', agreement.status, 'PENDING_APPROVAL');

    return this.prisma.agreement.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL' },
    });
  }

  async approve(id: string, approverId: string, companyId: string, comments?: string) {
    const agreement = await this.prisma.agreement.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { approvals: { orderBy: { step: 'asc' } } },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');

    if (agreement.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Agreement is not pending approval');
    }

    // Find the current pending step for this approver
    const pendingStep = agreement.approvals.find(
      (a) => a.approverId === approverId && a.status === 'PENDING',
    );

    if (!pendingStep) {
      throw new BadRequestException(
        'You do not have a pending approval step for this agreement',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Approve current step
      await tx.agreementApproval.update({
        where: { id: pendingStep.id },
        data: { status: 'APPROVED', comments },
      });

      // Check if all steps are now approved
      const updatedApprovals = await tx.agreementApproval.findMany({
        where: { agreementId: id },
      });

      const allApproved = updatedApprovals.every((a) => a.status === 'APPROVED');

      if (allApproved) {
        this.transitionService.validate('Agreement', agreement.status, 'APPROVED');
        await tx.agreement.update({
          where: { id },
          data: { status: 'APPROVED' },
        });
      }

      return tx.agreement.findUnique({
        where: { id },
        include: {
          approvals: {
            orderBy: { step: 'asc' },
            include: {
              approver: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });
    });
  }

  async archive(id: string, companyId: string) {
    const agreement = await this.prisma.agreement.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');

    if (agreement.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED agreements can be archived');
    }

    this.transitionService.validate('Agreement', agreement.status, 'ARCHIVED');

    return this.prisma.agreement.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }
}
