import { PrismaService } from '../../../config/prisma.service';
import { AttendanceFinalizationService } from '../../hrms/attendance/attendance-finalization.service';
export declare class AttendanceMidnightFinalizationJob {
    private readonly prisma;
    private readonly finalizationService;
    private readonly logger;
    constructor(prisma: PrismaService, finalizationService: AttendanceFinalizationService);
    handleMidnightFinalization(): Promise<void>;
}
