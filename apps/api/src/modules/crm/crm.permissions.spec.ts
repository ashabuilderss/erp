import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { Permissions } from '../../common/auth/permissions';
import { PropertiesController } from './properties/properties.controller';
import { LeadsController } from './leads/leads.controller';
import { SiteVisitsController } from './site-visits/site-visits.controller';
import { BookingsController } from './bookings/bookings.controller';

describe('CRM permission metadata', () => {
  it.each([
    [PropertiesController.prototype.findOne, Permissions.PROPERTY_READ],
    [PropertiesController.prototype.create, Permissions.PROPERTY_CREATE],
    [LeadsController.prototype.update, Permissions.LEAD_UPDATE],
    [SiteVisitsController.prototype.update, Permissions.SITE_VISIT_UPDATE],
    [BookingsController.prototype.create, Permissions.BOOKING_CREATE],
    [BookingsController.prototype.update, Permissions.BOOKING_UPDATE],
  ])(
    'declares the authoritative permission for each action',
    (handler, permission) => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toContain(
        permission,
      );
    },
  );
});
