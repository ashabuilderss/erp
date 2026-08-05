import { BookingStatus, PaymentStatus } from '@prisma/client';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
export declare class QueryBookingDto extends BaseQueryDto {
    propertyId?: string;
    customerId?: string;
    leadId?: string;
    status?: BookingStatus;
    paymentStatus?: PaymentStatus;
    bookingDateFrom?: string;
    bookingDateTo?: string;
    assignedToEmployeeId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
