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
exports.ExpenseClaimsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let ExpenseClaimsService = class ExpenseClaimsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId, status) {
        return this.prisma.expenseClaim.findMany({
            where: {
                companyId,
                ...(status && { status: status }),
            },
            orderBy: { createdAt: 'desc' },
            include: {
                employeesExpenseClaimsEmployeeIdToemployees: {
                    select: { employeeCode: true },
                },
                employeesExpenseClaimsApprovedByIdToemployees: {
                    select: { employeeCode: true },
                },
            },
        });
    }
    async findByEmployee(employeeId, companyId) {
        return this.prisma.expenseClaim.findMany({
            where: { employeeId, companyId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(dto, employeeId, companyId) {
        return this.prisma.expenseClaim.create({
            data: {
                employeeId,
                companyId,
                amount: dto.amount,
                category: dto.category,
                description: dto.description,
                expenseDate: new Date(dto.expenseDate),
                receiptUrl: dto.receiptUrl,
            },
        });
    }
    async approve(id, dto, approvedById, companyId) {
        const claim = await this.prisma.expenseClaim.findFirst({
            where: { id, companyId },
        });
        if (!claim)
            throw new common_1.NotFoundException('Expense claim not found');
        if (claim.employeeId === approvedById) {
            throw new common_1.BadRequestException('Cannot approve your own expense claim');
        }
        return this.prisma.expenseClaim.update({
            where: { id },
            data: {
                status: dto.status,
                notes: dto.notes,
                approvedById,
                approvedAt: dto.status === 'APPROVED' || dto.status === 'REJECTED'
                    ? new Date()
                    : undefined,
            },
        });
    }
};
exports.ExpenseClaimsService = ExpenseClaimsService;
exports.ExpenseClaimsService = ExpenseClaimsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExpenseClaimsService);
//# sourceMappingURL=expense-claims.service.js.map