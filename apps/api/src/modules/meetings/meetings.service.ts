import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { Prisma, MeetingStatus } from '@prisma/client';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  AddAttendeeDto,
  CreateMinutesDto,
  QueryMeetingDto,
} from './dto/create-meeting.dto';
import {
  CreateActionItemDto,
  UpdateActionItemDto,
} from './dto/create-action-item.dto';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transitionService: TransitionService,
  ) {}

  // ─── CRUD ──────────────────────────────────────────────────────────

  async findAll(companyId: string, query: QueryMeetingDto) {
    const { status, startDate, endDate, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MeetingWhereInput = {
      companyId,
      deletedAt: null,
      ...(status && { status: status as MeetingStatus }),
      ...(startDate || endDate
        ? {
            scheduledAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        include: {
          organizer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { attendees: true, minutes: true, actionItems: true },
          },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(companyId: string, dto: CreateMeetingDto, organizerId?: string) {
    const data: Prisma.MeetingCreateInput = {
      company: { connect: { id: companyId } },
      title: dto.title,
      scheduledAt: new Date(dto.scheduledAt),
      location: dto.location,
      organizer: { connect: { id: organizerId! } },
    };

    // If attendee IDs are provided, create attendees in the same transaction
    if (dto.attendeeIds && dto.attendeeIds.length > 0) {
      return this.prisma.$transaction(async (tx) => {
        const meeting = await tx.meeting.create({
          data,
          include: {
            organizer: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        });

        const attendeeData = dto.attendeeIds!.map((empId) => ({
          meetingId: meeting.id,
          employeeId: empId,
          companyId,
        }));

        await tx.meetingAttendee.createMany({
          data: attendeeData,
          skipDuplicates: true,
        });

        return tx.meeting.findUnique({
          where: { id: meeting.id },
          include: {
            organizer: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            attendees: {
              include: {
                employee: {
                  include: {
                    users: {
                      select: { firstName: true, lastName: true, email: true },
                    },
                  },
                },
              },
            },
          },
        });
      });
    }

    return this.prisma.meeting.create({
      data,
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        attendees: {
          include: {
            employee: {
              include: {
                users: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
          orderBy: { employeeId: 'asc' },
        },
        minutes: {
          include: {
            recordedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        actionItems: {
          include: {
            assignee: {
              include: {
                users: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async update(companyId: string, id: string, dto: UpdateMeetingDto) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    return this.prisma.meeting.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.scheduledAt !== undefined && {
          scheduledAt: new Date(dto.scheduledAt),
        }),
        ...(dto.location !== undefined && { location: dto.location }),
      },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async remove(companyId: string, id: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    return this.prisma.meeting.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
  }

  // ─── STATUS CHANGES ───────────────────────────────────────────────

  async complete(companyId: string, id: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    this.transitionService.validate('Meeting', meeting.status, 'COMPLETED');

    return this.prisma.meeting.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async cancel(companyId: string, id: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    this.transitionService.validate('Meeting', meeting.status, 'CANCELLED');

    return this.prisma.meeting.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  // ─── ATTENDEES ────────────────────────────────────────────────────

  async addAttendee(companyId: string, meetingId: string, dto: AddAttendeeDto) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const existing = await this.prisma.meetingAttendee.findFirst({
      where: { meetingId, employeeId: dto.employeeId },
    });
    if (existing) {
      return existing; // Already an attendee, return silently
    }

    return this.prisma.meetingAttendee.create({
      data: { meetingId, employeeId: dto.employeeId, companyId },
      include: {
        employee: {
          include: {
            users: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async removeAttendee(
    companyId: string,
    meetingId: string,
    employeeId: string,
  ) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    const attendee = await this.prisma.meetingAttendee.findFirst({
      where: { meetingId, employeeId },
    });
    if (!attendee) throw new NotFoundException('Attendee not found');

    return this.prisma.meetingAttendee.delete({
      where: { id: attendee.id },
    });
  }

  async markAttendance(
    companyId: string,
    meetingId: string,
    employeeId: string,
    attended: boolean,
  ) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    const attendee = await this.prisma.meetingAttendee.findFirst({
      where: { meetingId, employeeId },
    });
    if (!attendee) throw new NotFoundException('Attendee not found');

    return this.prisma.meetingAttendee.update({
      where: { id: attendee.id },
      data: { attended },
      include: {
        employee: {
          include: {
            users: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  // ─── MINUTES ──────────────────────────────────────────────────────

  async addMinutes(companyId: string, meetingId: string, dto: CreateMinutesDto) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    return this.prisma.meetingMinutes.create({
      data: {
        meetingId,
        content: dto.content,
        recordedById: dto.recordedById!,
        companyId,
      },
      include: {
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async listMinutes(companyId: string, meetingId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    return this.prisma.meetingMinutes.findMany({
      where: { meetingId },
      include: {
        recordedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── ACTION ITEMS ─────────────────────────────────────────────────

  async createActionItem(
    companyId: string,
    meetingId: string,
    dto: CreateActionItemDto,
  ) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    return this.prisma.meetingActionItem.create({
      data: {
        meetingId,
        description: dto.description,
        assigneeId: dto.assigneeId!,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        companyId,
      },
      include: {
        assignee: {
          include: {
            users: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async updateActionItem(
    companyId: string,
    itemId: string,
    dto: UpdateActionItemDto,
  ) {
    const item = await this.prisma.meetingActionItem.findFirst({
      where: { id: itemId },
      include: { meeting: true },
    });
    if (!item || item.meeting.companyId !== companyId) {
      throw new NotFoundException('Action item not found');
    }

    return this.prisma.meetingActionItem.update({
      where: { id: itemId },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
        ...(dto.taskId !== undefined && { taskId: dto.taskId }),
      },
      include: {
        assignee: {
          include: {
            users: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async listActionItems(companyId: string, meetingId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, companyId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    return this.prisma.meetingActionItem.findMany({
      where: { meetingId },
      include: {
        assignee: {
          include: {
            users: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
