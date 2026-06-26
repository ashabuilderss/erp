import { Module } from '@nestjs/common';
import { DeviceRegistrationsService } from './device-registrations.service';
import { DeviceRegistrationsController } from './device-registrations.controller';

@Module({
  controllers: [DeviceRegistrationsController],
  providers: [DeviceRegistrationsService],
  exports: [DeviceRegistrationsService],
})
export class DeviceRegistrationsModule {}
