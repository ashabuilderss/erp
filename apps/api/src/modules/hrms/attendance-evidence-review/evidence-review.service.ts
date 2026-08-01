import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { EvidenceReviewStatus, DayAggregateStatus } from '@prisma/client';
import { CreateEvidenceReviewDto } from './dto/create-evidence-review.dto';
import { QueryEvidenceReviewDto } from './dto/query-evidence-review.dto';
import { ReviewEvidenceDto } from './dto/review-evidence.dto';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
import { DomainEventTypes } from '../../governance-events/types/events';
import { StorageProvider } from '../../uploads/storage/storage-provider.interface';
import { getCompanyTz } from '../../../common/utils/company-time';

@Injectable()
export class EvidenceReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: GovernanceEventPublisher,
    @Inject('STORAGE_PROVIDER')
    private readonly storageProvider: StorageProvider,
  ) {}

  async create(
    dto: CreateEvidenceReviewDto,
    companyId: string,
    reviewedById: string,
  ) {
    const existing = await this.prisma.attendanceEvidenceReview.findFirst({
      where: { evidenceId: dto.evidenceId, companyId },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.attendanceEvidenceReview.create({
      data: {
        companyId,
        evidenceId: dto.evidenceId,
        punchId: dto.punchId,
        reviewedById,
      },
    });
  }

  async findAll(dto: QueryEvidenceReviewDto, companyId: string) {
    const page = parseInt(dto.page || '1', 10);
    const limit = parseInt(dto.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (dto.status) where.status = dto.status;

    const [items, total] = await Promise.all([
      this.prisma.attendanceEvidenceReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.attendanceEvidenceReview.count({ where }),
    ]);

    const evidenceIds = [...new Set(items.map((i) => i.evidenceId))];
    const evidenceMap = await this.prisma.attendanceEvidence.findMany({
      where: { id: { in: evidenceIds } },
      include: {
        attendancePunches: true,
        storageObjects: true,
      },
    });
    const evidenceById = new Map(evidenceMap.map((e) => [e.id, e]));

    const enriched = items.map((item) => {
      const evidence = evidenceById.get(item.evidenceId);
      const punch = evidence?.attendancePunches ?? null;
      return {
        ...item,
        punch,
      };
    });

    return { items: enriched, total, page, limit };
  }

  async findOne(id: string, companyId: string) {
    const review = await this.prisma.attendanceEvidenceReview.findUnique({
      where: { id },
    });
    if (!review || review.companyId !== companyId) {
      throw new NotFoundException('Evidence review not found');
    }
    return review;
  }

  async getForView(id: string, companyId: string) {
    const review = await this.findOne(id, companyId);

    const evidence = review.evidenceId
      ? await this.prisma.attendanceEvidence.findUnique({
          where: { id: review.evidenceId },
          include: {
            attendancePunches: true,
            storageObjects: true,
          },
        })
      : null;

    const punch = evidence?.attendancePunches ?? null;
    const storage = evidence?.storageObjects ?? null;

    let selfieUrl: string | null = null;
    if (storage?.objectKey) {
      selfieUrl = await this.storageProvider.getUrl(storage.objectKey);
    }

    return {
      id: review.id,
      status: review.status,
      reviewedById: review.reviewedById,
      reviewedAt: review.reviewedAt,
      remarks: review.remarks,
      createdAt: review.createdAt,
      companyId: review.companyId,
      evidence: {
        id: evidence?.id,
        type: evidence?.type,
        punchId: evidence?.punchId,
        gpsAccuracy: evidence?.gpsAccuracy,
        mockLocationDetected: evidence?.mockLocationDetected,
        developerModeActive: evidence?.developerModeActive,
      },
      punch: punch
        ? {
            id: punch.id,
            punchType: punch.punchType,
            timestamp: punch.timestamp,
            latitude: punch.latitude,
            longitude: punch.longitude,
            deviceId: punch.deviceId,
            locationId: punch.locationId,
          }
        : null,
      selfieUrl,
    };
  }

  async review(
    id: string,
    dto: ReviewEvidenceDto,
    companyId: string,
    reviewerId: string,
  ) {
    const review = await this.prisma.attendanceEvidenceReview.findUnique({
      where: { id },
    });
    if (!review || review.companyId !== companyId) {
      throw new NotFoundException('Evidence review not found');
    }
    if (review.status !== EvidenceReviewStatus.PENDING) {
      throw new ForbiddenException('Evidence review is not in PENDING status');
    }

    const updated = await this.prisma.attendanceEvidenceReview.update({
      where: { id },
      data: {
        status: dto.status,
        remarks: dto.remarks,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });

    const dayAggregateStatus =
      dto.status === EvidenceReviewStatus.APPROVED
        ? DayAggregateStatus.COMPLETED
        : DayAggregateStatus.UNDER_REVIEW;

    await this.prisma.$transaction(async (tx) => {
      if (review.punchId) {
        const punch = await tx.attendancePunch.findUnique({
          where: { id: review.punchId },
          select: { employeeId: true, companyId: true, timestamp: true },
        });
        if (punch) {
          const company = await tx.company.findUnique({
            where: { id: punch.companyId },
            select: { settings: true },
          });
          const tz = getCompanyTz(
            (company?.settings as Record<string, unknown>) || null,
          );
          const punchInTz = new Date(
            punch.timestamp.toLocaleString('en-US', { timeZone: tz }),
          );
          const dayStart = new Date(
            Date.UTC(
              punchInTz.getFullYear(),
              punchInTz.getMonth(),
              punchInTz.getDate(),
            ),
          );
          const dayEnd = new Date(dayStart);
          dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

          await tx.attendanceDayAggregate.updateMany({
            where: {
              companyId: punch.companyId,
              employeeId: punch.employeeId,
              date: { gte: dayStart, lt: dayEnd },
            },
            data: { status: dayAggregateStatus },
          });
        }
      }

      await this.eventPublisher.publish(tx, {
        eventType: DomainEventTypes.ATTENDANCE_EVIDENCE_REVIEWED,
        entityId: updated.id,
        entityType: 'AttendanceEvidenceReview',
        companyId,
        payload: {
          companyId,
          evidenceId: updated.evidenceId,
          punchId: updated.punchId,
          status: updated.status,
          remarks: updated.remarks,
          reviewedById: reviewerId,
        },
      });
    });

    return updated;
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.attendanceEvidenceReview.delete({ where: { id } });
    return { deleted: true };
  }
}
