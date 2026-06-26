import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../config/prisma.service';

interface BookingEvent {
  companyId: string;
  entityId: string;
}

@Injectable()
export class CommissionListener {
  private readonly logger = new Logger(CommissionListener.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent('booking.created')
  async handleBookingCreated(payload: BookingEvent) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const existing = await this.prisma.pipelineCommission.findFirst({
          where: { bookingId: payload.entityId, companyId: payload.companyId },
        });
        if (existing) {
          this.logger.log(`Commission already exists for booking ${payload.entityId}, skipping`);
          return;
        }

        const booking = await this.prisma.booking.findUnique({
          where: { id: payload.entityId },
          include: { assignedTo: true },
        });
        if (!booking || !booking.assignedToEmployeeId) return;

        const company = await this.prisma.company.findUnique({
          where: { id: payload.companyId },
          select: { settings: true },
        });
        const settings = (company?.settings as Record<string, unknown>) ?? {};
        const defaultPct = (settings.commissionPercentage as number) ?? 5;
        const commissionAmount =
          Number(booking.amount) * (defaultPct / 100);

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
}
