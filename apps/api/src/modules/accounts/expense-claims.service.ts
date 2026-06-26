import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import {
  CreateExpenseClaimDto,
  UpdateExpenseClaimDto,
} from './dto/create-expense-claim.dto';

@Injectable()
export class ExpenseClaimsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, status?: string) {
    return this.prisma.expenseClaim.findMany({
      where: {
        companyId,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { employeeCode: true } },
        approvedBy: { select: { employeeCode: true } },
      },
    });
  }

  async findByEmployee(employeeId: string, companyId: string) {
    return this.prisma.expenseClaim.findMany({
      where: { employeeId, companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    dto: CreateExpenseClaimDto,
    employeeId: string,
    companyId: string,
  ) {
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

  async approve(
    id: string,
    dto: UpdateExpenseClaimDto,
    approvedById: string,
    companyId: string,
  ) {
    const claim = await this.prisma.expenseClaim.findFirst({
      where: { id, companyId },
    });
    if (!claim) throw new NotFoundException('Expense claim not found');

    return this.prisma.expenseClaim.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes,
        approvedById,
        approvedAt:
          dto.status === 'APPROVED' || dto.status === 'REJECTED'
            ? new Date()
            : undefined,
      },
    });
  }
}
