import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
interface BookingEvent {
    companyId: string;
    entityId: string;
}
export declare class CommissionListener {
    private prisma;
    private transitionService;
    private readonly logger;
    constructor(prisma: PrismaService, transitionService: TransitionService);
    handleBookingCreated(payload: BookingEvent): Promise<void>;
    handleBookingCancelled(payload: BookingEvent): Promise<void>;
    handleBookingUpdated(payload: BookingEvent): Promise<void>;
    handleBookingDeleted(payload: BookingEvent): Promise<void>;
}
export {};
