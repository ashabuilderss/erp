import type { Employee } from "./hrms";

export type PropertyType = "APARTMENT" | "HOUSE" | "COMMERCIAL" | "LAND" | "VILLA";
export type PropertyStatus = "AVAILABLE" | "RESERVED" | "BOOKED" | "SOLD";

export type LeadSource =
  | "WEBSITE"
  | "REFERRAL"
  | "SOCIAL_MEDIA"
  | "PHONE_INQUIRY"
  | "WALK_IN"
  | "OTHER";
export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "SITE_VISIT_SCHEDULED"
  | "NEGOTIATION"
  | "CONVERTED"
  | "LOST";

export type CustomerType = "BUYER" | "SELLER" | "BOTH";

export type SiteVisitStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PARTIAL" | "COMPLETED";

export interface Property {
  id: string;
  propertyCode: string | null;
  title: string;
  description: string | null;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  location: string;
  locality: string | null;
  city: string;
  state: string;
  images: string[] | null;
  amenities: string[] | null;
  assignedToEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: Employee | null;
}

export interface Lead {
  id: string;
  propertyId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  assignedToEmployeeId: string | null;
  convertedToCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
  property?: Property | null;
  assignedTo?: Employee | null;
  convertedToCustomer?: Customer | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  type: CustomerType;
  source: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: Employee | null;
}

export interface SiteVisit {
  id: string;
  propertyId: string;
  customerId: string;
  leadId: string | null;
  scheduledDate: string;
  status: SiteVisitStatus;
  notes: string | null;
  feedback: string | null;
  assignedToEmployeeId: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  customer?: Customer;
  lead?: Lead | null;
  assignedTo?: Employee;
}

export interface Booking {
  id: string;
  propertyId: string;
  customerId: string;
  leadId: string | null;
  bookingDate: string;
  amount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes: string | null;
  assignedToEmployeeId: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  customer?: Customer;
  lead?: Lead | null;
  assignedTo?: Employee;
}

export interface PropertyQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: PropertyType;
  status?: PropertyStatus;
  city?: string;
  locality?: string;
  assignedToEmployeeId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface LeadQuery {
  page?: number;
  limit?: number;
  search?: string;
  propertyId?: string;
  source?: LeadSource;
  status?: LeadStatus;
  assignedToEmployeeId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CustomerQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: CustomerType;
  createdById?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SiteVisitQuery {
  page?: number;
  limit?: number;
  search?: string;
  propertyId?: string;
  customerId?: string;
  leadId?: string;
  status?: SiteVisitStatus;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  assignedToEmployeeId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface BookingQuery {
  page?: number;
  limit?: number;
  search?: string;
  propertyId?: string;
  customerId?: string;
  leadId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  bookingDateFrom?: string;
  bookingDateTo?: string;
  assignedToEmployeeId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreatePropertyDto {
  propertyCode?: string;
  title: string;
  description?: string;
  type?: PropertyType;
  status?: PropertyStatus;
  price: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  location: string;
  locality?: string;
  city: string;
  state: string;
  images?: string[];
  amenities?: string[];
  assignedToEmployeeId?: string;
}

export type UpdatePropertyDto = Partial<CreatePropertyDto>;

export interface CreateLeadDto {
  propertyId?: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  source?: LeadSource;
  status?: LeadStatus;
  notes?: string;
  assignedToEmployeeId?: string;
}

export type UpdateLeadDto = Partial<CreateLeadDto>;

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type?: CustomerType;
  source?: string;
  notes?: string;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;

export interface CreateSiteVisitDto {
  propertyId: string;
  customerId: string;
  leadId?: string;
  scheduledDate: string;
  status?: SiteVisitStatus;
  notes?: string;
  feedback?: string;
  assignedToEmployeeId: string;
}

export type UpdateSiteVisitDto = Partial<CreateSiteVisitDto>;

export interface CreateBookingDto {
  propertyId: string;
  customerId: string;
  leadId?: string;
  bookingDate: string;
  amount: number;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
  assignedToEmployeeId: string;
}

export type UpdateBookingDto = Partial<CreateBookingDto>;
