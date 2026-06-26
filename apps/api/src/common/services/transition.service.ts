import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TRANSITION_RULES, TransitionRule } from './transition.config';

interface TransitionOperation<T = any> {
  entityType: string;
  id: string;
  newStatus: string;
  companyId: string;
  currentUserRole?: string;
  currentEmployeeId?: string;
  before?: (tx: any, entity: any) => Promise<void>;
  after?: (result: T) => Promise<void>;
  include?: any;
}

@Injectable()
export class TransitionService {
  private rules = new Map<string, TransitionRule>();

  constructor(private prisma: PrismaService) {
    for (const rule of TRANSITION_RULES) {
      this.rules.set(rule.entityName, rule);
      this.rules.set(rule.prismaModel, rule);
    }
  }

  private getRule(entityType: string): TransitionRule {
    const rule = this.rules.get(entityType);
    if (!rule) {
      throw new BadRequestException(
        `No transition rules configured for entity type: ${entityType}`,
      );
    }
    return rule;
  }

  canTransition(entityType: string, currentStatus: string, newStatus: string): boolean {
    const rule = this.getRule(entityType);
    const allowed = rule.transitions[currentStatus];
    if (!allowed) return false;
    return allowed.includes(newStatus);
  }

  validate(entityType: string, currentStatus: string, newStatus: string): void {
    if (!this.canTransition(entityType, currentStatus, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  async execute<T = any>(op: TransitionOperation<T>): Promise<T> {
    const { entityType, id, newStatus, companyId, currentUserRole, currentEmployeeId, before, after, include } = op;
    const rule = this.getRule(entityType);

    const entity = await (this.prisma as any)[rule.prismaModel].findFirst({
      where: { id, companyId },
    });

    if (!entity) {
      throw new BadRequestException(
        `${rule.entityName} not found with id: ${id}`,
      );
    }

    if (currentUserRole === 'EMPLOYEE' && rule.ownershipField && currentEmployeeId) {
      if (entity[rule.ownershipField] !== currentEmployeeId) {
        throw new BadRequestException(
          `Employees can only update status of their own ${rule.entityName.toLowerCase()}s`,
        );
      }
    }

    this.validate(entityType, entity.status ?? entity.state, newStatus);

    return this.prisma.$transaction(async (tx) => {
      if (before) {
        await before(tx, entity);
      }

      const updated = await (tx as any)[rule.prismaModel].update({
        where: { id },
        data: { status: newStatus },
        include,
      });

      if (after) {
        await after(updated);
      }

      return updated as T;
    });
  }
}
