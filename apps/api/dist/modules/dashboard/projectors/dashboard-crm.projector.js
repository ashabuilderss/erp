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
var DashboardCrmProjector_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardCrmProjector = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const governance_event_processor_1 = require("../../governance-events/governance-event.processor");
const events_1 = require("../../governance-events/types/events");
let DashboardCrmProjector = DashboardCrmProjector_1 = class DashboardCrmProjector {
    prisma;
    processor;
    constructor(prisma, processor) {
        this.prisma = prisma;
        this.processor = processor;
    }
    async handleLeadStatusChanged(event) {
        await this.processor.process(event, DashboardCrmProjector_1.name, async () => {
            await this.recalculateCrmKpis(event);
        });
    }
    async handleSiteVisitScheduled(event) {
        await this.processor.process(event, DashboardCrmProjector_1.name, async () => {
            await this.recalculateCrmKpis(event);
        });
    }
    async handleSiteVisitCompleted(event) {
        await this.processor.process(event, DashboardCrmProjector_1.name, async () => {
            await this.recalculateCrmKpis(event);
        });
    }
    async handleBookingCreated(event) {
        await this.processor.process(event, DashboardCrmProjector_1.name, async () => {
            await this.recalculateCrmKpis(event);
        });
    }
    async handleBookingConfirmed(event) {
        await this.processor.process(event, DashboardCrmProjector_1.name, async () => {
            await this.recalculateCrmKpis(event);
        });
    }
    async handlePropertyCreated(event) {
        await this.processor.process(event, DashboardCrmProjector_1.name, async () => {
            await this.recalculateCrmKpis(event);
        });
    }
    async handlePropertyStatusChanged(event) {
        await this.processor.process(event, DashboardCrmProjector_1.name, async () => {
            await this.recalculateCrmKpis(event);
        });
    }
    async recalculateCrmKpis(event) {
        const payload = event.payload;
        const companyId = payload.companyId;
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const totalProperties = await this.prisma.property.count({
            where: { companyId },
        });
        const totalLeads = await this.prisma.lead.count({ where: { companyId } });
        const newLeads = await this.prisma.lead.count({
            where: { companyId, createdAt: { gte: today } },
        });
        const convertedLeads = await this.prisma.lead.count({
            where: { companyId, status: 'CONVERTED' },
        });
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
        const totalSiteVisits = await this.prisma.siteVisit.count({
            where: { companyId },
        });
        const totalBookings = await this.prisma.booking.count({
            where: { companyId },
        });
        const bookingAgg = await this.prisma.booking.aggregate({
            where: { companyId, status: 'CONFIRMED' },
            _sum: { amount: true },
        });
        const totalRevenue = Number(bookingAgg._sum?.amount ?? 0);
        await this.prisma.dashboardKpiSnapshot.upsert({
            where: { companyId_snapshotDate: { companyId, snapshotDate: today } },
            create: {
                companyId,
                snapshotDate: today,
                totalProperties,
                totalLeads,
                newLeads,
                convertedLeads,
                conversionRate,
                totalSiteVisits,
                totalBookings,
                totalRevenue,
                lastProcessedEventId: event.id,
                lastProcessedCorrelationId: event.correlationId,
            },
            update: {
                totalProperties,
                totalLeads,
                newLeads,
                convertedLeads,
                conversionRate,
                totalSiteVisits,
                totalBookings,
                totalRevenue,
                lastProcessedEventId: event.id,
                lastProcessedCorrelationId: event.correlationId,
                lastProjectionUpdate: new Date(),
            },
        });
    }
};
exports.DashboardCrmProjector = DashboardCrmProjector;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.LEAD_STATUS_CHANGED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardCrmProjector.prototype, "handleLeadStatusChanged", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.SITE_VISIT_SCHEDULED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardCrmProjector.prototype, "handleSiteVisitScheduled", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.SITE_VISIT_COMPLETED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardCrmProjector.prototype, "handleSiteVisitCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.BOOKING_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardCrmProjector.prototype, "handleBookingCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.BOOKING_CONFIRMED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardCrmProjector.prototype, "handleBookingConfirmed", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.PROPERTY_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardCrmProjector.prototype, "handlePropertyCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventTypes.PROPERTY_STATUS_CHANGED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardCrmProjector.prototype, "handlePropertyStatusChanged", null);
exports.DashboardCrmProjector = DashboardCrmProjector = DashboardCrmProjector_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_processor_1.GovernanceEventProcessor])
], DashboardCrmProjector);
//# sourceMappingURL=dashboard-crm.projector.js.map