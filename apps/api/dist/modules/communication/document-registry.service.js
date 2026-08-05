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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentRegistryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const governance_event_publisher_1 = require("../governance-events/governance-event.publisher");
const events_1 = require("../governance-events/types/events");
const audit_service_1 = require("../audit/audit.service");
let DocumentRegistryService = class DocumentRegistryService {
    prisma;
    eventPublisher;
    auditService;
    constructor(prisma, eventPublisher, auditService) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
        this.auditService = auditService;
    }
    async register(input) {
        const { companyId, name, fileType, fileSize, category, storageObjectId, uploadedById, accessLevel, } = input;
        const storageObject = await this.prisma.storageObject.findFirst({
            where: { id: storageObjectId, companyId },
        });
        if (!storageObject) {
            throw new common_1.NotFoundException(`StorageObject with ID ${storageObjectId} not found`);
        }
        const documentId = await this.prisma.$transaction(async (tx) => {
            const document = await tx.documentRegistry.create({
                data: {
                    companyId,
                    name,
                    fileType,
                    fileSize,
                    category: category ?? 'GENERAL',
                    storageObjectId,
                    uploadedById,
                    accessLevel: accessLevel ?? 'COMPANY',
                    status: 'ACTIVE',
                },
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.DOCUMENT_UPLOADED,
                entityId: document.id,
                entityType: 'DocumentRegistry',
                companyId,
                payload: {
                    companyId,
                    name,
                    fileType,
                    fileSize,
                    category: category ?? 'GENERAL',
                    accessLevel: accessLevel ?? 'COMPANY',
                    uploadedById,
                },
            });
            await this.auditService.record({
                tx,
                companyId,
                entityType: 'DocumentRegistry',
                entityId: document.id,
                action: 'CREATED',
                userId: uploadedById,
                newState: { name, fileType, category, accessLevel },
            });
            return document.id;
        });
        return documentId;
    }
    async delete(input) {
        const { companyId, documentId, userId } = input;
        const document = await this.prisma.documentRegistry.findFirst({
            where: { id: documentId, companyId },
        });
        if (!document) {
            throw new common_1.NotFoundException(`Document with ID ${documentId} not found`);
        }
        if (document.status === 'DELETED') {
            throw new common_1.BadRequestException('Document is already deleted');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.documentRegistry.update({
                where: { id: documentId },
                data: { status: 'DELETED', deletedAt: new Date() },
            });
            await this.eventPublisher.publish(tx, {
                eventType: events_1.DomainEventTypes.DOCUMENT_DELETED,
                entityId: documentId,
                entityType: 'DocumentRegistry',
                companyId,
                payload: {
                    companyId,
                    name: document.name,
                    deletedById: userId,
                },
            });
            await this.auditService.record({
                tx,
                companyId,
                entityType: 'DocumentRegistry',
                entityId: documentId,
                action: 'DELETED',
                userId,
                previousState: { status: 'ACTIVE' },
                newState: { status: 'DELETED' },
            });
        });
    }
    async getDocument(id, companyId) {
        const document = await this.prisma.documentRegistry.findFirst({
            where: { id, companyId },
            include: {
                storageObjects: {
                    select: {
                        id: true,
                        bucketName: true,
                        objectKey: true,
                        checksum: true,
                    },
                },
                users: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        if (!document) {
            throw new common_1.NotFoundException(`Document with ID ${id} not found`);
        }
        return document;
    }
    async listDocuments(companyId, options) {
        const { page = 1, limit = 10, category } = options;
        const where = {
            companyId,
            status: { not: 'DELETED' },
        };
        if (category)
            where.category = category;
        const [data, total] = await Promise.all([
            this.prisma.documentRegistry.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    storageObjects: {
                        select: { id: true, bucketName: true, objectKey: true },
                    },
                    users: { select: { id: true, firstName: true, lastName: true } },
                },
            }),
            this.prisma.documentRegistry.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
};
exports.DocumentRegistryService = DocumentRegistryService;
exports.DocumentRegistryService = DocumentRegistryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher,
        audit_service_1.AuditService])
], DocumentRegistryService);
//# sourceMappingURL=document-registry.service.js.map