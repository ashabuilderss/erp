"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const transition_service_1 = require("../../common/services/transition.service");
let MeetingsService = class MeetingsService {
    prisma;
    transitionService;
    constructor(prisma, transitionService) {
        this.prisma = prisma;
        this.transitionService = transitionService;
    }
    async findAll(companyId, query) {
        const { status, startDate, endDate, search, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = {
            companyId,
            deletedAt: null,
            ...(status && { status: status }),
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
    async create(companyId, dto, organizerId) {
        const data = {
            company: { connect: { id: companyId } },
            title: dto.title,
            scheduledAt: new Date(dto.scheduledAt),
            location: dto.location,
            organizer: { connect: { id: organizerId } },
        };
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
                const attendeeData = dto.attendeeIds.map((empId) => ({
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
    async findOne(companyId, id) {
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
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
        return meeting;
    }
    async update(companyId, id, dto) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
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
    async remove(companyId, id) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
        return this.prisma.meeting.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'CANCELLED' },
        });
    }
    async complete(companyId, id) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
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
    async cancel(companyId, id) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
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
    async addAttendee(companyId, meetingId, dto) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id: meetingId, companyId, deletedAt: null },
        });
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
        const employee = await this.prisma.employee.findFirst({
            where: { id: dto.employeeId, companyId },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        const existing = await this.prisma.meetingAttendee.findFirst({
            where: { meetingId, employeeId: dto.employeeId },
        });
        if (existing) {
            return existing;
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
    async removeAttendee(companyId, meetingId, employeeId) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id: meetingId, companyId, deletedAt: null },
        });
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
        const attendee = await this.prisma.meetingAttendee.findFirst({
            where: { meetingId, employeeId },
        });
        if (!attendee)
            throw new common_1.NotFoundException('Attendee not found');
        return this.prisma.meetingAttendee.delete({
            where: { id: attendee.id },
        });
    }
    async markAttendance(companyId, meetingId, employeeId, attended) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id: meetingId, companyId, deletedAt: null },
        });
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
        const attendee = await this.prisma.meetingAttendee.findFirst({
            where: { meetingId, employeeId },
        });
        if (!attendee)
            throw new common_1.NotFoundException('Attendee not found');
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
    async addMinutes(companyId, meetingId, dto) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id: meetingId, companyId, deletedAt: null },
        });
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
        return this.prisma.meetingMinutes.create({
            data: {
                meetingId,
                content: dto.content,
                recordedById: dto.recordedById,
                companyId,
            },
            include: {
                recordedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }
    async listMinutes(companyId, meetingId) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id: meetingId, companyId, deletedAt: null },
        });
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
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
    async createActionItem(companyId, meetingId, dto) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id: meetingId, companyId, deletedAt: null },
        });
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
        return this.prisma.meetingActionItem.create({
            data: {
                meetingId,
                description: dto.description,
                assigneeId: dto.assigneeId,
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
    async updateActionItem(companyId, itemId, dto) {
        const item = await this.prisma.meetingActionItem.findFirst({
            where: { id: itemId },
            include: { meeting: true },
        });
        if (!item || item.meeting.companyId !== companyId) {
            throw new common_1.NotFoundException('Action item not found');
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
    async listActionItems(companyId, meetingId) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id: meetingId, companyId, deletedAt: null },
        });
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
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
};
exports.MeetingsService = MeetingsService;
exports.MeetingsService = MeetingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transition_service_1.TransitionService])
], MeetingsService);
//# sourceMappingURL=meetings.service.js.map