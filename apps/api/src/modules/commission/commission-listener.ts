import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';

interface BookingEvent {
  companyId: string;
  entityId: string;
}

@Injectable()
export class CommissionListener {
  private readonly logger = new Logger(CommissionListener.name);

  constructor(
    private prisma: PrismaService,
    private transitionService: TransitionService,
  ) {}

  @OnEvent('booking.created')
  async handleBookingCreated(payload: BookingEvent) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const existing = await this.prisma.pipelineCommission.findFirst({
          where: { bookingId: payload.entityId, companyId: payload.companyId },
        });
        if (existing) {
          this.logger.log(
            `Commission already exists for booking ${payload.entityId}, skipping`,
          );
          return;
        }

        const booking = await this.prisma.booking.findUnique({
          where: { id: payload.entityId },
          include: { employees: true },
        });
        if (!booking || !booking.assignedToEmployeeId) return;

        const company = await this.prisma.company.findUnique({
          where: { id: payload.companyId },
          select: { settings: true },
        });
        const settings = (company?.settings as Record<string, unknown>) ?? {};
        const defaultPct = (settings.commissionPercentage as number) ?? 5;
        const commissionAmount = Number(booking.amount) * (defaultPct / 100);

        await this.prisma.pipelineCommission.create({
          data: {
            companyId: payload.companyId,
            bookingId: booking.id,
            leadId: booking.leadId,
            employeeId: booking.assignedToEmployeeId,
            amount: commissionAmount,
            percentage: defaultPct,
            status: 'PENDING',
          },
        });

        this.logger.log(
          `Auto-created commission (${defaultPct}% = ${commissionAmount}) for booking ${booking.id}`,
        );
        return;
      } catch (err) {
        this.logger.error(
          `Commission creation attempt ${attempt}/${maxRetries} failed for booking ${payload.entityId}`,
          err instanceof Error ? err.stack : err,
        );
        if (attempt === maxRetries) {
          this.logger.error(
            `All ${maxRetries} attempts failed. Commission for booking ${payload.entityId} needs manual creation.`,
          );
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  @OnEvent('booking.cancelled')
  async handleBookingCancelled(payload: BookingEvent) {
    try {
      const commissions = await this.prisma.pipelineCommission.findMany({
        where: {
          bookingId: payload.entityId,
          companyId: payload.companyId,
          status: { in: ['PENDING', 'APPROVED'] },
        },
      });

      for (const commission of commissions) {
        this.transitionService.validate(
          'Commission',
          commission.status,
          'CANCELLED',
        );
        await this.prisma.pipelineCommission.update({
          where: { id: commission.id },
          data: { status: 'CANCELLED' },
        });
        this.logger.log(
          `Auto-cancelled commission ${commission.id} for cancelled booking ${payload.entityId}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Failed to cancel commissions for booking ${payload.entityId}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  @OnEvent('booking.updated')
  async handleBookingUpdated(payload: BookingEvent) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: payload.entityId },
      });
      if (!booking) return;

      const commission = await this.prisma.pipelineCommission.findFirst({
        where: {
          bookingId: payload.entityId,
          companyId: payload.companyId,
        },
      });
      if (!commission) return;

      const company = await this.prisma.company.findUnique({
        where: { id: payload.companyId },
        select: { settings: true },
      });
      const settings = (company?.settings as Record<string, unknown>) ?? {};
      const defaultPct = (settings.commissionPercentage as number) ?? 5;
      const newAmount = Number(booking.amount) * (defaultPct / 100);

      if (
        Number(commission.amount) !== newAmount ||
        Number(commission.percentage) !== defaultPct
      ) {
        await this.prisma.pipelineCommission.update({
          where: { id: commission.id },
          data: {
            amount: newAmount,
            percentage: defaultPct,
          },
        });
        this.logger.log(
          `Recalculated commission ${commission.id}: ${defaultPct}% = ${newAmount} for booking ${payload.entityId}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Failed to update commission for booking ${payload.entityId}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  @OnEvent('booking.deleted')
  async handleBookingDeleted(payload: BookingEvent) {
    try {
      const deleted = await this.prisma.pipelineCommission.deleteMany({
        where: {
          bookingId: payload.entityId,
          companyId: payload.companyId,
        },
      });
      if (deleted.count > 0) {
        this.logger.log(
          `Deleted ${deleted.count} commission(s) for deleted booking ${payload.entityId}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Failed to delete commissions for booking ${payload.entityId}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
