import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { CreateAttendanceCorrectionDto } from './dto/create-attendance-correction.dto';
import { QueryAttendanceCorrectionDto } from './dto/query-attendance-correction.dto';
import { CorrectionStatus } from '@prisma/client';

@Injectable()
export class AttendanceCorrectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateAttendanceCorrectionDto,
    employeeId: string,
    companyId: string,
  ) {
    const correctionDate = new Date(dto.date);
    correctionDate.setUTCHours(0, 0, 0, 0);

    return this.prisma.attendanceCorrection.create({
      data: {
        employeeId,
        companyId,
        attendanceId: dto.attendanceId,
        date: correctionDate,
        reason: dto.reason,
        requestedCheckIn: dto.requestedCheckIn
          ? new Date(dto.requestedCheckIn)
          : undefined,
        requestedCheckOut: dto.requestedCheckOut
          ? new Date(dto.requestedCheckOut)
          : undefined,
        requestedStatus: dto.requestedStatus,
      },
    });
  }

  async findAll(query: QueryAttendanceCorrectionDto, companyId: string) {
    const where: any = { companyId };
    if (query.status) where.status = query.status;
    if (query.employeeId) where.employeeId = query.employeeId;

    const total = await this.prisma.attendanceCorrection.count({ where });
    const data = await this.prisma.attendanceCorrection.findMany({
      where,
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
      take: query.limit ?? 10,
      include: {
        employee: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        approvedBy: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      data,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
      },
    };
  }

  async findMyCorrections(employeeId: string) {
    return this.prisma.attendanceCorrection.findMany({
      where: { employeeId },
      include: {
        approvedBy: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const correction = await this.prisma.attendanceCorrection.findFirst({
      where: { id, companyId },
      include: {
        employee: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        approvedBy: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!correction)
      throw new NotFoundException('Attendance correction not found');
    return correction;
  }

  async approve(
    id: string,
    approvedById: string,
    companyId: string,
    notes?: string,
  ) {
    const correction = await this.findOne(id, companyId);
    if (correction.status !== CorrectionStatus.PENDING) {
      throw new BadRequestException('Correction is not in PENDING status');
    }

    return this.prisma.$transaction(async (tx) => {
      const existingAttendance = await tx.attendance.findUnique({
        where: {
          companyId_employeeId_date: {
            companyId: correction.companyId,
            employeeId: correction.employeeId,
            date: correction.date,
          },
        },
      });

      if (existingAttendance) {
        const attUpdate: any = {};
        if (correction.requestedCheckIn)
          attUpdate.checkIn = correction.requestedCheckIn;
        if (correction.requestedCheckOut)
          attUpdate.checkOut = correction.requestedCheckOut;
        if (correction.requestedStatus)
          attUpdate.status = correction.requestedStatus;
        if (Object.keys(attUpdate).length > 0) {
          await tx.attendance.update({
            where: { id: existingAttendance.id },
            data: attUpdate,
          });
        }
      }

      return tx.attendanceCorrection.update({
        where: { id },
        data: {
          status: CorrectionStatus.APPROVED,
          approvedById,
          approvedAt: new Date(),
          notes,
        },
      });
    });
  }

  async reject(
    id: string,
    approvedById: string,
    companyId: string,
    notes?: string,
  ) {
    const correction = await this.findOne(id, companyId);
    if (correction.status !== CorrectionStatus.PENDING) {
      throw new BadRequestException('Correction is not in PENDING status');
    }
    return this.prisma.attendanceCorrection.update({
      where: { id },
      data: {
        status: CorrectionStatus.REJECTED,
        approvedById,
        approvedAt: new Date(),
        notes,
      },
    });
  }
}
