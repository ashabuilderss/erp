import { Module } from '@nestjs/common';
import { PropertiesModule } from './properties/properties.module';
import { LeadsModule } from './leads/leads.module';
import { CustomersModule } from './customers/customers.module';
import { SiteVisitsModule } from './site-visits/site-visits.module';
import { BookingsModule } from './bookings/bookings.module';
import { QuotationsModule } from './quotations/quotations.module';
import { BrokersModule } from './brokers/brokers.module';

@Module({
  imports: [
    PropertiesModule,
    LeadsModule,
    CustomersModule,
    SiteVisitsModule,
    BookingsModule,
    QuotationsModule,
    BrokersModule,
  ],
  controllers: [],
})
export class CrmModule {}
